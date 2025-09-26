# Axon Examples

This directory contains examples demonstrating how to use the Axon library.

## Running Examples

You can run the examples using the following npm scripts:

```bash
# Run the basic example
yarn example:basic

# Run the advanced example
yarn example:advanced
```

## Example Descriptions

### Basic Usage (basic-usage.ts)

This example demonstrates the core functionality of Axon with custom configuration.
It shows how to:

-   Configure Axon with custom LLM settings
-   Process a prompt through the cognitive architecture
-   Analyze the results of cognitive processing

### Advanced Usage (advanced-usage.ts)

This example demonstrates more advanced features of Axon:

-   Using a local LLM server (like LM Studio)
-   Setting up event listeners for real-time processing updates
-   Using the streaming API for immediate feedback
-   Working with event handlers

## Creating Your Own Examples

When creating your own examples based on these templates, remember to:

1. Import the library using `import { Axon } from 'axon-ai'` when using the published npm package
2. Always provide all required configuration parameters or rely on defaults
3. Handle errors appropriately
4. Consider using event handlers for real-time processing updates
