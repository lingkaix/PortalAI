import { create } from "zustand";
import { Agent } from "../types";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
import { generateId } from "../lib/utils"; // Import the centralized ID generator

export const AGENTS_FILE = "agents.json";
/**
 * Loads the list of agents.
 * @returns {Promise<Agent[]>} An array of agents, defaults to empty array if not found or invalid.
 */
export async function loadAgents(): Promise<Agent[]> {
  return (await readJsonFile<Agent[]>(AGENTS_FILE, [])) ?? [];
}

/**
 * Saves the list of agents.
 * @param {Agent[]} agents - The array of agents to save.
 * @returns {Promise<void>}
 */
export async function saveAgents(agents: Agent[]): Promise<void> {
  await writeJsonFile<Agent[]>(AGENTS_FILE, agents);
}

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  loadAgents: () => Promise<void>;
  addAgent: (newAgentData: Omit<Agent, "id">) => Promise<void>;
  updateAgent: (updatedAgent: Agent) => Promise<void>;
  removeAgent: (agentId: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const loadedAgents = await loadAgents();
      set({ agents: loadedAgents, isLoading: false });
    } catch (err) {
      console.error("Error loading agents:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to load agents: ${errorMessage}`, isLoading: false });
    }
  },

  addAgent: async (newAgentData) => {
    set({ isLoading: true, error: null });
    const newAgent: Agent = {
      ...newAgentData,
      id: generateId(), // Use the centralized ID generator
    };
    try {
      const currentAgents = get().agents;
      const updatedAgents = [...currentAgents, newAgent];
      await saveAgents(updatedAgents);
      set({ agents: updatedAgents, isLoading: false });
    } catch (err) {
      console.error("Error adding agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to add agent: ${errorMessage}`, isLoading: false });
      // Optionally revert state if save fails, though Zustand doesn't do this automatically
    }
  },

  updateAgent: async (updatedAgent) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgents = get().agents;
      const updatedAgents = currentAgents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent));
      if (updatedAgents.length === currentAgents.length) {
        // Ensure the agent was found
        await saveAgents(updatedAgents);
        set({ agents: updatedAgents, isLoading: false });
      } else {
        throw new Error(`Agent with ID ${updatedAgent.id} not found for update.`);
      }
    } catch (err) {
      console.error("Error updating agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to update agent: ${errorMessage}`, isLoading: false });
    }
  },

  removeAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgents = get().agents;
      const updatedAgents = currentAgents.filter((agent) => agent.id !== agentId);
      if (updatedAgents.length < currentAgents.length) {
        // Ensure the agent was found
        await saveAgents(updatedAgents);
        set({ agents: updatedAgents, isLoading: false });
      } else {
        console.warn(`Agent with ID ${agentId} not found for removal.`);
        set({ isLoading: false }); // Still finish loading state
      }
    } catch (err) {
      console.error("Error removing agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to remove agent: ${errorMessage}`, isLoading: false });
    }
  },
}));

// Initial load when the store is first used (or app starts)
// Note: This approach might trigger loading multiple times if the store is accessed
// concurrently initially. Consider a dedicated initialization step in your app's entry point.
// useAgentStore.getState().loadAgents(); // Removed auto-load, should be triggered by components
