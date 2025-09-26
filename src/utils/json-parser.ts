import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Extract JSON from LLM response, handling markdown code blocks and other text
 * @param text The raw text response from LLM
 * @returns Cleaned JSON string
 */
export function extractJsonFromLlmResponse(text: string): string {
    // Remove markdown code blocks (```json and ```)
    let cleaned = text.replace(/```json\n?|\n?```/g, "");

    // If there's still no valid JSON, look for anything that resembles a JSON object or array
    const possibleJson = cleaned.match(/(\[|\{)[\s\S]*(\]|\})/);
    if (possibleJson) {
        cleaned = possibleJson[0];
    }

    return cleaned;
}

/**
 * Safely parse JSON with Zod schema validation
 * @param text Text to parse as JSON
 * @param schema Zod schema to validate against
 * @returns Parsed and validated object, or null if parsing failed
 */
export function safeParse<T>(text: string, schema: z.ZodType<T>): T | null {
    try {
        // First extract valid JSON from text
        const jsonStr = extractJsonFromLlmResponse(text);

        // Parse the JSON string
        const json = JSON.parse(jsonStr);

        // Validate with Zod schema
        const result = schema.safeParse(json);

        if (result.success) {
            return result.data;
        } else {
            console.error("Schema validation failed:", result.error);
            return null;
        }
    } catch (error) {
        console.error("JSON parsing failed:", error);
        return null;
    }
}

/**
 * Generate a JSON schema string from a Zod schema
 * @param schema Zod schema
 * @returns JSON schema string for inclusion in prompts
 */
export function zodSchemaToJsonString(schema: z.ZodType): string {
    const jsonSchema = zodToJsonSchema(schema);
    return JSON.stringify(jsonSchema, null, 2);
}
