import { ThoughtChunk } from "./thought-chunk";

/**
 * Configuration options for the Workspace
 */
export interface WorkspaceConfig {
    decayRate: number;
    activationThreshold: number;
    baseActivationEnergy: number;
    maxResonanceFactor: number;
}

/**
 * The Workspace is the central component of the Axon system,
 * managing all ThoughtChunks and their activation dynamics.
 */
export class Workspace {
    private chunks: Map<string, ThoughtChunk> = new Map();
    private config: WorkspaceConfig;

    constructor(config: WorkspaceConfig) {
        this.config = config;
    }

    /**
     * Add a new ThoughtChunk to the workspace
     * @param chunk The chunk to add
     */
    addChunk(chunk: ThoughtChunk): void {
        this.chunks.set(chunk.id, chunk);
    }

    /**
     * Create and add a new ThoughtChunk with parent resonance calculation
     * @param content The text content
     * @param contentVector The embedding vector
     * @param sourceAgentId The ID of the agent that created the chunk
     * @param parentIds IDs of parent chunks
     */
    createChunk(
        content: string,
        contentVector: number[] | undefined,
        sourceAgentId: string,
        parentIds: string[],
    ): ThoughtChunk {
        // Calculate initial activation energy based on parent resonance
        let initialActivation = this.config.baseActivationEnergy;

        if (contentVector && parentIds.length > 0) {
            const resonanceFactor = this.calculateResonance(
                contentVector,
                parentIds,
            );
            initialActivation += resonanceFactor;
        }

        const chunk = new ThoughtChunk({
            content,
            contentVector,
            activationEnergy: initialActivation,
            sourceAgentId,
            parentIds,
        });

        this.addChunk(chunk);
        return chunk;
    }

    /**
     * Calculate resonance factor based on semantic similarity to parent chunks
     * @param contentVector The embedding vector of the new chunk
     * @param parentIds IDs of parent chunks to calculate resonance with
     */
    private calculateResonance(
        contentVector: number[],
        parentIds: string[],
    ): number {
        let totalResonance = 0;
        let validParentCount = 0;

        for (const parentId of parentIds) {
            const parentChunk = this.chunks.get(parentId);
            if (!parentChunk || !parentChunk.contentVector) continue;

            const similarity = this.cosineSimilarity(
                contentVector,
                parentChunk.contentVector,
            );
            // Weight similarity by the parent's activation energy
            totalResonance += similarity * parentChunk.activationEnergy;
            validParentCount++;
        }

        if (validParentCount === 0) return 0;

        // Normalize and scale the resonance factor
        const averageResonance = totalResonance / validParentCount;
        return averageResonance * this.config.maxResonanceFactor;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
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
     * Apply decay to all chunks in the workspace
     */
    decayActivations(): void {
        for (const chunk of this.chunks.values()) {
            chunk.decay(this.config.decayRate);
        }
    }

    /**
     * Get all chunks in the workspace
     */
    getAllChunks(): ThoughtChunk[] {
        return Array.from(this.chunks.values());
    }

    /**
     * Get chunk by ID
     * @param id The chunk ID
     */
    getChunk(id: string): ThoughtChunk | undefined {
        return this.chunks.get(id);
    }

    /**
     * Get the most active chunks in the workspace
     * @param limit Maximum number of chunks to return
     */
    getMostActiveChunks(limit = 10): ThoughtChunk[] {
        return Array.from(this.chunks.values())
            .sort((a, b) => b.activationEnergy - a.activationEnergy)
            .slice(0, limit);
    }

    /**
     * Find clusters of connected chunks with high activation energy
     * @returns The highest energy cluster of chunks if above threshold, or empty array
     */
    findHighEnergyCluster(): ThoughtChunk[] {
        const activeChunks = this.getMostActiveChunks(30);

        // Simple clustering algorithm based on parent-child relationships
        const clusters: ThoughtChunk[][] = [];
        const visited = new Set<string>();

        for (const chunk of activeChunks) {
            if (visited.has(chunk.id)) continue;

            const cluster = this.exploreCluster(chunk, visited, activeChunks);
            if (cluster.length > 0) {
                clusters.push(cluster);
            }
        }

        // Calculate total activation for each cluster
        const clusterActivations = clusters.map((cluster) => ({
            cluster,
            totalActivation: cluster.reduce(
                (sum, chunk) => sum + chunk.activationEnergy,
                0,
            ),
        }));

        // Sort clusters by total activation
        clusterActivations.sort(
            (a, b) => b.totalActivation - a.totalActivation,
        );

        // Return highest energy cluster if it exceeds the threshold
        if (
            clusterActivations.length > 0 &&
            clusterActivations[0].totalActivation >=
                this.config.activationThreshold
        ) {
            return clusterActivations[0].cluster;
        }

        return [];
    }

    /**
     * Explore a cluster from a starting chunk using BFS
     */
    private exploreCluster(
        startChunk: ThoughtChunk,
        visited: Set<string>,
        activeChunks: ThoughtChunk[],
    ): ThoughtChunk[] {
        const cluster: ThoughtChunk[] = [];
        const queue: ThoughtChunk[] = [startChunk];
        const activeChunkMap = new Map(
            activeChunks.map((chunk) => [chunk.id, chunk]),
        );

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current.id)) continue;

            visited.add(current.id);
            cluster.push(current);

            // Add parent chunks to queue if they are active
            for (const parentId of current.parentIds) {
                const parentChunk = activeChunkMap.get(parentId);
                if (parentChunk && !visited.has(parentId)) {
                    queue.push(parentChunk);
                }
            }

            // Add child chunks to queue if they are active
            for (const potentialChild of activeChunks) {
                if (
                    !visited.has(potentialChild.id) &&
                    potentialChild.parentIds.includes(current.id)
                ) {
                    queue.push(potentialChild);
                }
            }
        }

        return cluster;
    }
}
