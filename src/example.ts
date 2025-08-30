/**
 * Example usage of the DeepNPC Prompt Engine
 * This file demonstrates how to use the restructured template engine
 */

import { TemplateEngine, createDefaultVariableDefinitions } from './index';

async function main() {
    try {
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

        // Example 1: Process template with default variables
        console.log('=== Example 1: Default Variables ===');
        const result1 = await engine.processTemplate("NPC_PROMPT.txt");
        console.log(`Variables found: ${Array.from(result1.variablesFound).join(', ')}`);
        console.log(`Variables replaced: ${Array.from(result1.variablesReplaced).join(', ')}`);
        console.log('\n=== Processed Template (Default) ===');
        console.log(result1.processedTemplate.substring(0, 200) + '...\n');

        // Example 2: Process template with dynamic variables
        console.log('=== Example 2: Dynamic Variables ===');
        const dynamicVars = new Map([
            ['{{player_name}}', 'Alice'],
            ['{{character_name}}', 'Gandalf'],
            ['{{backstory}}', 'I am a wise wizard from the Grey Havens'],
            ['{{profession}}', 'Wizard'],
            ['{{option_amt}}', '5']
        ]);

        const result2 = await engine.processTemplate("NPC_PROMPT.txt", dynamicVars);
        console.log(`Variables found: ${Array.from(result2.variablesFound).join(', ')}`);
        console.log(`Variables replaced: ${Array.from(result2.variablesReplaced).join(', ')}`);
        console.log('\n=== Processed Template (Dynamic) ===');
        console.log(result2.processedTemplate.substring(0, 200) + '...\n');

        // Example 3: Using convenience method with object syntax
        console.log('=== Example 3: Object Syntax ===');
        const result3 = await engine.processTemplateWithVariables("NPC_PROMPT.txt", {
            '{{player_name}}': 'Bob',
            '{{character_name}}': 'Elrond',
            '{{backstory}}': 'I am the Lord of Rivendell',
            '{{profession}}': 'Elf Lord',
            '{{option_amt}}': '4'
        });
        console.log(`Variables replaced: ${Array.from(result3.variablesReplaced).join(', ')}`);
        console.log('\n=== Processed Template (Object) ===');
        console.log(result3.processedTemplate.substring(0, 200) + '...\n');

        // Example 4: Get required variables for a prompt
        console.log('=== Example 4: Required Variables Analysis ===');
        const requiredVars = await engine.getRequiredVariables("NPC_PROMPT.txt");
        console.log(`Required variables: ${Array.from(requiredVars).join(', ')}`);

    } catch (error) {
        console.error('Failed to process prompt:', error);
    }
}

// Execute main function if this file is run directly
if (require.main === module) {
    main();
}
