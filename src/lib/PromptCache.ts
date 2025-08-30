import fsPromises from 'fs/promises';
import path from 'path';
import { IPromptCache, CacheStats, TemplateEngineError, TemplateEngineErrorType } from '../types/interfaces';

/**
 * Singleton class for managing prompt file caching in memory
 * Eliminates runtime file I/O by pre-loading all prompt files
 */
class PromptCache implements IPromptCache {
    private static instance: PromptCache;
    private cache: Map<string, string> = new Map();
    private initialized: boolean = false;
    private promptsDirectory: string;
    private promptFileExtensions: string[];

    private constructor(promptsDirectory: string = 'src/prompts', promptFileExtensions: string[] = ['.txt', '.md', '.prompt']) {
        this.promptsDirectory = promptsDirectory;
        this.promptFileExtensions = promptFileExtensions;
    }

    /**
     * Get the singleton instance of PromptCache
     */
    public static getInstance(promptsDirectory?: string, promptFileExtensions?: string[]): PromptCache {
        if (!PromptCache.instance) {
            PromptCache.instance = new PromptCache(promptsDirectory, promptFileExtensions);
        }
        return PromptCache.instance;
    }

    /**
     * Configure the cache with new settings (only works before initialization)
     */
    public configure(promptsDirectory: string, promptFileExtensions?: string[]): void {
        if (this.initialized) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.INITIALIZATION_ERROR,
                'Cannot reconfigure PromptCache after initialization. Call refresh() to reinitialize with new settings.'
            );
        }
        this.promptsDirectory = promptsDirectory;
        if (promptFileExtensions) {
            this.promptFileExtensions = promptFileExtensions;
        }
    }

    /**
     * Initialize the cache by scanning and loading all prompt files
     */
    public async initialize(): Promise<void> {
        try {
            console.log('Initializing prompt cache...');
            const promptFiles = await this.scanPromptsDirectory();
            await this.loadPromptFiles(promptFiles);
            this.initialized = true;
            console.log(`Prompt cache initialized with ${this.cache.size} files`);
        } catch (error) {
            console.error('Failed to initialize prompt cache:', error);
            throw new TemplateEngineError(
                TemplateEngineErrorType.CACHE_ERROR,
                `Failed to initialize prompt cache: ${error}`,
                error
            );
        }
    }

    /**
     * Scan the prompts directory for all prompt files
     */
    private async scanPromptsDirectory(): Promise<string[]> {
        try {
            const files = await fsPromises.readdir(this.promptsDirectory);
            // Filter for configured prompt file extensions
            const promptFiles = files.filter(file =>
                this.promptFileExtensions.some(ext => file.endsWith(ext))
            );
            console.log(`Found ${promptFiles.length} prompt files:`, promptFiles);
            return promptFiles;
        } catch (error) {
            console.error('Error scanning prompts directory:', error);
            throw new TemplateEngineError(
                TemplateEngineErrorType.CACHE_ERROR,
                `Failed to scan prompts directory '${this.promptsDirectory}': ${error}`,
                error
            );
        }
    }

    /**
     * Load all prompt files into memory cache
     */
    private async loadPromptFiles(promptFiles: string[]): Promise<void> {
        const loadPromises = promptFiles.map(async (fileName) => {
            try {
                const filePath = path.join(this.promptsDirectory, fileName);
                const content = await fsPromises.readFile(filePath, 'utf8');
                this.cache.set(fileName, content);
                console.log(`Cached prompt file: ${fileName} (${content.length} characters)`);
            } catch (error) {
                console.error(`Failed to load prompt file ${fileName}:`, error);
                throw error;
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * Get cached prompt content by filename
     */
    public getPrompt(fileName: string): string {
        if (!this.initialized) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.INITIALIZATION_ERROR,
                'PromptCache not initialized. Call initialize() first.'
            );
        }

        const content = this.cache.get(fileName);
        if (content === undefined) {
            console.warn(`Prompt file '${fileName}' not found in cache. Available files: ${Array.from(this.cache.keys()).join(', ')}`);
            throw new TemplateEngineError(
                TemplateEngineErrorType.FILE_NOT_FOUND,
                `Prompt file '${fileName}' not found in cache. Available files: ${Array.from(this.cache.keys()).join(', ')}`
            );
        }

        return content;
    }

    /**
     * Get cached prompt content with async fallback to disk read
     */
    public async getPromptWithFallback(fileName: string): Promise<string> {
        if (!this.initialized) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.INITIALIZATION_ERROR,
                'PromptCache not initialized. Call initialize() first.'
            );
        }

        const content = this.cache.get(fileName);
        if (content !== undefined) {
            return content;
        }

        // Fallback: attempt to read from disk and cache it
        console.warn(`Cache miss for '${fileName}', attempting fallback read from disk...`);
        try {
            const filePath = path.join(this.promptsDirectory, fileName);
            const diskContent = await fsPromises.readFile(filePath, 'utf8');

            // Cache the newly read content for future use
            this.cache.set(fileName, diskContent);
            console.log(`Successfully loaded and cached '${fileName}' from disk (${diskContent.length} characters)`);

            return diskContent;
        } catch (error) {
            throw new TemplateEngineError(
                TemplateEngineErrorType.FILE_NOT_FOUND,
                `Prompt file '${fileName}' not found in cache or on disk. Available cached files: ${Array.from(this.cache.keys()).join(', ')}. Error: ${error}`,
                error
            );
        }
    }

    /**
     * Check if cache is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): CacheStats {
        const files = Array.from(this.cache.keys());
        const totalSize = Array.from(this.cache.values()).reduce((sum, content) => sum + content.length, 0);

        return {
            fileCount: files.length,
            totalSize,
            files
        };
    }

    /**
     * Refresh cache by reloading all prompt files
     */
    public async refresh(): Promise<void> {
        console.log('Refreshing prompt cache...');
        this.cache.clear();
        this.initialized = false;
        await this.initialize();
    }

    /**
     * Check if a specific prompt exists in cache
     */
    public hasPrompt(fileName: string): boolean {
        return this.cache.has(fileName);
    }
}

export default PromptCache;
