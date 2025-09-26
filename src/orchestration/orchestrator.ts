import { v4 as uuidv4 } from "uuid";
import { ThoughtChunk } from "../core/thought-chunk";
import { Workspace } from "../core/workspace";
import { MetaAgent } from "../agents/meta-agent";
import { SpecialistAgent } from "../agents/specialist-agent";
import { LlmService } from "../services/llm-service";
import { safeParse } from "../utils/json-parser";
import { AgentDefinitionsArraySchema } from "../agents/agent-schema";

/**
 * Configuration for the Orchestrator
 */
export interface OrchestratorConfig {
    maxCycles: number;
    broadcastThreshold: number;
}

/**
 * Result of a cognitive process
 */
export interface CognitiveResult {
    /** The final broadcast content */
    finalBroadcast: string;
    /** All broadcasts that occurred during the process */
    broadcasts: string[];
    /** The total number of cognitive cycles executed */
    cyclesExecuted: number;
    /** All thoughts in the workspace */
    thoughts: ThoughtChunk[];
    /** Statistics about the process */
    stats: {
        startTime: Date;
        endTime: Date;
        totalAgents: number;
    };
}

/**
 * Orchestrator manages the cognitive cycles and agent interactions
 */
export class Orchestrator {
    private workspace: Workspace;
    private metaAgent: MetaAgent;
    private specialists: Map<string, SpecialistAgent> = new Map();
    private llmService: LlmService;
    private config: OrchestratorConfig;

    constructor(
        workspace: Workspace,
        llmService: LlmService,
        config: OrchestratorConfig,
    ) {
        this.workspace = workspace;
        this.llmService = llmService;
        this.config = config;

        // Create meta-agent
        this.metaAgent = new MetaAgent(uuidv4(), this.llmService);
    }

    /**
     * Start the cognitive process with an initial user prompt
     * @param userPrompt The initial prompt from the user
     * @returns Result of the cognitive process including final broadcast
     */
    async start(userPrompt: string): Promise<CognitiveResult> {
        const startTime = new Date();
        const broadcasts: string[] = [];

        console.log("Starting cognitive process with user prompt:", userPrompt);

        // Create initial thought chunk from user prompt
        const initialChunk = new ThoughtChunk({
            content: userPrompt,
            activationEnergy: 5.0, // Start with high activation to ensure processing
            sourceAgentId: "user",
            parentIds: [],
        });

        // Add to workspace
        this.workspace.addChunk(initialChunk);

        // First, let the meta-agent analyze the prompt and define specialist agents
        try {
            await this.defineSpecialists([initialChunk]);
        } catch (error) {
            console.error(
                "Error defining specialists:",
                error instanceof Error ? error.message : String(error),
            );
            throw new Error(`Failed to define specialists`);
        }

        // Begin cognitive cycles
        let cycleCount = 0;
        let finalBroadcast = "";

        while (cycleCount < this.config.maxCycles) {
            console.log(
                `\n--- Beginning Cognitive Cycle ${cycleCount + 1} ---`,
            );

            // Run a single cognitive cycle
            const cycleResult = await this.runCognitiveCycle();

            // Store broadcast if one occurred
            if (cycleResult.broadcast) {
                broadcasts.push(cycleResult.broadcast);
                finalBroadcast = cycleResult.broadcast; // Update final broadcast
            }

            cycleCount++;
        }

        console.log(`\nCompleted ${cycleCount} cognitive cycles`);

        // Return comprehensive results
        return {
            finalBroadcast,
            broadcasts,
            cyclesExecuted: cycleCount,
            thoughts: this.workspace.getAllChunks(),
            stats: {
                startTime,
                endTime: new Date(),
                totalAgents: this.specialists.size + 1, // +1 for meta-agent
            },
        };
    }

    /**
     * Define specialist agents based on meta-agent analysis
     */
    private async defineSpecialists(
        inputChunks: ThoughtChunk[],
    ): Promise<void> {
        console.log("Meta-agent analyzing problem and defining specialists...");

        // Process the input with meta-agent
        const metaResponse = await this.metaAgent.process(inputChunks);

        // Create a thought chunk for the meta-agent's response
        const metaChunk = new ThoughtChunk({
            content: metaResponse,
            activationEnergy: 3.0,
            sourceAgentId: this.metaAgent.getId(),
            parentIds: inputChunks.map((chunk) => chunk.id),
        });

        // Add to workspace
        this.workspace.addChunk(metaChunk);

        // Parse specialist definitions using Zod for safe parsing
        const specialistDefinitions = safeParse(
            metaResponse,
            AgentDefinitionsArraySchema,
        );

        if (!specialistDefinitions) {
            console.error("Meta-agent response:", metaResponse);
            throw new Error("Failed to parse specialist definitions");
        }

        // Create specialist agents
        for (const def of specialistDefinitions) {
            const id = uuidv4();
            const specialist = new SpecialistAgent(
                id,
                def.role,
                def.systemPrompt,
                this.llmService,
            );

            this.specialists.set(id, specialist);
            console.log(`Created specialist agent: ${def.role} (${id})`);
        }

        console.log(
            `Defined ${specialistDefinitions.length} specialist agents`,
        );
    }

    /**
     * Run a single cognitive cycle
     * @returns Cycle result including broadcast if one occurred
     */
    private async runCognitiveCycle(): Promise<{ broadcast?: string }> {
        // Get most active chunks for this cycle
        const activeChunks = this.workspace.getMostActiveChunks(10);

        if (activeChunks.length === 0) {
            console.log("No active chunks in workspace, ending cycle");
            return {};
        }

        // Process chunks with all specialist agents in parallel
        const processingPromises = Array.from(this.specialists.values()).map(
            async (agent) => {
                try {
                    const thought = await agent.process(activeChunks);

                    // Generate embedding for the thought
                    let contentVector: number[] | undefined;
                    try {
                        contentVector = await this.llmService.generateEmbedding(
                            thought,
                        );
                    } catch (error) {
                        console.warn(
                            `Could not generate embedding for thought from ${agent.getRole()}:`,
                            error instanceof Error
                                ? error.message
                                : String(error),
                        );
                    }

                    // Create a new thought chunk with the result
                    const newChunk = this.workspace.createChunk(
                        thought,
                        contentVector,
                        agent.getId(),
                        activeChunks.map((chunk) => chunk.id),
                    );

                    console.log(
                        `Agent ${agent.getRole()} contributed a new thought (energy: ${newChunk.activationEnergy.toFixed(
                            2,
                        )})`,
                    );
                } catch (error) {
                    console.error(
                        `Error processing with agent ${agent.getRole()}:`,
                        error instanceof Error ? error.message : String(error),
                    );
                }
            },
        );

        // Wait for all agents to finish processing
        await Promise.all(processingPromises);

        // Decay activation energy of all chunks
        this.workspace.decayActivations();

        // Check for high-energy clusters that may trigger a broadcast
        const highEnergyCluster = this.workspace.findHighEnergyCluster();

        if (highEnergyCluster.length > 0) {
            console.log(
                `Found high-energy cluster with ${highEnergyCluster.length} chunks - initiating broadcast`,
            );
            const broadcast = await this.processBroadcast(highEnergyCluster);
            return { broadcast };
        } else {
            console.log("No high-energy clusters found this cycle");
            return {};
        }
    }

    /**
     * Process a conscious broadcast when a high-energy cluster is found
     * @param cluster The cluster of high-energy chunks
     * @returns The synthesized broadcast content
     */
    private async processBroadcast(cluster: ThoughtChunk[]): Promise<string> {
        console.log("Processing broadcast for high-energy cluster");

        // Format the cluster content for synthesis
        const clusterContent = cluster
            .map((chunk) => {
                return `[${chunk.sourceAgentId}]: ${chunk.content}`;
            })
            .join("\n\n");

        // Create prompt for synthesis
        const synthesisPrompt = `
You are the Global Workspace of a cognitive system. You've received these high-activation thoughts:

${clusterContent}

Your task is to synthesize these thoughts into a single, coherent summary that represents the current "conscious" state of the system.
Focus on integrating the most important insights while maintaining clarity and coherence.
`;

        try {
            // Generate synthesis using LLM
            const synthesis = await this.llmService.generateText(
                "You are a consciousness synthesizer that integrates multiple thoughts into a coherent whole. Your output should be concise, clear, and represent the most important aspects of the input thoughts.",
                synthesisPrompt,
            );

            // Generate embedding for synthesis
            let contentVector: number[] | undefined;
            try {
                contentVector = await this.llmService.generateEmbedding(
                    synthesis,
                );
            } catch (error) {
                console.warn(
                    "Could not generate embedding for synthesis:",
                    error instanceof Error ? error.message : String(error),
                );
            }

            // Create broadcast chunk with very high activation energy
            const broadcastChunk = this.workspace.createChunk(
                synthesis,
                contentVector,
                "broadcast",
                cluster.map((chunk) => chunk.id),
            );

            // Boost the activation energy of the broadcast chunk to ensure prominence
            broadcastChunk.boost(5.0);

            console.log("\n=== BROADCAST ===\n");
            console.log(synthesis);
            console.log("\n=================\n");

            return synthesis;
        } catch (error) {
            console.error(
                "Error during broadcast synthesis:",
                error instanceof Error ? error.message : String(error),
            );
            return "Error during broadcast synthesis";
        }
    }
}
