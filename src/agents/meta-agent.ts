import { BaseAgent } from "./base-agent";
import { ThoughtChunk } from "../core/thought-chunk";
import { LlmService } from "../services/llm-service";
import { getAgentDefinitionsJsonSchema } from "./agent-schema";

/**
 * MetaAgent is responsible for analyzing the initial user prompt
 * and generating specialist agent definitions required to solve the problem.
 */
export class MetaAgent extends BaseAgent {
    private llmService: LlmService;

    constructor(id: string, llmService: LlmService) {
        const jsonSchema = getAgentDefinitionsJsonSchema();
        super({
            id,
            role: "MetaAgent",
            systemPrompt: `You are a meta-cognitive agent responsible for analyzing problems and determining the necessary specialist agents needed to solve them.

Your task is to:
1. Analyze the user's prompt in detail
2. Identify the key aspects of the problem that require different types of expertise
3. Generate a list of specialist agents with appropriate roles and system prompts that can collectively solve the problem

Your response must be a valid JSON array of agent definitions that follows this exact schema:
${jsonSchema}

The response should be ONLY the JSON array, with no additional text, markdown formatting, or code block indicators.

Focus on creating a diverse team of specialists that can approach the problem from different angles.`,
        });
        this.llmService = llmService;
    }

    /**
     * Process the user's initial prompt and determine required specialist agents
     * @param inputChunks Initial user prompt as a ThoughtChunk
     * @returns JSON string containing agent definitions
     */
    async process(inputChunks: ThoughtChunk[]): Promise<string> {
        // For the meta agent, we typically only have one input chunk - the user's prompt
        const userPrompt = inputChunks[0]?.content || "";

        if (!userPrompt) {
            throw new Error("No user prompt provided to MetaAgent");
        }

        const prompt = `
User Prompt: ${userPrompt}

Based on this prompt, generate a JSON array of specialist agent definitions that can collectively solve this problem.
    `;

        try {
            const response = await this.llmService.generateText(
                this.systemPrompt,
                prompt,
            );
            return response;
        } catch (error) {
            console.error("Error in MetaAgent processing:", error);
            return "Error: Unable to generate agent definitions";
        }
    }
}
