import { LlmService } from "./llm-service";

/**
 * Service for generating and managing vector embeddings
 */
export class EmbeddingService {
    private llmService: LlmService;
    private cache: Map<string, number[]> = new Map();

    constructor(llmService: LlmService) {
        this.llmService = llmService;
    }

    /**
     * Get embedding for text content, using cache if available
     * @param text The text to generate embedding for
     * @returns Promise resolving to vector embedding
     */
    async getEmbedding(text: string): Promise<number[]> {
        // Use a truncated version of text as cache key
        const cacheKey = text.substring(0, 100);

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // Generate new embedding
        try {
            const embedding = await this.llmService.generateEmbedding(text);
            // Store in cache
            this.cache.set(cacheKey, embedding);
            return embedding;
        } catch (error) {
            console.error("Error getting embedding:", error);
            throw error;
        }
    }

    /**
     * Calculate cosine similarity between two embeddings
     * @param vecA First embedding vector
     * @param vecB Second embedding vector
     * @returns Similarity score between 0 and 1
     */
    calculateSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error("Vectors must have the same dimensions");
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Clear the embedding cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}
