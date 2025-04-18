import React, { useEffect } from "react";
import { PageContent } from "../layouts/PageContent";
import { GenericList } from "../components/GenericList"; // Import GenericList
import { useToolStore } from "../data/toolStore"; // Import the tool store hook
import { ToolType } from "../types/tool"; // Import ToolType

export const ToolsPage: React.FC = () => {
  // Use the Zustand store hook
  const { tools, loadTools, addTool, updateTool, removeTool } = useToolStore();

  // Load tools when the component mounts
  useEffect(() => {
    loadTools();
  }, [loadTools]); // Dependency array ensures this runs once on mount

  // Placeholder functions for actions - replace with actual logic or modals later
  const handleAddItem = () => {
    console.log("Add new tool clicked");
    // Example: Add a new tool with default values (replace with modal/form)
    const newTool: Omit<ToolType, "id"> = {
      name: `New Tool ${tools.length + 1}`,
      description: "A newly created tool.",
      // Add other required fields if ToolType expands
    };
    addTool(newTool);
  };

  const handleConfigureItem = (id: string) => {
    console.log(`Configure tool with ID: ${id}`);
    // Placeholder: Find the tool and potentially open a settings modal
    const toolToConfigure = tools.find((tool) => tool.id === id);
    if (toolToConfigure) {
      // Example: Update tool (replace with modal/form)
      // updateTool({ ...toolToConfigure, name: toolToConfigure.name + " (Configured)" });
      alert(`Configure action for: ${toolToConfigure.name}`);
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log(`Delete tool with ID: ${id}`);
    // Placeholder: Confirm deletion before removing
    const toolToDelete = tools.find((tool) => tool.id === id);
    if (toolToDelete && window.confirm(`Are you sure you want to delete ${toolToDelete.name}?`)) {
      removeTool(id);
    }
  };

  return (
    <PageContent title="Tools" data-component-id="ToolsPage">
      {/* Render the GenericList component */}
      <GenericList<ToolType> // Specify the type for the items
        title="Manage Tools"
        items={tools}
        onAddItem={handleAddItem}
        onConfigure={handleConfigureItem}
        onDelete={handleDeleteItem}
        className="flex-grow" // Allow list to take available space
        itemClassName="bg-[var(--background-primary)]" // Example item styling
      />
    </PageContent>
  );
};
