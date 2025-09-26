import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import type { Document } from "@langchain/core/documents";
import { ThoughtChunk } from "../../core/thought-chunk";
import fs from "fs";
import path from "path";

/**
 * Configuration for the vector database
 */
export interface VectorDbConfig {
    /**
     * Path to store the vector database files
     */
    dbPath: string;

    /**
     * Dimensions of embedding vectors
     */
    dimensions: number;
}

/**
 * A class for managing vector embeddings in a persistent store
 */
export class VectorDb {
    private vectorStore: HNSWLib | null = null;
    private config: VectorDbConfig;
    private initialized = false;
    private embeddingsMap: Map<string, number[]> = new Map();

    constructor(config: VectorDbConfig) {
        this.config = config;

        // Ensure the directory exists
        if (!fs.existsSync(config.dbPath)) {
            fs.mkdirSync(config.dbPath, { recursive: true });
        }
    }

    /**
     * Initialize the vector store
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Try to load existing index if it exists
            const indexPath = path.join(this.config.dbPath, "index");

            if (fs.existsSync(indexPath)) {
                this.vectorStore = await HNSWLib.load(
                    indexPath,
                    // We need to provide an embeddings function, but we'll override it
                    {
                        embedDocuments: async (
                            texts: string[],
                        ): Promise<number[][]> => {
                            // This is a placeholder - we'll pass pre-computed embeddings
                            return texts.map(() =>
                                new Array(this.config.dimensions).fill(0),
                            );
                        },
                        embedQuery: async (
                            _text: string,
                        ): Promise<number[]> => {
                            // This is a placeholder - we'll pass pre-computed embeddings for queries
                            return new Array(this.config.dimensions).fill(0);
                        },
                    },
                );

                // Load the ID to vector mapping
                const mapPath = path.join(
                    this.config.dbPath,
                    "vector-map.json",
                );
                if (fs.existsSync(mapPath)) {
                    const mapData = JSON.parse(
                        fs.readFileSync(mapPath, "utf-8"),
                    );
                    this.embeddingsMap = new Map(Object.entries(mapData));
                }

                console.log(`Vector database loaded from ${indexPath}`);
            } else {
                // Create new empty vector store
                this.vectorStore = new HNSWLib(
                    // We need to provide an embeddings function, but we'll override it
                    {
                        embedDocuments: async (
                            texts: string[],
                        ): Promise<number[][]> => {
                            // This is a placeholder - we'll pass pre-computed embeddings
                            return texts.map(() =>
                                new Array(this.config.dimensions).fill(0),
                            );
                        },
                        embedQuery: async (
                            _text: string,
                        ): Promise<number[]> => {
                            // This is a placeholder - we'll pass pre-computed embeddings for queries
                            return new Array(this.config.dimensions).fill(0);
                        },
                    },
                    {
                        space: "cosine",
                        numDimensions: this.config.dimensions,
                    },
                );
                console.log("Created new vector database");
            }

            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize vector store:", error);
            throw error;
        }
    }

    /**
     * Add a ThoughtChunk to the vector database
     * @param chunk ThoughtChunk to add
     */
    async addChunk(chunk: ThoughtChunk): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!chunk.contentVector) {
            console.warn(
                `Cannot add chunk ${chunk.id} to vector db: missing contentVector`,
            );
            return;
        }

        try {
            // Store in the embeddings map
            this.embeddingsMap.set(chunk.id, chunk.contentVector);

            // Create document
            const document = {
                pageContent: chunk.content,
                metadata: {
                    id: chunk.id,
                    sourceAgentId: chunk.sourceAgentId,
                    activationEnergy: chunk.activationEnergy,
                    createdAt: chunk.createdAt.toISOString(),
                    parentIds: JSON.stringify(chunk.parentIds),
                },
            };

            // Add to vector store using the addVectors method
            if (chunk.contentVector) {
                await this.vectorStore!.addVectors(
                    [chunk.contentVector],
                    [document],
                );
            }

            console.log(`Added chunk ${chunk.id} to vector database`);
        } catch (error) {
            console.error(
                `Error adding chunk ${chunk.id} to vector database:`,
                error,
            );
        }
    }

    /**
     * Find similar chunks to the given vector
     * @param vector The query vector
     * @param k Number of results to return
     * @returns Array of chunk IDs and their similarity scores
     */
    async findSimilar(
        vector: number[],
        k: number = 5,
    ): Promise<Array<{ id: string; score: number }>> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const results =
                await this.vectorStore!.similaritySearchVectorWithScore(
                    vector,
                    k,
                );
            return results.map(([doc, score]: [Document, number]) => ({
                id: doc.metadata.id as string,
                score: score,
            }));
        } catch (error) {
            console.error("Error finding similar chunks:", error);
            return [];
        }
    }

    /**
     * Get the vector for a specific chunk ID
     * @param id Chunk ID to retrieve
     * @returns The vector or undefined if not found
     */
    getVector(id: string): number[] | undefined {
        return this.embeddingsMap.get(id);
    }

    /**
     * Save the vector database to disk
     */
    async save(): Promise<void> {
        if (!this.initialized || !this.vectorStore) {
            return;
        }

        try {
            // Save the vector store
            const indexPath = path.join(this.config.dbPath, "index");
            await this.vectorStore.save(indexPath);

            // Save the ID to vector mapping
            const mapPath = path.join(this.config.dbPath, "vector-map.json");
            const mapObject = Object.fromEntries(this.embeddingsMap);
            fs.writeFileSync(mapPath, JSON.stringify(mapObject));

            console.log(`Vector database saved to ${indexPath}`);
        } catch (error) {
            console.error("Error saving vector database:", error);
        }
    }
}
