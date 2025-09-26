import { z } from "zod";
import { zodSchemaToJsonString } from "../utils/json-parser";

/**
 * Zod schema for agent definitions
 */
export const AgentDefinitionSchema = z.object({
    role: z
        .string()
        .min(1)
        .describe("A short descriptive name for the agent's area of expertise"),
    systemPrompt: z
        .string()
        .min(10)
        .describe(
            "A detailed prompt that will guide the specialist agent's thinking and responses",
        ),
});

/**
 * Zod schema for an array of agent definitions
 */
export const AgentDefinitionsArraySchema = z.array(AgentDefinitionSchema);

/**
 * Get the JSON schema string for agent definitions
 * Used in prompts to inform the LLM of the expected structure
 */
export function getAgentDefinitionsJsonSchema(): string {
    return zodSchemaToJsonString(AgentDefinitionsArraySchema);
}
