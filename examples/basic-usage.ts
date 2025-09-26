import { Axon } from "axon-ai";

// Create a new instance of Axon with custom configuration
const axon = new Axon({
    workspace: {
        // Increase activation threshold for more selective broadcasts
        activationThreshold: 8.0,
        // Slower decay rate for longer-lasting thoughts
        decayRate: 0.97,
        // Keep default values for required properties
        baseActivationEnergy: 1.0,
        maxResonanceFactor: 2.0,
    },
    orchestrator: {
        // Run more cognitive cycles
        maxCycles: 15,
        // Required broadcast threshold
        broadcastThreshold: 10.0,
    },
});

// Process a prompt
async function runAxon(): Promise<void> {
    try {
        const result = await axon.process(
            "How could we design an eco-friendly transportation system for a smart city?",
            { verbose: true },
        );

        console.log("\n--- Final Results ---");
        console.log("Final broadcast:", result.finalBroadcast);
        console.log(`Total cycles: ${result.cyclesExecuted}`);
        console.log(`Total broadcasts: ${result.broadcasts.length}`);
        console.log(`Total thoughts: ${result.thoughts.length}`);

        // Get details on the specialists that were created
        const specialists = result.thoughts
            .filter(
                (thought) =>
                    thought.sourceAgentId !== "user" &&
                    thought.sourceAgentId !== "broadcast",
            )
            .map((thought) => thought.sourceAgentId);

        console.log("Specialists involved:", [...new Set(specialists)].length);
    } catch (error) {
        console.error("Error:", error);
    }
}

runAxon();
