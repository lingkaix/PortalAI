import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { useChatStore } from "../data/chatStore";
import { ChatItem } from "./ChatItem";

interface ChatListProps {
  channelId: string | null;
}

export const ChatList: React.FC<ChatListProps> = ({ channelId }) => {
  const { chatId } = useParams<{ chatId?: string }>();
  const channels = useChatStore((state) => state.channels);
  const chats = useChatStore((state) => state.chats);

  // Get channel info
  const channel = channelId ? channels[channelId] : null;
  // Filter chats for this channel
  const channelChats = useMemo(
    () =>
      channelId
        ? Object.values(chats).filter((chat) => chat.channelId === channelId)
        : [],
    [chats, channelId]
  );
  // Sort chats by latestMessageTimestamp
  channelChats.sort((a, b) => (b.latestMessageTimestamp || 0) - (a.latestMessageTimestamp || 0));

  // UI classes
  const containerClasses = "w-72 pt-1 bg-[var(--background-secondary)] border-r border-dashed border-[var(--border-primary)] flex flex-col h-full flex-shrink-0";
  const headerClasses = "p-4 pt-8 border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0";
  const channelNameClasses = "font-semibold text-[var(--text-primary)] truncate";
  const channelDescClasses = "text-xs text-[var(--text-secondary)] truncate";
  const headerButtonClasses = "p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]";
  const chatListContainerClasses = "space-y-1 overflow-y-auto flex-grow px-2";
  const fallbackTextClasses = "px-4 py-4 text-sm text-center text-[var(--text-secondary)]";

  return (
    <div className={containerClasses} data-component-id="ChatList">
      {/* Channel Info Header */}
      <div className={headerClasses}>
        <div className="flex flex-col flex-grow min-w-0">
          <span className={channelNameClasses}>{channel ? channel.name : "Select a channel"}</span>
          {channel && channel.description && (
            <span className={channelDescClasses}>{channel.description}</span>
          )}
        </div>
        {/* Add New Chat Button */}
        {channel && (
          <button
            title="Start New Chat"
            className={headerButtonClasses}
            onClick={() => console.log("Start new chat in channel", channel.id)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      {/* Chat List */}
      <div className={chatListContainerClasses}>
        {channel ? (
          channelChats.length > 0 ? (
            channelChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} isSelected={chat.id === chatId} />
            ))
          ) : (
            <p className={fallbackTextClasses}>No discussions started in this channel yet.</p>
          )
        ) : (
          <p className={fallbackTextClasses}>No channel selected.</p>
        )}
      </div>
      {/* Search Bar */}
      <div className="p-3 flex-shrink-0">
        <div className="relative">
          <input type="search" placeholder="Search chats..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--text-muted)]" />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      </div>
    </div>
  );
};
