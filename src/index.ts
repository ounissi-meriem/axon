import {
    AxonConfig,
    AxonConfigInput,
    createConfig,
    DEFAULT_CONFIG,
} from "./config";
import { Workspace } from "./core/workspace";
import { LlmService } from "./services/llm-service";
import { Orchestrator, CognitiveResult } from "./orchestration/orchestrator";
import { ThoughtChunk } from "./core/thought-chunk";
import { MetaAgent } from "./agents/meta-agent";
import { SpecialistAgent } from "./agents/specialist-agent";
import { BaseAgent } from "./agents/base-agent";
import { EventEmitter } from "events";

/**
 * Interface for Axon event types
 */
export interface AxonEvents {
    broadcast: (broadcast: string) => void;
    agentThought: (agentId: string, thought: string) => void;
    cycleCompleted: (cycleNumber: number) => void;
    processingStarted: (prompt: string) => void;
    processingCompleted: (result: CognitiveResult) => void;
    error: (error: Error) => void;
}

/**
 * Main Axon class that serves as the entry point to the library
 */
export class Axon extends EventEmitter {
    private config: AxonConfig;
    private workspace: Workspace;
    private llmService: LlmService;
    private orchestrator: Orchestrator;

    /**
     * Create a new Axon instance
     *
     * @param config Optional configuration to override defaults
     */
    constructor(config: AxonConfigInput = {}) {
        super();

        // Create configuration by merging defaults with user-provided config
        this.config = createConfig(config);

        // Initialize LLM service
        this.llmService = new LlmService({
            apiKey: this.config.llm.apiKey,
            baseUrl: this.config.llm.baseUrl,
            model: this.config.llm.model,
            embeddingModel: this.config.llm.embeddingModel,
            temperature: this.config.llm.temperature,
            maxContextTokens: this.config.context.maxContextTokens,
            bufferTokens: this.config.context.bufferTokens,
        });

        // Initialize workspace
        this.workspace = new Workspace({
            decayRate: this.config.workspace.decayRate,
            activationThreshold: this.config.workspace.activationThreshold,
            baseActivationEnergy: this.config.workspace.baseActivationEnergy,
            maxResonanceFactor: this.config.workspace.maxResonanceFactor,
        });

        // Initialize orchestrator
        this.orchestrator = new Orchestrator(this.workspace, this.llmService, {
            maxCycles: this.config.orchestrator.maxCycles,
            broadcastThreshold: this.config.orchestrator.broadcastThreshold,
        });
    }

    /**
     * Override the default on method with typed events
     */
    public on<K extends keyof AxonEvents>(
        event: K,
        listener: AxonEvents[K]
    ): this {
        return super.on(event, listener);
    }

    /**
     * Override the default emit method with typed events
     */
    public emit<K extends keyof AxonEvents>(
        event: K,
        ...args: Parameters<AxonEvents[K]>
    ): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Process a prompt through the Axon cognitive architecture
     *
     * @param prompt The user prompt to process
     * @param options Optional processing options
     * @returns The results of the cognitive processing
     */
    async process(
        prompt: string,
        options: { verbose?: boolean } = {}
    ): Promise<CognitiveResult> {
        const { verbose = false } = options;

        // Emit processing started event
        this.emit("processingStarted", prompt);

        if (verbose) {
            console.log("\n====================");
            console.log("Starting Axon with prompt:");
            console.log(prompt);
            console.log("====================\n");
        }

        try {
            const result = await this.orchestrator.start(prompt);

            // Emit successful completion event
            this.emit("processingCompleted", result);

            if (verbose) {
                console.log("\nAxon process completed successfully");
            }

            return result;
        } catch (error) {
            // Emit error event
            this.emit(
                "error",
                error instanceof Error ? error : new Error(String(error))
            );

            if (verbose) {
                console.error(
                    "Error in Axon process:",
                    error instanceof Error ? error.message : String(error)
                );
            }
            throw error;
        }
    }

    /**
     * Process a prompt with streaming output
     *
     * @param prompt The user prompt to process
     * @param options Optional processing options
     * @returns The results of the cognitive processing
     */
    async processWithStreaming(
        prompt: string,
        options: { verbose?: boolean } = {}
    ): Promise<CognitiveResult> {
        // Setup streaming event handlers first
        const originalProcessBroadcast = this.orchestrator["processBroadcast"];
        const originalRunCognitiveCycle =
            this.orchestrator["runCognitiveCycle"];
        let cycleCount = 0;

        // Override the processBroadcast method to emit events
        this.orchestrator["processBroadcast"] = async (
            cluster: ThoughtChunk[]
        ): Promise<string> => {
            const result = await originalProcessBroadcast.call(
                this.orchestrator,
                cluster
            );

            // Emit the broadcast event
            this.emit("broadcast", result);

            return result;
        };

        // Override the runCognitiveCycle method to emit events
        this.orchestrator["runCognitiveCycle"] = async (): Promise<{
            broadcast?: string;
        }> => {
            cycleCount++;

            // Emit cycle completed event
            this.emit("cycleCompleted", cycleCount);

            const result = await originalRunCognitiveCycle.apply(
                this.orchestrator
            );
            return result;
        };

        try {
            // Process the prompt normally, which will now emit events
            const result = await this.process(prompt, options);
            return result;
        } finally {
            // Restore original methods
            this.orchestrator["processBroadcast"] = originalProcessBroadcast;
            this.orchestrator["runCognitiveCycle"] = originalRunCognitiveCycle;
        }
    }

    /**
     * Get the current workspace state
     */
    getWorkspace(): Workspace {
        return this.workspace;
    }

    /**
     * Get the LLM service
     */
    getLlmService(): LlmService {
        return this.llmService;
    }

    /**
     * Update the Axon configuration
     *
     * @param newConfig New partial configuration to apply
     */
    updateConfig(newConfig: AxonConfigInput): void {
        this.config = createConfig({
            ...this.config,
            ...newConfig,
        });
    }
}

// Export all the main components for direct access
export {
    AxonConfig,
    AxonConfigInput,
    DEFAULT_CONFIG,
    createConfig,
    Workspace,
    LlmService,
    Orchestrator,
    CognitiveResult,
    ThoughtChunk,
    MetaAgent,
    SpecialistAgent,
    BaseAgent,
};
