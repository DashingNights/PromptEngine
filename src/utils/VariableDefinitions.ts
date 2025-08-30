import { VariableDefinition } from '../types/interfaces';

/**
 * Utility class for managing variable definitions
 */
export class VariableDefinitions {
    private variableMap: Map<string, string>;

    constructor(initialVariables?: Map<string, string> | VariableDefinition[]) {
        this.variableMap = new Map();
        
        if (initialVariables) {
            if (initialVariables instanceof Map) {
                this.variableMap = new Map(initialVariables);
            } else {
                // Array of VariableDefinition objects
                for (const varDef of initialVariables) {
                    this.variableMap.set(varDef.name, varDef.value);
                }
            }
        }
    }

    /**
     * Set a variable definition
     */
    public setVariable(name: string, value: string): void {
        this.variableMap.set(name, value);
    }

    /**
     * Get a variable value by name
     */
    public getVariable(name: string): string | undefined {
        return this.variableMap.get(name);
    }

    /**
     * Check if a variable is defined
     */
    public hasVariable(name: string): boolean {
        return this.variableMap.has(name);
    }

    /**
     * Get all variable definitions as a Map
     */
    public getVariableMap(): Map<string, string> {
        return new Map(this.variableMap);
    }

    /**
     * Get all variable definitions as an array
     */
    public getVariableDefinitions(): VariableDefinition[] {
        return Array.from(this.variableMap.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }

    /**
     * Set multiple variables at once
     */
    public setVariables(variables: Map<string, string> | VariableDefinition[]): void {
        if (variables instanceof Map) {
            for (const [name, value] of variables) {
                this.variableMap.set(name, value);
            }
        } else {
            for (const varDef of variables) {
                this.variableMap.set(varDef.name, varDef.value);
            }
        }
    }

    /**
     * Clear all variable definitions
     */
    public clear(): void {
        this.variableMap.clear();
    }

    /**
     * Get the number of defined variables
     */
    public size(): number {
        return this.variableMap.size;
    }

    /**
     * Get all variable names
     */
    public getVariableNames(): string[] {
        return Array.from(this.variableMap.keys());
    }
}

/**
 * Create default variable definitions for backward compatibility
 */
export function createDefaultVariableDefinitions(): VariableDefinitions {
    const defaultVars = new Map<string, string>();
    defaultVars.set("{{player_name}}", "John");
    defaultVars.set("{{character_name}}", "Jane");
    defaultVars.set("{{backstory}}", "I am a farmer");
    defaultVars.set("{{profession}}", "Farmer");
    defaultVars.set("{{option_amt}}", "3");
    
    return new VariableDefinitions(defaultVars);
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use VariableDefinitions class instead
 */
export const variablesDefinitionMap = createDefaultVariableDefinitions().getVariableMap();

export default variablesDefinitionMap;
