import { BaseAgent } from "./base-agent";
import { ThoughtChunk } from "../core/thought-chunk";
import { LlmService } from "../services/llm-service";

/**
 * SpecialistAgent represents an agent with a specific role and expertise
 * created by the MetaAgent to solve parts of the problem.
 */
export class SpecialistAgent extends BaseAgent {
    private llmService: LlmService;

    constructor(
        id: string,
        role: string,
        systemPrompt: string,
        llmService: LlmService,
    ) {
        super({ id, role, systemPrompt });
        this.llmService = llmService;
    }

    /**
     * Process input chunks and generate a new thought based on the agent's expertise
     * @param inputChunks ThoughtChunks provided as context
     * @returns Promise resolving to the generated thought content
     */
    async process(inputChunks: ThoughtChunk[]): Promise<string> {
        const formattedInput = this.formatInputChunks(inputChunks);

        const prompt = `
As a ${this.role}, analyze the following thoughts from other agents and contribute your specialized insight:

${formattedInput}

Based on your expertise, generate a thoughtful response that builds on the existing ideas and contributes new insights.
`;

        try {
            const response = await this.llmService.generateText(
                this.systemPrompt,
                prompt,
            );
            return response;
        } catch (error) {
            console.error(`Error in ${this.role} processing:`, error);
            return `Error: Unable to generate specialist response for ${this.role}`;
        }
    }
}
