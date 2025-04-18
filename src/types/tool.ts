// src/types/tool.ts

/**
 * Represents a Tool configuration that can be used by agents or the system.
 */
export type ToolType = {
  id: string; // Unique identifier for the tool
  name: string; // Display name of the tool
  description?: string; // Optional description
  // Add other tool-specific properties here later (e.g., parametersSchema, functionDefinition)
};