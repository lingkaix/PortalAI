import React, { useEffect } from "react";
import { PageContent } from "../layouts/PageContent";
import { GenericList } from "../components/GenericList"; // Import GenericList
import { useAgentStore } from "../data/agentStore"; // Import the agent store hook
import { Agent } from "../types/agent"; // Import AgentType directly

export const AgentsPage: React.FC = () => {
  // Use the Zustand store hook
  const { agents, loadAgents, addAgent, updateAgent, removeAgent } = useAgentStore();

  // Load agents when the component mounts
  useEffect(() => {
    loadAgents();
  }, [loadAgents]); // Dependency array ensures this runs once on mount

  // Placeholder functions for actions - replace with actual logic or modals later
  const handleAddItem = () => {
    console.log("Add new agent clicked");
    // Example: Add a new agent with default values (replace with modal/form)
    const newAgent: Omit<Agent, "id"> = {
      // Use AgentType
      name: `New Agent ${agents.length + 1}`,
      description: "A newly created agent.",
      // systemPrompt: 'You are a helpful assistant.', // Remove properties not in AgentType yet
      // tools: [],
      // knowledgeBases: [],
      // config: {},
      // createdAt: new Date(),
      // updatedAt: new Date(),
    };
    addAgent(newAgent);
  };

  const handleConfigureItem = (id: string) => {
    console.log(`Configure agent with ID: ${id}`);
    // Placeholder: Find the agent and potentially open a settings modal
    const agentToConfigure = agents.find((agent) => agent.id === id);
    if (agentToConfigure) {
      // Example: Update agent (replace with modal/form)
      // updateAgent({ ...agentToConfigure, name: agentToConfigure.name + " (Configured)" });
      alert(`Configure action for: ${agentToConfigure.name}`);
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log(`Delete agent with ID: ${id}`);
    // Placeholder: Confirm deletion before removing
    const agentToDelete = agents.find((agent) => agent.id === id);
    if (agentToDelete && window.confirm(`Are you sure you want to delete ${agentToDelete.name}?`)) {
      removeAgent(id);
    }
  };

  return (
    <PageContent title="Agents" data-component-id="AgentsPage">
      {" "}
      {/* Removed className */}
      {/* Render the GenericList component */}
      <GenericList<Agent> // Specify the type for the items
        title="Manage Agents"
        items={agents}
        onAddItem={handleAddItem}
        onConfigure={handleConfigureItem}
        onDelete={handleDeleteItem}
        className="flex-grow" // Allow list to take available space
        itemClassName="bg-[var(--background-primary)]" // Example item styling
      />
    </PageContent>
  );
};
