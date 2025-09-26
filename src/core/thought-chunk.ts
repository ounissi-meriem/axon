import { nanoid } from "nanoid";

/**
 * ThoughtChunk is the fundamental data unit of the Axon system
 * representing a discrete unit of thought with activation energy.
 */
export interface ThoughtChunkProps {
    id?: string;
    content: string;
    contentVector?: number[];
    activationEnergy: number;
    sourceAgentId: string;
    parentIds: string[];
    createdAt?: Date;
}

/**
 * Type definition for serialized ThoughtChunk
 */
export interface SerializedThoughtChunk {
    id: string;
    content: string;
    contentVector?: number[];
    activationEnergy: number;
    sourceAgentId: string;
    parentIds: string[];
    createdAt: string;
}

export class ThoughtChunk {
    readonly id: string;
    readonly content: string;
    readonly contentVector: number[] | undefined;
    activationEnergy: number;
    readonly sourceAgentId: string;
    readonly parentIds: string[];
    readonly createdAt: Date;

    constructor(props: ThoughtChunkProps) {
        this.id = props.id || nanoid();
        this.content = props.content;
        this.contentVector = props.contentVector;
        this.activationEnergy = props.activationEnergy;
        this.sourceAgentId = props.sourceAgentId;
        this.parentIds = props.parentIds || [];
        this.createdAt = props.createdAt || new Date();
    }

    /**
     * Decrease the activation energy by applying the decay factor
     * @param decayRate The rate at which activation energy decays (0-1)
     */
    decay(decayRate: number): void {
        this.activationEnergy *= decayRate;
    }

    /**
     * Increase activation energy by a specified amount
     * @param amount The amount to boost the activation energy
     */
    boost(amount: number): void {
        this.activationEnergy += amount;
    }

    /**
     * Serialize the ThoughtChunk to a plain JavaScript object
     */
    toJSON(): SerializedThoughtChunk {
        return {
            id: this.id,
            content: this.content,
            contentVector: this.contentVector,
            activationEnergy: this.activationEnergy,
            sourceAgentId: this.sourceAgentId,
            parentIds: this.parentIds,
            createdAt: this.createdAt.toISOString(),
        };
    }

    /**
     * Create a ThoughtChunk instance from a plain JavaScript object
     * @param data Serialized ThoughtChunk data
     */
    static fromJSON(data: SerializedThoughtChunk): ThoughtChunk {
        return new ThoughtChunk({
            id: data.id,
            content: data.content,
            contentVector: data.contentVector,
            activationEnergy: data.activationEnergy,
            sourceAgentId: data.sourceAgentId,
            parentIds: data.parentIds,
            createdAt: new Date(data.createdAt),
        });
    }
}
