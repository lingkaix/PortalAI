import { create } from "zustand";
import { AgentConfig, Agent, LocalAgentConfig, RemoteAgentConfig } from "../types";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
import { generateId } from "../lib/utils"; // Import the centralized ID generator

export const AGENTS_FILE = "agents.json";
/**
 * Loads the config of agents.
 * @returns {Promise<AgentConfig[]>} An array of agent configs, defaults to empty array if not found or invalid.
 */
export async function loadAgentConfig(): Promise<AgentConfig[]> {
  return (await readJsonFile<AgentConfig[]>(AGENTS_FILE, [])) ?? [];
}

/**
 * Saves the config of agents.
 * @param {AgentConfig[]} agentConfig - The array of agent configs to save.
 * @returns {Promise<void>}
 */
export async function saveAgentConfig(agentConfig: AgentConfig[]): Promise<void> {
  await writeJsonFile<AgentConfig[]>(AGENTS_FILE, agentConfig);
}

interface AgentState {
  agentConfigs: Map<string, AgentConfig>; // the key is the agentId
  agents: Map<string, Agent>; // the key is the agentId, agents are created from agentConfigs, each config is a single agent instance
  isLoading: boolean;
  error: string | null;
  loadAgent: () => Promise<void>;
  addAgent: (newAgentConfigData: Omit<AgentConfig, "id">) => Promise<void>;
  updateAgent: (updatedAgentConfig: AgentConfig) => Promise<void>;
  removeAgent: (agentId: string) => Promise<void>;
  enableAgent: (agentId: string) => Promise<void>;
  disableAgent: (agentId: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agentConfigs: new Map(),
  agents: new Map(),
  isLoading: false,
  error: null,

  loadAgent: async () => {
    set({ isLoading: true, error: null });
    try {
      const loadedAgentConfigs = await loadAgentConfig();
      const agentConfigs = new Map<string, AgentConfig>();
      loadedAgentConfigs.forEach((agentConfig) => {
        agentConfigs.set(agentConfig.id, agentConfig);
      });
      // also create agents from agentConfigs
      const agents = new Map<string, Agent>();
      loadedAgentConfigs.forEach((agentConfig) => {
        agents.set(agentConfig.id, new Agent(agentConfig));
      });
      set({ agentConfigs: agentConfigs, agents: agents, isLoading: false });
    } catch (err) {
      console.error("Error loading agents:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to load agents: ${errorMessage}`, isLoading: false });
    }
  },

  addAgent: async (newAgentConfigData) => {
    set({ isLoading: true, error: null });
    let newAgentConfig: AgentConfig;
    if (newAgentConfigData.kind === 'local') {
      const localConfig = newAgentConfigData as Omit<LocalAgentConfig, "id">;
      if (!localConfig.modelProvider || !localConfig.model || !localConfig.systemPrompt || !localConfig.name || !localConfig.description) {
        throw new Error('Local agent requires modelProvider, model, systemPrompt, name, and description fields');
      }
      newAgentConfig = {
        ...localConfig,
        id: generateId(), // Use the centralized ID generator
      } as LocalAgentConfig;
    } else {
      const remoteConfig = newAgentConfigData as Omit<RemoteAgentConfig, "id">;
      if (!remoteConfig.url || !remoteConfig.apiKey) {
        throw new Error('Remote agent requires url and apiKey fields');
      }
      newAgentConfig = {
        ...remoteConfig,
        id: generateId(), // Use the centralized ID generator
      } as RemoteAgentConfig;
    }
    try {
      const currentAgentConfigs = get().agentConfigs;
      currentAgentConfigs.set(newAgentConfig.id, newAgentConfig);
      await saveAgentConfig(Array.from(currentAgentConfigs.values()));
      // also add the agent to the agents array
      const agents = get().agents;
      agents.set(newAgentConfig.id, new Agent(newAgentConfig));
      set({ agentConfigs: currentAgentConfigs, agents: agents, isLoading: false });
    } catch (err) {
      console.error("Error adding agent config:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to add agent config: ${errorMessage}`, isLoading: false });
      // Optionally revert state if save fails, though Zustand doesn't do this automatically
    }
  },

  /**
   * Update the agent config.
   * NOTE: user cannot update isRetired or isEnabled in this function. It will just be ignored.
   * @param updatedAgentConfig - The updated agent config.
   */
  updateAgent: async (updatedAgentConfig) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgentConfig = get().agentConfigs.get(updatedAgentConfig.id);
      if (!currentAgentConfig) {
        throw new Error(`Agent config with ID ${updatedAgentConfig.id} not found for update.`);
      }
      // check, user cannot update isRetired or isEnabled in this function
      updatedAgentConfig.isRetired = currentAgentConfig.isRetired;
      updatedAgentConfig.isEnabled = currentAgentConfig.isEnabled;

      const updatedAgentConfigs = get().agentConfigs;
      updatedAgentConfigs.set(updatedAgentConfig.id, updatedAgentConfig);
      await saveAgentConfig(Array.from(updatedAgentConfigs.values()));
      // Update the agent in place using the updateConfig method
      const agents = get().agents;
      if (agents.has(updatedAgentConfig.id)) {
        agents.get(updatedAgentConfig.id)!.updateConfig(updatedAgentConfig);
      } else {
        const newAgent = new Agent(updatedAgentConfig);
        agents.set(updatedAgentConfig.id, newAgent);
      }
      set({ agentConfigs: updatedAgentConfigs, agents: agents, isLoading: false });
    } catch (err) {
      console.error("Error updating agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to update agent: ${errorMessage}`, isLoading: false });
    }
  },

  enableAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgentConfig = get().agentConfigs.get(agentId);
      if (!currentAgentConfig) {
        throw new Error(`Agent config with ID ${agentId} not found for update.`);
      }
      currentAgentConfig.isEnabled = true;
      const updatedAgentConfigs = get().agentConfigs;
      updatedAgentConfigs.set(agentId, currentAgentConfig);
      await saveAgentConfig(Array.from(updatedAgentConfigs.values()));
      // if the agent is in the agents array, enable it, otherwise, create a new agent
      const agents = get().agents;
      if (agents.has(agentId)) {
        agents.get(agentId)!.enable();
      } else {
        const newAgent = new Agent(currentAgentConfig);
        agents.set(agentId, newAgent);
      }
      set({ agentConfigs: updatedAgentConfigs, agents: agents, isLoading: false });
    } catch (err) {
      console.error("Error enabling agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to enable agent: ${errorMessage}`, isLoading: false });
    }
  },

  disableAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgentConfig = get().agentConfigs.get(agentId);
      if (!currentAgentConfig) {
        throw new Error(`Agent config with ID ${agentId} not found for update.`);
      }
      currentAgentConfig.isEnabled = false;
      const updatedAgentConfigs = get().agentConfigs;
      updatedAgentConfigs.set(agentId, currentAgentConfig);
      await saveAgentConfig(Array.from(updatedAgentConfigs.values()));
      // if the agent is in the agents array, remove it
      const agents = get().agents;
      if (agents.has(agentId)) {
        agents.delete(agentId);
      }
      set({ agentConfigs: updatedAgentConfigs, agents: agents, isLoading: false });
    } catch (err) {
      console.error("Error disabling agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to disable agent: ${errorMessage}`, isLoading: false });
    }
  },
  removeAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    try {
      const currentAgentConfig = get().agentConfigs.get(agentId);
      if (!currentAgentConfig) {
        throw new Error(`Agent config with ID ${agentId} not found for removal.`);
      }
      const updatedAgentConfigs = get().agentConfigs;
      updatedAgentConfigs.delete(agentId);
      await saveAgentConfig(Array.from(updatedAgentConfigs.values()));
      // if the agent is in the agents array, remove it
      const agents = get().agents;
      if (agents.has(agentId)) {
        agents.delete(agentId);
      }
      set({ agentConfigs: updatedAgentConfigs, agents: agents, isLoading: false });
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
