import { create } from "zustand";
import { AgentConfig, LocalAgentConfig, RemoteAgentConfig } from "../types";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
import { generateId } from "../lib/utils";
import { LanguageModelV1 } from "ai";
import { AgentCard } from "@/types/a2a";
import { getModel } from "../lib/models";

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
  isLoading: boolean;
  error: string | null;
  loadAgent: () => Promise<void>;
  addAgent: (newAgentConfigData: Omit<AgentConfig, "id">) => Promise<void>;
  updateAgent: (updatedAgentConfig: AgentConfig) => Promise<void>;
  removeAgent: (agentId: string) => Promise<void>;
  enableAgent: (agentId: string) => Promise<void>;
  disableAgent: (agentId: string) => Promise<void>;

  _localAgentModels: Map<string, LanguageModelV1>;
  _remoteAgentCards: Map<string, AgentCard>;
  getLocalAgent: (agentId: string) => LocalAgentConfig & {
    model: LanguageModelV1;
  } | null;
  getRemoteAgent: (agentId: string) => RemoteAgentConfig & AgentCard | null;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agentConfigs: new Map(),
  isLoading: false,
  error: null,
  _localAgentModels: new Map(),
  _remoteAgentCards: new Map(),

  getLocalAgent: (agentId: string) => {
    const agentConfig = get().agentConfigs.get(agentId);
    if (!agentConfig || agentConfig.kind !== 'local') return null;
    let model = get()._localAgentModels.get(agentId);
    if (!model) {
      model = getModel(agentConfig.provider, agentConfig.model, agentConfig.apiKey);
      get()._localAgentModels.set(agentId, model);
    }
    return {
      ...agentConfig,
      model,
    } as LocalAgentConfig & {
      model: LanguageModelV1;
    };
  },
  getRemoteAgent: (agentId: string) => {
    const agentConfig = get().agentConfigs.get(agentId);
    if (!agentConfig || agentConfig.kind !== 'remote') return null;
    let card = get()._remoteAgentCards.get(agentId);
    if (!card) {
      // TODO: get agent card from url
    }
    return {
      ...agentConfig,
      ...card,
    } as RemoteAgentConfig & AgentCard;
  },
  loadAgent: async () => {
    set({ isLoading: true, error: null });
    try {
      const loadedAgentConfigs = await loadAgentConfig();
      const agentConfigs = new Map<string, AgentConfig>();
      loadedAgentConfigs.forEach((agentConfig) => {
        agentConfigs.set(agentConfig.id, agentConfig);
      });
      set({ agentConfigs: agentConfigs, isLoading: false });
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
      if (!localConfig.provider || !localConfig.model || !localConfig.systemPrompt || !localConfig.name || !localConfig.description) {
        throw new Error('Local agent requires provider, model, systemPrompt, name, and description fields');
      }
      newAgentConfig = {
        ...localConfig,
        id: generateId(),
      } as LocalAgentConfig;
    } else {
      const remoteConfig = newAgentConfigData as Omit<RemoteAgentConfig, "id">;
      if (!remoteConfig.url || !remoteConfig.apiKey) {
        throw new Error('Remote agent requires url and apiKey fields');
      }
      newAgentConfig = {
        ...remoteConfig,
        id: generateId(),
      } as RemoteAgentConfig;
    }
    try {
      const currentAgentConfigs = get().agentConfigs;
      currentAgentConfigs.set(newAgentConfig.id, newAgentConfig);
      await saveAgentConfig(Array.from(currentAgentConfigs.values()));
      set({ agentConfigs: currentAgentConfigs, isLoading: false });
    } catch (err) {
      console.error("Error adding agent config:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to add agent config: ${errorMessage}`, isLoading: false });
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
      // user cannot update isRetired or isEnabled in this function
      updatedAgentConfig.isRetired = currentAgentConfig.isRetired;
      updatedAgentConfig.isEnabled = currentAgentConfig.isEnabled;

      const updatedAgentConfigs = get().agentConfigs;
      updatedAgentConfigs.set(updatedAgentConfig.id, updatedAgentConfig);
      await saveAgentConfig(Array.from(updatedAgentConfigs.values()));
      set({ agentConfigs: updatedAgentConfigs, isLoading: false });
    } catch (err) {
      console.error("Error updating agent:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to update agent: ${errorMessage}`, isLoading: false });
    }
    // update local agent model or remote agent card
    if (updatedAgentConfig.kind === 'local') {
      const localAgent = get().getLocalAgent(updatedAgentConfig.id);
      if (localAgent) {
        get()._localAgentModels.set(updatedAgentConfig.id, getModel(updatedAgentConfig.provider, updatedAgentConfig.model, updatedAgentConfig.apiKey));
      }
    } else {
      const remoteAgent = get().getRemoteAgent(updatedAgentConfig.id);
      if (remoteAgent) {
        // TODO: get agent card from url
      }
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
      set({ agentConfigs: updatedAgentConfigs, isLoading: false });
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
      set({ agentConfigs: updatedAgentConfigs, isLoading: false });
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
      set({ agentConfigs: updatedAgentConfigs, isLoading: false });
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
