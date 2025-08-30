import { TemplateEngineConfig, ProcessingOptions, TemplateProcessingResult, TemplateEngineError, TemplateEngineErrorType } from '../types/interfaces';
import PromptCache from './PromptCache';
import { VariableDefinitions } from '../utils/VariableDefinitions';

/**
 * Main TemplateEngine class for processing prompt templates with variable substitution
 */
export class TemplateEngine {
    private promptCache: PromptCache;
    private variableDefinitions: VariableDefinitions;
    private config: TemplateEngineConfig;
    private initialized: boolean = false;

    constructor(config: TemplateEngineConfig) {
        this.config = { ...config };
        this.variableDefinitions = new VariableDefinitions(config.variableDefinitions);
        
        // Initialize PromptCache with configuration
        this.promptCache = PromptCache.getInstance(
            config.promptsDirectory,
            config.promptFileExtensions
        );
    }

    /**
     * Initialize the template engine
     */
    public async initialize(): Promise<void> {
        try {
            if (this.config.enableCaching !== false) {
                await this.promptCache.initialize();
            }
            this.initialized = true;
            console.log('TemplateEngine initialized successfully');
        } catch (error) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.INITIALIZATION_ERROR,
                `Failed to initialize TemplateEngine: ${error}`,
                error
            );
        }
    }

    /**
     * Read a prompt file from cache or disk
     */
    private readPromptFile(promptFileName: string): string {
        try {
            return this.promptCache.getPrompt(promptFileName);
        } catch (err) {
            console.error('Error reading prompt file from cache:', err);
            throw err;
        }
    }

    /**
     * Find unique variables in prompt file data
     */
    private async findUniqueVariablesRequired(
        promptFileData: string, 
        options: ProcessingOptions = {}
    ): Promise<Set<string>> {
        try {
            const variablePattern = options.variablePattern || /{{(.*?)}}/g;
            const variables = promptFileData.match(variablePattern);
            
            if (!variables) {
                return new Set();
            }
            
            const uniqueVariables = new Set(variables);
            return uniqueVariables;
        } catch (err) {
            console.error('Error finding unique variables:', err);
            throw new TemplateEngineError(
                TemplateEngineErrorType.PROCESSING_ERROR,
                `Error finding unique variables: ${err}`,
                err
            );
        }
    }

    /**
     * Validate that all found variables are defined using a specific variable map
     */
    private async validateVariablesWithMap(variablesFound: Set<string>, variableMap: VariableDefinitions): Promise<boolean> {
        if (variablesFound && variablesFound.size > 0) {
            const undefinedVariables: string[] = [];

            for (const variable of variablesFound) {
                if (!variableMap.hasVariable(variable)) {
                    undefinedVariables.push(variable);
                }
            }

            if (undefinedVariables.length > 0) {
                throw new TemplateEngineError(
                    TemplateEngineErrorType.VARIABLE_NOT_DEFINED,
                    `Variables not defined: ${undefinedVariables.join(', ')}. Available variables: ${variableMap.getVariableNames().join(', ')}`
                );
            }
        } else {
            throw new TemplateEngineError(
                TemplateEngineErrorType.VALIDATION_ERROR,
                'No variables found in the prompt file.'
            );
        }
        return true;
    }

    /**
     * Process a prompt template by replacing variables with their values
     * @param promptFileName - Name of the prompt file to process
     * @param variableOverrides - Optional variable map to override/extend default variables for this specific prompt
     * @param options - Processing options
     */
    public async processTemplate(
        promptFileName: string,
        variableOverrides?: Map<string, string>,
        options?: ProcessingOptions
    ): Promise<TemplateProcessingResult>;

    /**
     * Process a prompt template by replacing variables with their values (legacy signature)
     */
    public async processTemplate(
        promptFileName: string,
        options?: ProcessingOptions
    ): Promise<TemplateProcessingResult>;

    /**
     * Implementation of processTemplate with overloaded signatures
     */
    public async processTemplate(
        promptFileName: string,
        variableOverridesOrOptions?: Map<string, string> | ProcessingOptions,
        options: ProcessingOptions = {}
    ): Promise<TemplateProcessingResult> {
        // Handle overloaded parameters
        let variableOverrides: Map<string, string> | undefined;
        let processingOptions: ProcessingOptions;

        if (variableOverridesOrOptions instanceof Map) {
            variableOverrides = variableOverridesOrOptions;
            processingOptions = options;
        } else {
            variableOverrides = undefined;
            processingOptions = variableOverridesOrOptions || {};
        }
        if (!this.initialized) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.INITIALIZATION_ERROR,
                'TemplateEngine not initialized. Call initialize() first.'
            );
        }

        try {
            const promptFileData = this.readPromptFile(promptFileName);
            const variablesFound = await this.findUniqueVariablesRequired(promptFileData, processingOptions);

            // Create a combined variable definitions map for this specific prompt
            const combinedVariables = new VariableDefinitions(this.variableDefinitions.getVariableMap());
            if (variableOverrides) {
                combinedVariables.setVariables(variableOverrides);
            }

            const result: TemplateProcessingResult = {
                processedTemplate: promptFileData,
                variablesFound,
                variablesReplaced: new Set(),
                undefinedVariables: new Set()
            };

            if (variablesFound.size === 0) {
                if (processingOptions.strictMode !== false) {
                    throw new TemplateEngineError(
                        TemplateEngineErrorType.VALIDATION_ERROR,
                        'No variables found in the prompt file.'
                    );
                }
                return result;
            }

            // Validate variables if required (using combined variables)
            if (processingOptions.validateVariables !== false) {
                try {
                    await this.validateVariablesWithMap(variablesFound, combinedVariables);
                } catch (error) {
                    if (processingOptions.strictMode !== false) {
                        throw error;
                    }
                    // In non-strict mode, collect undefined variables but continue
                    for (const variable of variablesFound) {
                        if (!combinedVariables.hasVariable(variable)) {
                            result.undefinedVariables.add(variable);
                        }
                    }
                }
            }

            let updatedPrompt = promptFileData;

            // Replace variables using combined variable map
            for (const variable of variablesFound) {
                const value = combinedVariables.getVariable(variable);
                if (value !== undefined) {
                    updatedPrompt = updatedPrompt.replaceAll(variable, value);
                    result.variablesReplaced.add(variable);
                } else {
                    result.undefinedVariables.add(variable);
                }
            }

            result.processedTemplate = updatedPrompt;
            return result;

        } catch (error) {
            if (error instanceof TemplateEngineError) {
                throw error;
            }
            console.error('Error processing template:', error);
            throw new TemplateEngineError(
                TemplateEngineErrorType.PROCESSING_ERROR,
                `Error processing template: ${error}`,
                error
            );
        }
    }

    /**
     * Process a template with dynamic variables - convenience method
     * @param promptFileName - Name of the prompt file to process
     * @param dynamicVariables - Variables specific to this prompt processing
     * @param options - Processing options
     */
    public async processTemplateWithVariables(
        promptFileName: string,
        dynamicVariables: Map<string, string> | Record<string, string>,
        options: ProcessingOptions = {}
    ): Promise<TemplateProcessingResult> {
        const variableMap = dynamicVariables instanceof Map
            ? dynamicVariables
            : new Map(Object.entries(dynamicVariables));

        return this.processTemplate(promptFileName, variableMap, options);
    }

    /**
     * Get all variables required by a specific prompt file without processing it
     * @param promptFileName - Name of the prompt file to analyze
     * @param options - Processing options for variable pattern
     */
    public async getRequiredVariables(
        promptFileName: string,
        options: ProcessingOptions = {}
    ): Promise<Set<string>> {
        const promptFileData = this.readPromptFile(promptFileName);
        return this.findUniqueVariablesRequired(promptFileData, options);
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use processTemplate instead
     */
    public async replaceVariablesInPrompt(promptFileName: string): Promise<string> {
        const result = await this.processTemplate(promptFileName);
        return result.processedTemplate;
    }

    /**
     * Update variable definitions
     */
    public updateVariableDefinitions(variables: Map<string, string>): void {
        this.variableDefinitions.setVariables(variables);
    }

    /**
     * Get current variable definitions
     */
    public getVariableDefinitions(): Map<string, string> {
        return this.variableDefinitions.getVariableMap();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return this.promptCache.getCacheStats();
    }

    /**
     * Check if the engine is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Refresh the prompt cache
     */
    public async refreshCache(): Promise<void> {
        await this.promptCache.refresh();
    }
}

export default TemplateEngine;
