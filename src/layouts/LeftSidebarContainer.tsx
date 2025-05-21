import React from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling
import { MessageSquare, Users, Wrench, Database, Settings, ChevronsUpDown } from "lucide-react";
import { mockWorkspaces } from "../data/mockData"; // Keep for switcher
import { Avatar } from "../components/Avatar"; // For workspace icon

// Define Nav Item structure
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  const baseClasses = "flex flex-col items-center justify-center w-12 h-12 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--text-primary)] transition-colors duration-150";
  const activeClasses = "bg-[var(--background-selected)] text-[var(--text-primary)]"; // Style for active link

  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ""}`}
    >
      <Icon size={24} className="mb-1" />
      {/* <span className="text-xs font-medium">{label}</span> */}
    </NavLink>
  );
};


export const LeftSidebarContainer: React.FC = () => {
  // Define class strings using CSS variables
  const sidebarClasses = "w-16 bg-[var(--background-secondary)] border-r border-[var(--border-primary)] flex flex-col items-center py-3 space-y-1 flex-shrink-0 pt-8"; // Added pt-8 back
  const navItemsContainerClasses = "flex-grow flex flex-col items-center space-y-2 mt-4"; // Container for nav items
  const bottomControlsClasses = "mt-auto flex flex-col items-center space-y-2 pb-2"; // Container for bottom controls
  const workspaceSwitcherClasses = "hidden flex items-center justify-center w-12 h-12 rounded-lg hover:bg-[var(--background-hover)] cursor-pointer transition-colors duration-150"; // Simple button style for now
  const settingsButtonClasses = "flex items-center justify-center w-12 h-12 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--text-primary)] transition-colors duration-150";

  // TODO: Implement workspace switching logic
  const currentWorkspace = mockWorkspaces[0]; // Just use the first one for display

  return (
    <div className={sidebarClasses} data-component-id="LeftSidebarContainer">
      {/* Navigation Items */}
      <div className={navItemsContainerClasses}>
        <NavItem to="/" icon={MessageSquare} label="Discuss" />
        <NavItem to="/agents" icon={Users} label="Agents" />
        <NavItem to="/tools" icon={Wrench} label="Tools" />
        <NavItem to="/knowledge" icon={Database} label="Knowledge" />
      </div>

      {/* Bottom Controls */}
      <div className={bottomControlsClasses}>
        {/* Workspace Switcher - Placeholder */}
        <button title={`Workspace: ${currentWorkspace?.name}`} className={workspaceSwitcherClasses}>
          {currentWorkspace?.icon ? (
            <span className="flex items-center justify-center w-full h-full">{currentWorkspace.icon}</span> // Render the icon node directly
          ) : currentWorkspace ? (
             <Avatar src="" alt={currentWorkspace.name} size="md" /> // Use alt for fallback, empty src
          ) : (
            <ChevronsUpDown size={20} className="text-[var(--text-muted)]" /> // Fallback icon
          )}
        </button>

        {/* Settings Button */}
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) => `${settingsButtonClasses} ${isActive ? "bg-[var(--background-selected)] text-[var(--text-primary)]" : ""}`}
        >
          <Settings size={20} />
        </NavLink>
      </div>
    </div>
  );
};
