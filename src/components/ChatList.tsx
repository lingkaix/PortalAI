import React from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Settings, Plus, ChevronRight } from "lucide-react";
import { mockChats, mockUsers } from "../data/mockData"; // Import mock data
import { ChatType } from "../types"; // Import types
import { Avatar } from "./Avatar"; // Import Avatar component
import { ChatItem } from "./ChatItem"; // Import ChatItem component

interface ChatListProps {
  selectedWorkspaceId: string | null;
}

// Chat List Component (Layer 2 Content)
export const ChatList: React.FC<ChatListProps> = ({ selectedWorkspaceId }) => {
  const { chatId } = useParams<{ chatId?: string }>(); // chatId might be undefined
  const currentChatId = chatId;
  const currentUser = mockUsers["user3"]; // Assuming current user

  // Filter chats based on selected workspace
  const filteredChats = mockChats.filter((chat) => chat.workspaceId === selectedWorkspaceId);

  // Categorize filtered chats
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0); // Start of yesterday
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0); // Start of today

  const recentChats = filteredChats.filter((c) => c.timestamp && c.timestamp >= startOfToday);
  const yesterdayChats = filteredChats.filter((c) => c.timestamp && c.timestamp < startOfToday && c.timestamp >= yesterday);
  const olderChats = filteredChats.filter((c) => !c.timestamp || c.timestamp < yesterday); // Include chats without timestamp here

  // Sort chats within categories by timestamp (most recent first)
  const sortByTimestampDesc = (a: ChatType, b: ChatType) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
  recentChats.sort(sortByTimestampDesc);
  yesterdayChats.sort(sortByTimestampDesc);
  olderChats.sort(sortByTimestampDesc);

  // Define class strings using CSS variables
  const containerClasses = "w-72 bg-[var(--background-secondary)] border-r border-[var(--border-primary)] flex flex-col h-full flex-shrink-0";
  const headerClasses = "p-4 border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0";
  const userNameClasses = "ml-2 font-medium text-[var(--text-primary)]";
  const newChatButtonClasses = "p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]";
  const searchInputClasses = "w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--text-muted)]";
  const searchIconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]";
  const categoryHeaderClasses = "px-4 pt-2 pb-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider";
  const fallbackTextClasses = "px-4 py-4 text-sm text-center text-[var(--text-secondary)]";
  const settingsContainerClasses = "p-2 border-t border-[var(--border-primary)] flex-shrink-0";
  const settingsLinkClasses = "flex items-center px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)] transition-colors duration-150";
  const settingsIconClasses = "text-[var(--text-secondary)]"; // Icons inherit text color usually
  const settingsTextClasses = "ml-2 text-sm font-medium"; // Inherits from link
  const settingsChevronClasses = "ml-auto text-[var(--text-muted)] opacity-60";


  return (
    <div className={containerClasses}>
      {/* Top Bar / Header - Warmer Style */}
      <div className={headerClasses}>
        <div className="flex items-center">
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" status={currentUser.status} />
          <span className={userNameClasses}>{currentUser.name}</span>
        </div>
        <div>
          {/* TODO: Implement Add Chat functionality */}
          <button title="New Chat" className={newChatButtonClasses}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Search Bar - Warmer Style */}
      <div className="p-3 flex-shrink-0">
        <div className="relative">
          <input
            type="search"
            placeholder="Search chats..."
            className={searchInputClasses}
          />
          <Search size={16} className={searchIconClasses} />
        </div>
      </div>

      {/* Chat List Area - Increased Padding */}
      <div className="flex-grow overflow-y-auto py-2 space-y-1.5">
        {" "}
        {/* Increased spacing */}
        {/* Category Headers - Warmer Style */}
        {recentChats.length > 0 && (
          <>
            <h3 className={categoryHeaderClasses}>Recent</h3>
            {recentChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} />
            ))}
          </>
        )}
        {yesterdayChats.length > 0 && (
          <>
            <h3 className={categoryHeaderClasses}>Yesterday</h3>
            {yesterdayChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} />
            ))}
          </>
        )}
        {olderChats.length > 0 && (
          <>
            <h3 className={categoryHeaderClasses}>Previous</h3>
            {olderChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} />
            ))}
          </>
        )}
        {/* Fallback if no chats in selected workspace */}
        {filteredChats.length === 0 && <p className={fallbackTextClasses}>No chats in this workspace yet.</p>}
      </div>

      {/* Bottom Settings Link - Warmer Style */}
      <div className={settingsContainerClasses}>
        <Link to="/settings" className={settingsLinkClasses}>
          <Settings size={16} className={settingsIconClasses} />
          <span className={settingsTextClasses}>Settings</span>
          <ChevronRight size={16} className={settingsChevronClasses} />
        </Link>
      </div>
    </div>
  );
};
