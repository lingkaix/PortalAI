import React, { useEffect } from "react";
import { PageContent } from "../layouts/PageContent";
import { GenericList } from "../components/GenericList";
import { useAgentStore } from "../data/agentStore";
import { AgentConfig } from "../types/agent";

// Helper to map AgentConfig to ListItem
function agentConfigToListItem(agent: AgentConfig) {
  if (agent.kind === 'local') {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
    };
  } else {
    return {
      id: agent.id,
      name: agent.url,
      description: agent.url,
    };
  }
}

export const AgentsPage: React.FC = () => {
  // Use the Zustand store hook
  const { agentConfigs, loadAgent, addAgent, updateAgent, removeAgent } = useAgentStore();
  const agents = Array.from(agentConfigs.values());
  const listItems = agents.map(agentConfigToListItem);

  // Load agents when the component mounts
  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  // Placeholder functions for actions - replace with actual logic or modals later
  const handleAddItem = () => {
    console.log("Add new agent clicked");
    const newAgent: Omit<import("../types/agent").LocalAgentConfig, 'id'> = {
      kind: 'local',
      name: `New Agent ${agents.length + 1}`,
      description: "A newly created agent.",
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: '',
      systemPrompt: 'You are a helpful assistant.',
      isEnabled: true,
      isRetired: false,
    };
    addAgent(newAgent);
  };

  const handleConfigureItem = (id: string) => {
    console.log(`Configure agent with ID: ${id}`);
    const agentToConfigure = agents.find((agent) => agent.id === id);
    if (agentToConfigure) {
      alert(`Configure action for: ${agentToConfigure.kind === 'local' ? agentToConfigure.name : agentToConfigure.url}`);
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log(`Delete agent with ID: ${id}`);
    const agentToDelete = agents.find((agent) => agent.id === id);
    if (agentToDelete && window.confirm(`Are you sure you want to delete ${agentToDelete.kind === 'local' ? agentToDelete.name : agentToDelete.url}?`)) {
      removeAgent(id);
    }
  };

  return (
    <PageContent title="Agents" data-component-id="AgentsPage">
      <GenericList
        title="Manage Agents"
        items={listItems}
        onAddItem={handleAddItem}
        onConfigure={handleConfigureItem}
        onDelete={handleDeleteItem}
        className="flex-grow"
        itemClassName="bg-[var(--background-primary)]"
      />
    </PageContent>
  );
};
