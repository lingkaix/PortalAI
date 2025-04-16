import React from "react";
import { Link } from "react-router-dom";
import { Hash, User, ChevronRight } from "lucide-react";
import { ChatType } from "../types";

interface ChatItemProps {
  chat: ChatType;
  isSelected: boolean;
}

// Utility function to format timestamp (can be moved to utils if used elsewhere)
const formatTimestamp = (date?: Date): string => {
  if (!date) return "";
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    // Today: Show time
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } else if (diffHours < 48 && now.getDate() - date.getDate() === 1) {
    // Yesterday
    return "Yesterday";
  } else {
    // Older: Show date
    return date.toLocaleDateString();
  }
};

// Chat Item (Layer 2 Sidebar) - Enhanced Warmth
export const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected }) => {
  const { id, type, name, lastMessage, unreadCount, timestamp } = chat;
  const linkTo = type === "direct" ? `/chat/dm/${id}` : `/chat/group/${id}`;
  const displayName = name || "Unknown Chat";

  // Define class strings using CSS variables
  const baseClasses = "flex items-center px-3 py-3 rounded-lg mx-2 cursor-pointer transition-colors duration-150";
  const selectedStateClasses = "bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20 text-[var(--accent-primary-hover)] dark:text-[var(--accent-secondary)] font-medium";
  const unselectedStateClasses = "text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]";
  const iconClasses = "mr-3 flex-shrink-0 text-[var(--text-muted)]";
  const nameClasses = "text-sm truncate";
  const lastMessageClasses = "text-xs text-[var(--text-secondary)] truncate";
  const timestampClasses = "text-xs text-[var(--text-muted)]";
  const badgeClasses = "inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-[var(--accent-primary-text)] bg-[var(--accent-primary)] rounded-full"; // Use accent color for badge
  const chevronClasses = "ml-2 text-[var(--text-muted)] flex-shrink-0 opacity-60";

  const combinedClasses = `${baseClasses} ${isSelected ? selectedStateClasses : unselectedStateClasses}`;
  return (
    <Link
      to={linkTo}
      className={combinedClasses} data-component-id="ChatItem"
    >
      {/* Softer icon colors */}
      {type === "group" ? <Hash size={16} className={iconClasses} /> : <User size={16} className={iconClasses} />}
      <div className="overflow-hidden flex-grow">
        <div className={`${nameClasses} ${isSelected ? "font-semibold" : "font-normal"}`}>{displayName}</div>
        {lastMessage && <p className={lastMessageClasses}>{lastMessage}</p>}
      </div>
      <div className="ml-2 flex flex-col items-end flex-shrink-0 space-y-1">
        {timestamp && <span className={timestampClasses}>{formatTimestamp(timestamp)}</span>}
        {unreadCount && unreadCount > 0 ? (
          <span className={badgeClasses}>{unreadCount}</span>
        ) : timestamp ? (
          <div className="h-4"></div>
        ) : null}{" "}
        {/* Placeholder for alignment */}
      </div>
      <ChevronRight size={16} className={chevronClasses} />
    </Link>
  );
};
