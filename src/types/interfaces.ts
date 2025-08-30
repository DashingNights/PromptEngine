/**
 * Configuration options for the TemplateEngine
 */
export interface TemplateEngineConfig {
  /** Directory path containing prompt template files */
  promptsDirectory: string;
  /** Map of variable names to their replacement values */
  variableDefinitions: Map<string, string>;
  /** Whether to enable caching of prompt files (default: true) */
  enableCaching?: boolean;
  /** File extensions to consider as prompt files (default: ['.txt', '.md', '.prompt']) */
  promptFileExtensions?: string[];
}

/**
 * Statistics about the prompt cache
 */
export interface CacheStats {
  /** Number of files currently cached */
  fileCount: number;
  /** Total size of all cached content in characters */
  totalSize: number;
  /** List of cached file names */
  files: string[];
}

/**
 * Result of template processing
 */
export interface TemplateProcessingResult {
  /** The processed template with variables replaced */
  processedTemplate: string;
  /** Set of variables that were found in the template */
  variablesFound: Set<string>;
  /** Set of variables that were successfully replaced */
  variablesReplaced: Set<string>;
  /** Set of variables that were found but not defined */
  undefinedVariables: Set<string>;
}

/**
 * Options for template processing
 */
export interface ProcessingOptions {
  /** Whether to throw an error if undefined variables are found (default: true) */
  strictMode?: boolean;
  /** Whether to validate that all found variables are defined (default: true) */
  validateVariables?: boolean;
  /** Custom variable pattern regex (default: /{{(.*?)}}/g) */
  variablePattern?: RegExp;
}

/**
 * Variable definition entry
 */
export interface VariableDefinition {
  /** The variable name (including braces, e.g., "{{player_name}}") */
  name: string;
  /** The replacement value */
  value: string;
  /** Optional description of what this variable represents */
  description?: string;
}

/**
 * Dynamic variables that can be passed to template processing
 * Can be either a Map or a plain object
 */
export type DynamicVariables = Map<string, string> | Record<string, string>;

/**
 * Error types that can be thrown by the TemplateEngine
 */
export enum TemplateEngineErrorType {
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  VARIABLE_NOT_DEFINED = 'VARIABLE_NOT_DEFINED',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Custom error class for TemplateEngine operations
 */
export class TemplateEngineError extends Error {
  constructor(
    public readonly type: TemplateEngineErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TemplateEngineError';
  }
}

/**
 * Interface for prompt cache implementations
 */
export interface IPromptCache {
  /** Initialize the cache */
  initialize(): Promise<void>;
  /** Get cached prompt content by filename */
  getPrompt(fileName: string): string;
  /** Get cached prompt content with fallback to disk read */
  getPromptWithFallback(fileName: string): Promise<string>;
  /** Check if cache is initialized */
  isInitialized(): boolean;
  /** Get cache statistics */
  getCacheStats(): CacheStats;
  /** Refresh cache by reloading all files */
  refresh(): Promise<void>;
  /** Check if a specific prompt exists in cache */
  hasPrompt(fileName: string): boolean;
}
