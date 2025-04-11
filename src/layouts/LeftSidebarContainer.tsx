import React, { useState } from "react";
import { Plus } from "lucide-react";
import { mockWorkspaces } from "../data/mockData"; // Import mock data
import { WorkspaceItem } from "../components/WorkspaceItem";
import { ChatList } from "../components/ChatList";

// Left Sidebar Container (Handles Layer 1 & Layer 2)
export const LeftSidebarContainer: React.FC = () => {
  // Default to the first workspace or null if none exist
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(mockWorkspaces[0]?.id || null);

  // Define class strings using CSS variables
  const layer1SidebarClasses = "w-20 bg-[var(--background-secondary)] border-r border-[var(--border-primary)] flex flex-col items-center py-3 space-y-1 flex-shrink-0";
  const addWorkspaceButtonClasses = "flex items-center justify-center w-12 h-12 rounded-2xl m-1.5 border-2 border-dashed border-[var(--border-secondary)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors duration-150";

  return (
    <div className="flex h-full flex-shrink-0 pt-8">
      {/* Layer 1: Workspace Sidebar */}
      <div className={layer1SidebarClasses}>
        {mockWorkspaces.map((ws) => (
          <WorkspaceItem key={ws.id} workspace={ws} isSelected={ws.id === selectedWorkspaceId} onClick={() => setSelectedWorkspaceId(ws.id)} />
        ))}
        {/* Add workspace button */}
        <button
          title="Add Workspace"
          className={addWorkspaceButtonClasses}
          // TODO: Implement Add Workspace functionality
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Layer 2: Chat List Sidebar */}
      <ChatList selectedWorkspaceId={selectedWorkspaceId} />
    </div>
  );
};
