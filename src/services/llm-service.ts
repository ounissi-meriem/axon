import OpenAI from "openai";
import { ContextManager, TokenCounter } from "./context-manager";

/**
 * Configuration for the LLM service
 */
export interface LlmServiceConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    embeddingModel: string;
    temperature?: number;
    maxTokens?: number;
    maxContextTokens?: number;
    bufferTokens?: number;
}

/**
 * Service for interacting with the LLM API
 */
export class LlmService {
    private client: OpenAI;
    private config: LlmServiceConfig;
    private contextManager: ContextManager | null = null;
    private tokenCounter: TokenCounter;

    constructor(config: LlmServiceConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey || "dummy-key", // Local servers often don't require a real API key
            baseURL: config.baseUrl,
        });

        this.tokenCounter = new TokenCounter();

        if (config.maxContextTokens) {
            this.contextManager = new ContextManager(
                config.maxContextTokens,
                config.bufferTokens || 2000,
            );
        }
    }

    /**
     * Generate text using the LLM
     * @param systemPrompt The system prompt providing instructions
     * @param userPrompt The user prompt for the model
     * @returns Generated text response
     */
    async generateText(
        systemPrompt: string,
        userPrompt: string,
    ): Promise<string> {
        try {
            // Apply context management if enabled
            let managedUserPrompt = userPrompt;

            if (this.contextManager) {
                const systemPromptTokens = await this.tokenCounter.countTokens(
                    systemPrompt,
                );

                // If the user prompt is too large, we need to trim it
                const availableTokens =
                    await this.contextManager.getAvailableTokens(systemPrompt);

                if (
                    (await this.tokenCounter.countTokens(userPrompt)) >
                    availableTokens
                ) {
                    console.log(
                        `User prompt exceeds available context window (${availableTokens} tokens). Truncating...`,
                    );
                    managedUserPrompt = await this.tokenCounter.truncateText(
                        userPrompt,
                        availableTokens,
                    );
                }

                console.log(
                    `Context usage: System prompt: ${systemPromptTokens} tokens, User prompt: ${await this.tokenCounter.countTokens(
                        managedUserPrompt,
                    )} tokens`,
                );
            }

            const response = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: managedUserPrompt },
                ],
                temperature: this.config.temperature || 0.7,
                max_tokens: this.config.maxTokens,
            });

            return response.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("Error generating text from LLM:", error);
            throw error;
        }
    }

    /**
     * Generate embeddings for text content
     * @param text Text to generate embeddings for
     * @returns Vector embedding
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.client.embeddings.create({
                model: this.config.embeddingModel,
                input: text,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }
}
