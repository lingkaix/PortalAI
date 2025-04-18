import React, { useEffect } from "react";
import { PageContent } from "../layouts/PageContent";
import { GenericList } from "../components/GenericList"; // Import GenericList
import { useKnowledgeStore } from "../data/knowledgeStore"; // Import the knowledge store hook
import { KnowledgeBaseType } from "../types/knowledge"; // Import KnowledgeBaseType

export const KnowledgePage: React.FC = () => {
  // Use the Zustand store hook
  const { knowledgeBases, loadKnowledgeBases, addKnowledgeBase, updateKnowledgeBase, removeKnowledgeBase } = useKnowledgeStore();

  // Load knowledge bases when the component mounts
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]); // Dependency array ensures this runs once on mount

  // Placeholder functions for actions - replace with actual logic or modals later
  const handleAddItem = () => {
    console.log("Add new knowledge base clicked");
    // Example: Add a new knowledge base with default values (replace with modal/form)
    const newKnowledgeBase: Omit<KnowledgeBaseType, "id"> = {
      name: `New Knowledge Base ${knowledgeBases.length + 1}`,
      description: "A newly created knowledge base.",
      // Add other required fields if KnowledgeBaseType expands
    };
    addKnowledgeBase(newKnowledgeBase);
  };

  const handleConfigureItem = (id: string) => {
    console.log(`Configure knowledge base with ID: ${id}`);
    // Placeholder: Find the knowledge base and potentially open a settings modal
    const kbToConfigure = knowledgeBases.find((kb) => kb.id === id);
    if (kbToConfigure) {
      // Example: Update knowledge base (replace with modal/form)
      // updateKnowledgeBase({ ...kbToConfigure, name: kbToConfigure.name + " (Configured)" });
      alert(`Configure action for: ${kbToConfigure.name}`);
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log(`Delete knowledge base with ID: ${id}`);
    // Placeholder: Confirm deletion before removing
    const kbToDelete = knowledgeBases.find((kb) => kb.id === id);
    if (kbToDelete && window.confirm(`Are you sure you want to delete ${kbToDelete.name}?`)) {
      removeKnowledgeBase(id);
    }
  };

  return (
    <PageContent title="Knowledge Bases" data-component-id="KnowledgePage">
      {/* Render the GenericList component */}
      <GenericList<KnowledgeBaseType> // Specify the type for the items
        title="Manage Knowledge Bases"
        items={knowledgeBases}
        onAddItem={handleAddItem}
        onConfigure={handleConfigureItem}
        onDelete={handleDeleteItem}
        className="flex-grow" // Allow list to take available space
        itemClassName="bg-[var(--background-primary)]" // Example item styling
      />
    </PageContent>
  );
};
