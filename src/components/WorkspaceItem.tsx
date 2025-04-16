import React from "react";
import { WorkspaceType } from "../types";

interface WorkspaceItemProps {
  workspace: WorkspaceType;
  isSelected: boolean;
  onClick: () => void;
}

// Workspace Item (Layer 1 Sidebar) - Enhanced Warmth
export const WorkspaceItem: React.FC<WorkspaceItemProps> = ({ workspace, isSelected, onClick }) => {
  // Define class strings using CSS variables
  const baseClasses = "relative flex items-center justify-center w-12 h-12 rounded-2xl m-1.5 transition-all duration-200 ease-in-out transform hover:scale-105";
  // Selected state uses accent color
  const selectedStateClasses = "bg-[var(--accent-primary)]/20 dark:bg-[var(--accent-primary)]/30 text-[var(--accent-primary-hover)] dark:text-[var(--accent-secondary)] scale-105";
  // Unselected state uses secondary background for hover
  const unselectedStateClasses = "text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]";
  const indicatorClasses = "absolute left-0 top-1/2 transform -translate-y-1/2 h-8 w-1 bg-[var(--accent-primary)] rounded-r-full";

  const combinedClasses = `${baseClasses} ${isSelected ? selectedStateClasses : unselectedStateClasses}`;
  return (
    <button
      onClick={onClick}
      title={workspace.name}
      className={combinedClasses} data-component-id="WorkspaceItem"
    >
      {/* Selection indicator */}
      {isSelected && <span className={indicatorClasses}></span>}
      {workspace.icon}
    </button>
  );
};
