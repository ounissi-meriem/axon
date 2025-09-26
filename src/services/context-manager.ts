import { get_encoding, Tiktoken, TiktokenEncoding } from "tiktoken";

/**
 * Service for token counting and context management
 */
export class TokenCounter {
    private tokenizer: Tiktoken | null = null;
    private encodingName: TiktokenEncoding;

    constructor(encodingName: TiktokenEncoding = "cl100k_base") {
        this.encodingName = encodingName;
    }

    /**
     * Initialize the tokenizer
     */
    private async ensureTokenizer(): Promise<void> {
        if (!this.tokenizer) {
            try {
                this.tokenizer = get_encoding(this.encodingName);
            } catch (error) {
                console.error(`Error initializing tokenizer: ${error}`);
                throw error;
            }
        }
    }

    /**
     * Count tokens in a text string
     * @param text The text to count tokens for
     * @returns Number of tokens
     */
    async countTokens(text: string): Promise<number> {
        await this.ensureTokenizer();
        const encoded = this.tokenizer!.encode(text);
        return encoded.length;
    }

    /**
     * Count tokens in multiple text segments
     * @param texts Array of text segments
     * @returns Array of token counts
     */
    async countTokensArray(texts: string[]): Promise<number[]> {
        await this.ensureTokenizer();
        return texts.map((text) => {
            const encoded = this.tokenizer!.encode(text);
            return encoded.length;
        });
    }

    /**
     * Truncate a text string to a maximum number of tokens
     * @param text Text to truncate
     * @param maxTokens Maximum number of tokens
     * @returns Truncated text
     */
    async truncateText(text: string, maxTokens: number): Promise<string> {
        await this.ensureTokenizer();
        const tokens = this.tokenizer!.encode(text);

        if (tokens.length <= maxTokens) {
            return text;
        }

        const truncatedTokens = tokens.slice(0, maxTokens);
        // The decode function might return Uint8Array instead of string, so we need to convert it
        const decoded = this.tokenizer!.decode(truncatedTokens);
        return typeof decoded === "string"
            ? decoded
            : new TextDecoder().decode(decoded);
    }
}

/**
 * Helper for managing LLM context windows
 */
export class ContextManager {
    private tokenCounter: TokenCounter;
    private maxContextTokens: number;
    private bufferTokens: number;

    constructor(maxContextTokens: number, bufferTokens: number = 1000) {
        this.tokenCounter = new TokenCounter();
        this.maxContextTokens = maxContextTokens;
        this.bufferTokens = bufferTokens;
    }

    /**
     * Calculate the available context window size for new content
     * @param existingContent Content already in the context window
     * @returns Available tokens for new content
     */
    async getAvailableTokens(existingContent: string): Promise<number> {
        const usedTokens = await this.tokenCounter.countTokens(existingContent);
        return Math.max(
            0,
            this.maxContextTokens - usedTokens - this.bufferTokens,
        );
    }

    /**
     * Calculate the available context window size for new content when multiple segments exist
     * @param existingContentSegments Array of content segments already in the context window
     * @returns Available tokens for new content
     */
    async getAvailableTokensFromSegments(
        existingContentSegments: string[],
    ): Promise<number> {
        const tokenCounts = await this.tokenCounter.countTokensArray(
            existingContentSegments,
        );
        const totalUsedTokens = tokenCounts.reduce(
            (sum, count) => sum + count,
            0,
        );
        return Math.max(
            0,
            this.maxContextTokens - totalUsedTokens - this.bufferTokens,
        );
    }

    /**
     * Select the most important segments that will fit within the context window
     * @param segments Array of content segments
     * @param importanceScores Array of importance scores for each segment (higher is more important)
     * @param systemPromptTokens Number of tokens used by system prompt
     * @returns Array of selected segment indices
     */
    async selectContextSegments(
        segments: string[],
        importanceScores: number[],
        systemPromptTokens: number,
    ): Promise<number[]> {
        if (segments.length !== importanceScores.length) {
            throw new Error(
                "Segments and importance scores must have the same length",
            );
        }

        const tokenCounts = await this.tokenCounter.countTokensArray(segments);
        const availableTokens =
            this.maxContextTokens - systemPromptTokens - this.bufferTokens;

        // Create items with index, tokens, and importance
        const items = segments.map((_, i) => ({
            index: i,
            tokens: tokenCounts[i],
            importance: importanceScores[i],
            // Calculate value density (importance per token)
            density: importanceScores[i] / tokenCounts[i],
        }));

        // Sort by importance density (highest first)
        items.sort((a, b) => b.density - a.density);

        const selectedIndices: number[] = [];
        let usedTokens = 0;

        for (const item of items) {
            if (usedTokens + item.tokens <= availableTokens) {
                selectedIndices.push(item.index);
                usedTokens += item.tokens;
            }
        }

        // Re-sort by original index
        selectedIndices.sort((a, b) => a - b);
        return selectedIndices;
    }
}
