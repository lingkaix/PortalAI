// src/types/knowledge.ts

/**
 * Represents a Knowledge Base configuration.
 */
export type KnowledgeBaseType = {
  id: string; // Unique identifier for the knowledge base
  name: string; // Display name of the knowledge base
  description?: string; // Optional description
  // Add other knowledge-specific properties here later (e.g., sourceFiles, embeddingModel)
};