/**
 * LLM Configuration
 */
export interface LlmConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    embeddingModel: string;
    temperature: number;
    provider?: string;
}

/**
 * Context Management Configuration
 */
export interface ContextConfig {
    maxContextTokens: number;
    bufferTokens: number;
}

/**
 * Workspace Configuration
 */
export interface WorkspaceConfig {
    decayRate: number;
    activationThreshold: number;
    baseActivationEnergy: number;
    maxResonanceFactor: number;
}

/**
 * Orchestrator Configuration
 */
export interface OrchestratorConfig {
    maxCycles: number;
    broadcastThreshold: number;
}

/**
 * Configuration for the Axon library
 */
export interface AxonConfig {
    // LLM Service Configuration
    llm: LlmConfig;

    // Context Management
    context: ContextConfig;

    // Workspace Configuration
    workspace: WorkspaceConfig;

    // Orchestrator Configuration
    orchestrator: OrchestratorConfig;
}

/**
 * Default configuration for Axon
 */
export const DEFAULT_CONFIG: AxonConfig = {
    llm: {
        apiKey: "",
        baseUrl: "http://localhost:1234/v1",
        model: "qwen/qwen3-4b-2507",
        embeddingModel: "text-embedding-nomic-embed-text-v1.5",
        temperature: 0.7,
        provider: "lmstudio",
    },
    context: {
        maxContextTokens: 4096,
        bufferTokens: 3000,
    },
    workspace: {
        decayRate: 0.95,
        activationThreshold: 7.0,
        baseActivationEnergy: 1.0,
        maxResonanceFactor: 2.0,
    },
    orchestrator: {
        maxCycles: 10,
        broadcastThreshold: 10.0,
    },
};

/**
 * Full Axon configuration with all options partial
 */
export interface AxonConfigInput {
    llm?: Partial<LlmConfig>;
    context?: Partial<ContextConfig>;
    workspace?: Partial<WorkspaceConfig>;
    orchestrator?: Partial<OrchestratorConfig>;
}

/**
 * Create a configuration by merging user-provided config with defaults
 *
 * @param userConfig Partial configuration to override defaults
 * @returns Complete configuration with defaults applied for missing values
 */
export function createConfig(userConfig: AxonConfigInput = {}): AxonConfig {
    return {
        llm: {
            ...DEFAULT_CONFIG.llm,
            ...(userConfig.llm || {}),
        },
        context: {
            ...DEFAULT_CONFIG.context,
            ...(userConfig.context || {}),
        },
        workspace: {
            ...DEFAULT_CONFIG.workspace,
            ...(userConfig.workspace || {}),
        },
        orchestrator: {
            ...DEFAULT_CONFIG.orchestrator,
            ...(userConfig.orchestrator || {}),
        },
    };
}
