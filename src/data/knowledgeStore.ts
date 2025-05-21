import { create } from "zustand";
import { KnowledgeBaseType } from "../types";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
import { generateId } from "../lib/utils"; // Import the centralized ID generator

// TODO
export const KNOWLEDGE_BASES_FILE = "knowledge.json"; // Index file
export const KNOWLEDGE_BASE_DIR = "knowledge"; // Dir for individual knowledge base content/files

/**
 * Loads the list of knowledge bases.
 * @returns {Promise<KnowledgeBaseType[]>} An array of knowledge bases, defaults to empty array if not found or invalid.
 */
export async function loadKnowledgeBases(): Promise<KnowledgeBaseType[]> {
  return (await readJsonFile<KnowledgeBaseType[]>(KNOWLEDGE_BASES_FILE, [])) ?? [];
}

/**
 * Saves the list of knowledge bases.
 * @param {KnowledgeBaseType[]} knowledgeBases - The array of knowledge bases to save.
 * @returns {Promise<void>}
 */
export async function saveKnowledgeBases(knowledgeBases: KnowledgeBaseType[]): Promise<void> {
  await writeJsonFile<KnowledgeBaseType[]>(KNOWLEDGE_BASES_FILE, knowledgeBases);
}

interface KnowledgeState {
  knowledgeBases: KnowledgeBaseType[];
  isLoading: boolean;
  error: string | null;
  loadKnowledgeBases: () => Promise<void>;
  addKnowledgeBase: (newKbData: Omit<KnowledgeBaseType, "id">) => Promise<void>;
  updateKnowledgeBase: (updatedKb: KnowledgeBaseType) => Promise<void>;
  removeKnowledgeBase: (kbId: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  knowledgeBases: [],
  isLoading: false,
  error: null,

  loadKnowledgeBases: async () => {
    set({ isLoading: true, error: null });
    try {
      const loadedKbs = await loadKnowledgeBases();
      set({ knowledgeBases: loadedKbs, isLoading: false });
    } catch (err) {
      console.error("Error loading knowledge bases:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to load knowledge bases: ${errorMessage}`, isLoading: false });
    }
  },

  addKnowledgeBase: async (newKbData) => {
    set({ isLoading: true, error: null });
    const newKb: KnowledgeBaseType = {
      ...newKbData,
      id: generateId(), // Use the centralized ID generator
    };
    try {
      const currentKbs = get().knowledgeBases;
      const updatedKbs = [...currentKbs, newKb];
      await saveKnowledgeBases(updatedKbs);
      set({ knowledgeBases: updatedKbs, isLoading: false });
    } catch (err) {
      console.error("Error adding knowledge base:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to add knowledge base: ${errorMessage}`, isLoading: false });
    }
  },

  updateKnowledgeBase: async (updatedKb) => {
    set({ isLoading: true, error: null });
    try {
      const currentKbs = get().knowledgeBases;
      const updatedKbs = currentKbs.map((kb) => (kb.id === updatedKb.id ? updatedKb : kb));
      if (updatedKbs.length === currentKbs.length) {
        // Ensure the KB was found
        await saveKnowledgeBases(updatedKbs);
        set({ knowledgeBases: updatedKbs, isLoading: false });
      } else {
        throw new Error(`Knowledge Base with ID ${updatedKb.id} not found for update.`);
      }
    } catch (err) {
      console.error("Error updating knowledge base:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to update knowledge base: ${errorMessage}`, isLoading: false });
    }
  },

  removeKnowledgeBase: async (kbId) => {
    set({ isLoading: true, error: null });
    try {
      const currentKbs = get().knowledgeBases;
      const updatedKbs = currentKbs.filter((kb) => kb.id !== kbId);
      if (updatedKbs.length < currentKbs.length) {
        // Ensure the KB was found
        await saveKnowledgeBases(updatedKbs);
        set({ knowledgeBases: updatedKbs, isLoading: false });
      } else {
        console.warn(`Knowledge Base with ID ${kbId} not found for removal.`);
        set({ isLoading: false }); // Still finish loading state
      }
    } catch (err) {
      console.error("Error removing knowledge base:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to remove knowledge base: ${errorMessage}`, isLoading: false });
    }
  },
}));

// Components should trigger loadKnowledgeBases when needed, e.g., on mount.
