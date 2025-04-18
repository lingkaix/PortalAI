// src/types/agent.ts

/**
 * Represents an AI Agent configuration.
 */
export type AgentType = {
  id: string; // Unique identifier for the agent
  name: string; // Display name of the agent
  description?: string; // Optional description
  // Add other agent-specific properties here later (e.g., systemPrompt, modelConfig)
};