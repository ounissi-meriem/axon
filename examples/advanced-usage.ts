import { Axon } from "axon-ai";

// Example using a local LLM server like LM Studio
const axon = new Axon({
    llm: {
        baseUrl: "http://localhost:1234/v1",
        model: "openai/gpt-oss-20b",
        provider: "lmstudio",
    },
    orchestrator: {
        maxCycles: 8, // Fewer cycles for faster completion
        broadcastThreshold: 8.5, // Higher threshold for more selective broadcasts
    },
});

// Custom event handlers for agent activity
axon.on("broadcast", (broadcast) => {
    console.log(
        "🔄 New broadcast synthesized:",
        broadcast.substring(0, 100) + "...",
    );
});

axon.on("agentThought", (agent, thought) => {
    console.log(`💭 ${agent}: ${thought.substring(0, 50)}...`);
});

// Process with streaming output
async function analyzeText(): Promise<void> {
    const result = await axon.processWithStreaming(
        "Analyze the implications of quantum computing for cybersecurity",
    );

    console.log("\n=== Final Summary ===");
    console.log(result.finalBroadcast);
    console.log("\n=== Stats ===");
    console.log(
        `Processing time: ${
            (result.stats.endTime.getTime() -
                result.stats.startTime.getTime()) /
            1000
        }s`,
    );
    console.log(`Agents involved: ${result.stats.totalAgents}`);
}

analyzeText().catch(console.error);
