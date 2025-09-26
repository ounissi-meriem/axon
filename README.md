# 🧠 Axon

**Axon is an emergent cognitive architecture for multi-agent systems based on Global Workspace Theory.**

```typescript
import { Axon } from "axon-ai";

const axon = new Axon({
    llm: {
        baseUrl: "http://localhost:1234/v1",
        model: "qwen/qwen3-4b-2507",
        embeddingModel: "text-embedding-nomic-embed-text-v1.5",
        temperature: 0.7,
        provider: "lmstudio",
    },
});

const result = await axon.process("Brainstorm sustainable energy solutions");

console.log(result.finalBroadcast);
```

## 🌟 Features

-   **Self-organizing** - No predefined workflows or hardcoded agent interactions
-   **Emergent cognition** - Thoughts compete for attention in a shared workspace
-   **Flexible configuration** - Use any LLM provider (OpenAI, local, etc.)
-   **Dynamic specialists** - Meta-agent creates specialists tailored to each problem
-   **Streaming support** - Real-time observation of the cognitive process

## 🚀 Installation

```bash
yarn add axon-ai
# or
pnpm add axon-ai
```

## 🧩 Core Concepts

-   **ThoughtChunk**: The fundamental data unit with content, embeddings, activation energy, and lineage
-   **Workspace**: An active medium managing ThoughtChunks, decay, and cluster detection
-   **Agents**: Specialist processing units with specific roles and prompts
-   **Meta-Agent**: Analyzes the initial prompt and spawns appropriate specialist agents
-   **Orchestrator**: Manages cognitive cycles and the broadcast mechanism

## 📐 Architecture

The system operates in cognitive cycles:

1. User provides an initial prompt
2. Meta-Agent defines specialist agents needed
3. Each cycle:
    - Agents receive the most active ThoughtChunks
    - Agents generate new thoughts
    - New thoughts are added to the Workspace
    - All thoughts decay in energy
    - High-energy clusters trigger a broadcast
4. Process continues for a defined number of cycles

## 📚 Usage

### Basic Example

```typescript
import { Axon } from "axon-ai";

// Create a new Axon instance with custom config
const axon = new Axon({
    llm: {
        apiKey: "your-api-key", // Not needed for local LLMs
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o",
        embeddingModel: "text-embedding-3-large",
    },
});

// Process a prompt
async function main() {
    const result = await axon.process(
        "Design a sustainable transportation system",
        { verbose: true },
    );

    console.log(result.finalBroadcast);
    console.log(`Total thoughts: ${result.thoughts.length}`);
}

main();
```

### Local LLM Example

```typescript
// Using a local LLM server (LM Studio, Ollama, etc.)
const axon = new Axon({
    llm: {
        baseUrl: "http://localhost:1234/v1",
        model: "mistralai/mixtral-8x7b-instruct",
        provider: "lmstudio",
    },
});

const result = await axon.process("Analyze quantum computing impacts");
```

## ⚙️ Configuration

Axon can be fully configured through code:

```typescript
const axon = new Axon({
    llm: {
        apiKey: "sk-...",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o",
        embeddingModel: "text-embedding-3-large",
        temperature: 0.7,
        provider: "openai",
    },
    context: {
        maxContextTokens: 32000,
        bufferTokens: 2000,
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
});
```

## 📄 Advanced Features

### Custom Event Handlers

```typescript
// Listen for specific events
axon.on("broadcast", (broadcast) => {
    console.log("New broadcast synthesized:", broadcast);
});

axon.on("agentThought", (agent, thought) => {
    console.log(`Agent ${agent} thinking: ${thought}`);
});
```

### Streaming Results

```typescript
const result = await axon.processWithStreaming(
    "Analyze the implications of quantum computing",
);
```

### Advanced Workspace Manipulation

```typescript
// Access the workspace directly
const workspace = axon.getWorkspace();

// Add custom thoughts
workspace.createChunk(
    "Important insight to consider",
    undefined,
    "custom-source",
    [],
);

// Get most active thoughts
const activeThoughts = workspace.getMostActiveChunks(5);
```

## 🧪 Examples

The package includes several examples demonstrating different usage scenarios:

```bash
# Run the basic example
yarn example:basic

# Run the advanced example with events and streaming
yarn example:advanced
```

Check the [examples directory](./examples/) for more detailed examples and documentation.

## 🔬 Research & Theory

Axon implements Global Workspace Theory (GWT) as proposed by Bernard Baars and further developed by Stan Franklin in the LIDA cognitive architecture. GWT suggests that consciousness emerges from a competition among specialized cognitive processes, with winners being "broadcast" globally to the entire system.

## 📜 License

MIT
