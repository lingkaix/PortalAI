import { create } from "zustand";
import { ToolType } from "../types";
import { loadTools, saveTools } from "../lib/dataManager";
import { generateId } from "../lib/utils"; // Import the centralized ID generator

interface ToolState {
  tools: ToolType[];
  isLoading: boolean;
  error: string | null;
  loadTools: () => Promise<void>;
  addTool: (newToolData: Omit<ToolType, "id">) => Promise<void>;
  updateTool: (updatedTool: ToolType) => Promise<void>;
  removeTool: (toolId: string) => Promise<void>;
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: [],
  isLoading: false,
  error: null,

  loadTools: async () => {
    set({ isLoading: true, error: null });
    try {
      const loadedTools = await loadTools();
      set({ tools: loadedTools, isLoading: false });
    } catch (err) {
      console.error("Error loading tools:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to load tools: ${errorMessage}`, isLoading: false });
    }
  },

  addTool: async (newToolData) => {
    set({ isLoading: true, error: null });
    const newTool: ToolType = {
      ...newToolData,
      id: generateId(), // Use the centralized ID generator
    };
    try {
      const currentTools = get().tools;
      const updatedTools = [...currentTools, newTool];
      await saveTools(updatedTools);
      set({ tools: updatedTools, isLoading: false });
    } catch (err) {
      console.error("Error adding tool:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to add tool: ${errorMessage}`, isLoading: false });
    }
  },

  updateTool: async (updatedTool) => {
    set({ isLoading: true, error: null });
    try {
      const currentTools = get().tools;
      const updatedTools = currentTools.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool));
      if (updatedTools.length === currentTools.length) {
        // Ensure the tool was found
        await saveTools(updatedTools);
        set({ tools: updatedTools, isLoading: false });
      } else {
        throw new Error(`Tool with ID ${updatedTool.id} not found for update.`);
      }
    } catch (err) {
      console.error("Error updating tool:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to update tool: ${errorMessage}`, isLoading: false });
    }
  },

  removeTool: async (toolId) => {
    set({ isLoading: true, error: null });
    try {
      const currentTools = get().tools;
      const updatedTools = currentTools.filter((tool) => tool.id !== toolId);
      if (updatedTools.length < currentTools.length) {
        // Ensure the tool was found
        await saveTools(updatedTools);
        set({ tools: updatedTools, isLoading: false });
      } else {
        console.warn(`Tool with ID ${toolId} not found for removal.`);
        set({ isLoading: false }); // Still finish loading state
      }
    } catch (err) {
      console.error("Error removing tool:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to remove tool: ${errorMessage}`, isLoading: false });
    }
  },
}));

// Components should trigger loadTools when needed, e.g., on mount.
