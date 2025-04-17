import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Users, Menu } from "lucide-react";
import { ChatType, UserType } from "../types";
import { mockUsers } from "../data/mockData";
import { useRightSidebar } from "../contexts/RightSidebarContext";
import { Avatar } from "./Avatar";

interface ChatHeaderProps {
  chat: ChatType | undefined;
}

// Helper to find user by name (consider a more robust lookup in a real app)
const findUserByName = (name: string): UserType | undefined => {
  return Object.values(mockUsers).find((user) => user.name === name);
};

// Chat Header Component
export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { openSidebar } = useRightSidebar();

  // Render a placeholder if no chat is selected
  // Define class strings using CSS variables to avoid JSX parsing issues
  const placeholderClasses = "p-4 h-18 border-b border-[var(--border-primary)] bg-[var(--card-background)] flex-shrink-0";
  const headerBaseClasses = "p-4 pt-6 h-18 border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0 bg-[var(--card-background)]";
  const groupIconClasses = "w-9 h-9 rounded-xl border border-[var(--border-primary)] bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] dark:text-[var(--accent-primary)] flex-shrink-0"; // Use primary accent
  const chatNameClasses = "font-medium text-[var(--text-primary)] truncate";
  const subtitleClasses = "text-xs text-[var(--text-secondary)]";
  const sidebarButtonClasses = "p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--background-tertiary)] transition-colors";
  const sidebarHeadingClasses = "font-semibold mb-3 text-[var(--text-primary)]";
  const sidebarSubHeadingClasses = "text-sm font-medium text-[var(--text-secondary)] mb-2";
  const sidebarTextClasses = "text-sm text-[var(--text-primary)]";
  const sidebarMutedTextClasses = "text-xs text-[var(--text-muted)]";
  const sidebarLinkClasses = "mt-3 block text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] hover:underline";
  const sidebarItalicTextClasses = "text-sm text-[var(--text-muted)] italic";


  if (!chat) {
    // Render a placeholder if no chat is selected
    return <div className={placeholderClasses}></div>;
  }

  const directUser = chat.type === "direct" ? findUserByName(chat.name) : undefined;

  // Content for the Right Sidebar (defined here for context)
  // In a larger app, this might be a separate component or generated differently
  const sidebarContent = (
    <div className="space-y-5">
      <div>
        <h4 className={sidebarHeadingClasses}>Conversation Info</h4>
        {/* Group Participants Section */}
        {chat.type === "group" && chat.participants && (
          <div className="mb-4">
            <h5 className={sidebarSubHeadingClasses}>Participants ({chat.participants.length})</h5>
            <ul className="space-y-2.5">
              {chat.participants.map((p) => (
                <li key={p.id} className={`flex items-center space-x-2 text-sm ${sidebarTextClasses}`}>
                  <Avatar src={p.avatar} alt={p.name} size="sm" status={p.status} />
                  <span>{p.name}</span>
                  {/* Indicate if the participant is the current user */}
                  {p.id === "user3" && <span className={sidebarMutedTextClasses}>(You)</span>}
                </li>
              ))}
            </ul>
            {/* Link to group management page */}
            <Link to={`/group/${chat.id}/admin`} className={sidebarLinkClasses}>
              Manage Group
            </Link>
          </div>
        )}
        {/* Direct Message User Info Section */}
        {chat.type === "direct" && directUser && (
          <div className="mb-4 flex items-center space-x-3">
            <Avatar src={directUser.avatar} alt={directUser.name} size="lg" status={directUser.status} />
            <div>
              <h5 className={`font-semibold ${sidebarTextClasses}`}>{directUser.name}</h5>
              <p className={`${subtitleClasses} capitalize`}>{directUser.status}</p>
            </div>
          </div>
        )}
      </div>
      {/* Placeholder sections for shared files and pinned messages */}
      <div>
        <h5 className={sidebarSubHeadingClasses}>Shared Files</h5>
        <p className={sidebarItalicTextClasses}>No files shared yet.</p>
      </div>
      <div>
        <h5 className={sidebarSubHeadingClasses}>Pinned Messages</h5>
        <p className={sidebarItalicTextClasses}>No pinned messages.</p>
      </div>
    </div>
  );

  return (
    <div className={headerBaseClasses} data-component-id="ChatHeader"  data-tauri-drag-region>
      {/* Left side: Avatar/Icon and Chat Name */}
      <div className="flex items-center space-x-3 overflow-hidden">
        {/* Removed comment */}
        {/* Direct message avatar */}
        {chat.type === "direct" && directUser && <Avatar src={directUser.avatar} alt={directUser.name} size="md" status={directUser.status} />}
        {/* Group chat icon */}
        {chat.type === "group" && (
          <div className={groupIconClasses}>
            <Users size={18} />
          </div>
        )}
        {/* Chat name and subtitle */}
        <div className="overflow-hidden">
          {/* Removed comment */}
          <h2 className={chatNameClasses}>{chat.name}</h2>
          {/* Optional: Add subtitle like member count */}
          {chat.type === "group" && chat.participants && <span className={subtitleClasses}>{chat.participants.length} members</span>}
          {/* Optional: Add subtitle for DM status */}
          {chat.type === "direct" && directUser && <span className={`${subtitleClasses} capitalize`}>{directUser.status}</span>}
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Removed comments */}
        <button onClick={() => openSidebar(sidebarContent)} className={sidebarButtonClasses} aria-label="Show conversation details">
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
};
