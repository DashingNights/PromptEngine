/**
 * DeepNPC Prompt Engine
 * 
 * A configurable template engine for processing prompt files with variable substitution.
 * Designed for integration into the larger DeepNPC project.
 * 
 * @example
 * ```typescript
 * import { TemplateEngine, createDefaultVariableDefinitions } from './DeepNPC/promptEngine';
 * 
 * const engine = new TemplateEngine({
 *   promptsDirectory: './prompts',
 *   variableDefinitions: createDefaultVariableDefinitions().getVariableMap()
 * });
 * 
 * await engine.initialize();
 * const result = await engine.processTemplate('NPC_PROMPT.txt');
 * console.log(result.processedTemplate);
 * ```
 */

// Core classes
export { TemplateEngine } from './lib/TemplateEngine';
export { default as PromptCache } from './lib/PromptCache';

// Utility classes
export { VariableDefinitions, createDefaultVariableDefinitions } from './utils/VariableDefinitions';

// Types and interfaces
export {
    TemplateEngineConfig,
    ProcessingOptions,
    TemplateProcessingResult,
    CacheStats,
    VariableDefinition,
    DynamicVariables,
    TemplateEngineError,
    TemplateEngineErrorType,
    IPromptCache
} from './types/interfaces';

// Legacy exports for backward compatibility
export { variablesDefinitionMap } from './utils/VariableDefinitions';

/**
 * Factory function to create a TemplateEngine with default configuration
 */
export function createTemplateEngine(
    promptsDirectory: string = 'src/prompts',
    customVariables?: Map<string, string>
) {
    const { TemplateEngine } = require('./lib/TemplateEngine');
    const { createDefaultVariableDefinitions } = require('./utils/VariableDefinitions');

    const variableDefinitions = customVariables || createDefaultVariableDefinitions().getVariableMap();

    return new TemplateEngine({
        promptsDirectory,
        variableDefinitions,
        enableCaching: true,
        promptFileExtensions: ['.txt', '.md', '.prompt']
    });
}

/**
 * Quick setup function for common use cases
 */
export async function createAndInitializeTemplateEngine(
    promptsDirectory: string = 'src/prompts',
    customVariables?: Map<string, string>
) {
    const engine = createTemplateEngine(promptsDirectory, customVariables);
    await engine.initialize();
    return engine;
}

// Default export for convenience
export { TemplateEngine as default } from './lib/TemplateEngine';
