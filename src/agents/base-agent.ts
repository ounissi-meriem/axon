import { ThoughtChunk } from "../core/thought-chunk";

/**
 * Agent definition containing role and system prompt
 */
export interface AgentDefinition {
    id: string;
    role: string;
    systemPrompt: string;
}

/**
 * Base Agent interface for all agent types in the system
 */
export interface Agent {
    /**
     * Get the unique ID of this agent
     */
    getId(): string;

    /**
     * Get the role/type of this agent
     */
    getRole(): string;

    /**
     * Process input chunks and generate a new thought
     * @param inputChunks ThoughtChunks provided as context
     * @returns Promise resolving to the generated thought content
     */
    process(inputChunks: ThoughtChunk[]): Promise<string>;
}

/**
 * Base abstract class for all agent implementations
 */
export abstract class BaseAgent implements Agent {
    protected id: string;
    protected role: string;
    protected systemPrompt: string;

    constructor(definition: AgentDefinition) {
        this.id = definition.id;
        this.role = definition.role;
        this.systemPrompt = definition.systemPrompt;
    }

    getId(): string {
        return this.id;
    }

    getRole(): string {
        return this.role;
    }

    /**
     * Process input chunks and generate a new thought
     * Must be implemented by concrete agent classes
     */
    abstract process(inputChunks: ThoughtChunk[]): Promise<string>;

    /**
     * Format input chunks into a string representation for LLM prompt
     * @param chunks Array of ThoughtChunks to format
     * @returns Formatted string representation
     */
    protected formatInputChunks(chunks: ThoughtChunk[]): string {
        if (chunks.length === 0) return "No input chunks available.";

        return chunks
            .map((chunk) => {
                return `[Thought from ${
                    chunk.sourceAgentId
                } (Energy: ${chunk.activationEnergy.toFixed(2)})]: ${
                    chunk.content
                }`;
            })
            .join("\n\n");
    }
}
