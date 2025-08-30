# Variable Templating Engine

A configurable template engine for processing prompt files with variable substitution. Originally designed for the DeepNPC project, but can be used as a standalone package for any template processing needs.

## Features

- **Variable Substitution**: Replace `{{variable}}` placeholders in prompt templates
- **Caching System**: In-memory caching of prompt files for performance
- **Configurable**: Flexible configuration for directories, file extensions, and variables
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Robust error handling with custom error types
- **Validation**: Optional validation of variables and templates

## Installation

### As a Standalone Package

```bash
npm install deepnpc-prompt-engine
```

### For Development or Integration

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the module: `npm run build`
4. Run the example: `npm run example`

## Quick Start

```typescript
import { TemplateEngine, createDefaultVariableDefinitions } from 'deepnpc-prompt-engine';

// Create and initialize the engine
const engine = new TemplateEngine({
  promptsDirectory: './prompts',
  variableDefinitions: createDefaultVariableDefinitions().getVariableMap()
});

await engine.initialize();

// Process a template
const result = await engine.processTemplate('NPC_PROMPT.txt');
console.log(result.processedTemplate);
```

## API Reference

### TemplateEngine

The main class for processing templates.

#### Constructor

```typescript
new TemplateEngine(config: TemplateEngineConfig)
```

**TemplateEngineConfig:**
- `promptsDirectory: string` - Directory containing prompt files
- `variableDefinitions: Map<string, string>` - Variable name-value pairs
- `enableCaching?: boolean` - Enable file caching (default: true)
- `promptFileExtensions?: string[]` - File extensions to process (default: ['.txt', '.md', '.prompt'])

#### Methods

##### `initialize(): Promise<void>`
Initialize the template engine and load prompt files into cache.

##### `processTemplate(fileName: string, variableOverrides?: Map<string, string>, options?: ProcessingOptions): Promise<TemplateProcessingResult>`
Process a template file with variable substitution. Can optionally provide variables specific to this prompt.

##### `processTemplate(fileName: string, options?: ProcessingOptions): Promise<TemplateProcessingResult>`
Process a template file with variable substitution (legacy signature).

**ProcessingOptions:**
- `strictMode?: boolean` - Throw errors for undefined variables (default: true)
- `validateVariables?: boolean` - Validate all variables are defined (default: true)
- `variablePattern?: RegExp` - Custom variable pattern (default: `/{{(.*?)}}/g`)

**Returns TemplateProcessingResult:**
- `processedTemplate: string` - The processed template
- `variablesFound: Set<string>` - Variables found in template
- `variablesReplaced: Set<string>` - Variables successfully replaced
- `undefinedVariables: Set<string>` - Variables that were not defined

##### `processTemplateWithVariables(fileName: string, dynamicVariables: Map<string, string> | Record<string, string>, options?: ProcessingOptions): Promise<TemplateProcessingResult>`
Convenience method to process a template with dynamic variables. Accepts either a Map or plain object.

##### `getRequiredVariables(fileName: string, options?: ProcessingOptions): Promise<Set<string>>`
Analyze a prompt file to determine what variables it requires without processing it.

##### `updateVariableDefinitions(variables: Map<string, string>): void`
Update variable definitions after initialization.

##### `getCacheStats(): CacheStats`
Get statistics about the prompt cache.

##### `getVariableDefinitions(): Map<string, string>`
Get current variable definitions.

##### `isInitialized(): boolean`
Check if the engine is initialized.

##### `refreshCache(): Promise<void>`
Refresh the prompt cache.

### VariableDefinitions

Utility class for managing variable definitions.

```typescript
import { VariableDefinitions } from 'deepnpc-prompt-engine';

const vars = new VariableDefinitions();
vars.setVariable('{{player_name}}', 'Alice');
vars.setVariable('{{character_name}}', 'Bob');
```

### Factory Functions

#### `createTemplateEngine(promptsDirectory, customVariables?): TemplateEngine`
Create a TemplateEngine with default configuration.

#### `createAndInitializeTemplateEngine(promptsDirectory, customVariables?): Promise<TemplateEngine>`
Create and initialize a TemplateEngine in one step.

## Usage Examples

### Basic Usage

```typescript
import { TemplateEngine, createDefaultVariableDefinitions } from 'deepnpc-prompt-engine';

// Create variable definitions
const variableDefinitions = createDefaultVariableDefinitions().getVariableMap();

// Create and configure the template engine
const engine = new TemplateEngine({
    promptsDirectory: 'src/prompts',
    variableDefinitions,
    enableCaching: true,
    promptFileExtensions: ['.txt', '.md', '.prompt']
});

// Initialize the engine
await engine.initialize();

// Display cache statistics
const stats = engine.getCacheStats();
console.log(`Cache initialized: ${stats.fileCount} files, ${stats.totalSize} total characters`);

// Process template with default variables
const result = await engine.processTemplate("NPC_PROMPT.txt");
console.log(`Variables found: ${Array.from(result.variablesFound).join(', ')}`);
console.log(`Variables replaced: ${Array.from(result.variablesReplaced).join(', ')}`);
console.log(result.processedTemplate);
```

### Dynamic Variables Per Prompt

```typescript
// Process template with dynamic variables
const dynamicVars = new Map([
    ['{{player_name}}', 'Alice'],
    ['{{character_name}}', 'Gandalf'],
    ['{{backstory}}', 'I am a wise wizard from the Grey Havens'],
    ['{{profession}}', 'Wizard'],
    ['{{option_amt}}', '5']
]);

const result = await engine.processTemplate("NPC_PROMPT.txt", dynamicVars);
console.log(`Variables found: ${Array.from(result.variablesFound).join(', ')}`);
console.log(`Variables replaced: ${Array.from(result.variablesReplaced).join(', ')}`);
console.log(result.processedTemplate);
```

### Using Object Syntax

```typescript
// Use plain objects instead of Maps for convenience
const result = await engine.processTemplateWithVariables("NPC_PROMPT.txt", {
    '{{player_name}}': 'Bob',
    '{{character_name}}': 'Elrond',
    '{{backstory}}': 'I am the Lord of Rivendell',
    '{{profession}}': 'Elf Lord',
    '{{option_amt}}': '4'
});
console.log(`Variables replaced: ${Array.from(result.variablesReplaced).join(', ')}`);
console.log(result.processedTemplate);
```

### Analyzing Required Variables

```typescript
// Find out what variables a prompt needs before processing
const requiredVars = await engine.getRequiredVariables("NPC_PROMPT.txt");
console.log(`Required variables: ${Array.from(requiredVars).join(', ')}`);

// Then provide only the needed variables
const dynamicVars = new Map();
for (const variable of requiredVars) {
  dynamicVars.set(variable, getVariableValue(variable));
}

const result = await engine.processTemplate("NPC_PROMPT.txt", dynamicVars);
```

### Custom Configuration

```typescript
import { TemplateEngine, VariableDefinitions } from 'deepnpc-prompt-engine';

// Create custom variables
const vars = new VariableDefinitions();
vars.setVariable('{{player_name}}', 'Charlie');
vars.setVariable('{{location}}', 'Forest');

const engine = new TemplateEngine({
  promptsDirectory: './custom-prompts',
  variableDefinitions: vars.getVariableMap(),
  enableCaching: true,
  promptFileExtensions: ['.txt', '.template']
});

await engine.initialize();
```

### Error Handling

```typescript
import { TemplateEngine, TemplateEngineError, TemplateEngineErrorType } from 'deepnpc-prompt-engine';

try {
  const result = await engine.processTemplate('missing-file.txt');
} catch (error) {
  if (error instanceof TemplateEngineError) {
    switch (error.type) {
      case TemplateEngineErrorType.FILE_NOT_FOUND:
        console.log('Template file not found');
        break;
      case TemplateEngineErrorType.VARIABLE_NOT_DEFINED:
        console.log('Some variables are not defined');
        break;
    }
  }
}
```

### Integration in Applications

```typescript
// In your main application
import { createAndInitializeTemplateEngine, TemplateEngine } from 'deepnpc-prompt-engine';

class MyApplication {
  private promptEngine: TemplateEngine;

  async initialize() {
    // Initialize the prompt engine
    this.promptEngine = await createAndInitializeTemplateEngine(
      './assets/prompts',
      this.getApplicationVariables()
    );
  }

  async generateContent(templateType: string): Promise<string> {
    const result = await this.promptEngine.processTemplate(`${templateType}_PROMPT.txt`);
    return result.processedTemplate;
  }

  private getApplicationVariables(): Map<string, string> {
    return new Map([
      ['{{user_name}}', this.user.name],
      ['{{context}}', this.currentContext],
      ['{{timestamp}}', new Date().toISOString()]
    ]);
  }
}
```

## File Structure

```
src/
├── index.ts              # Main entry point with exports
├── example.ts            # Usage example demonstrating all features
├── lib/
│   ├── TemplateEngine.ts # Main template engine class
│   └── PromptCache.ts    # Prompt file caching system
├── types/
│   └── interfaces.ts     # TypeScript type definitions
├── utils/
│   └── VariableDefinitions.ts # Variable management utilities
└── prompts/
    └── NPC_PROMPT.txt    # Example prompt template
```

## Migration from Legacy Code

If you're migrating from the old `templateEngineIndex.ts` approach:

**Old way:**
```typescript
import { replaceVariablesInPrompt } from './templateEngineIndex';
const result = await replaceVariablesInPrompt('NPC_PROMPT.txt');
```

**New way:**
```typescript
import { TemplateEngine } from 'deepnpc-prompt-engine';
const engine = new TemplateEngine(config);
await engine.initialize();
const result = await engine.processTemplate('NPC_PROMPT.txt');
```

## Testing the Examples

To verify your setup is working correctly, you can run the included example:

```bash
npm run example
```

This will demonstrate all the main features of the template engine using the sample prompt file.

## License

ISC
