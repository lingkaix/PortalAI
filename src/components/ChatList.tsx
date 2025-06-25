import React, { useState, useMemo, useEffect } from "react"; // Consolidated React imports
import { useParams } from "react-router-dom"; // Consolidated router imports
import { Search, Settings, Plus, ChevronRight, ChevronDown, ChevronsUpDown, MessageSquarePlus } from "lucide-react"; // Consolidated Lucide imports
import { useChatStore } from "../data/chatStore";
import { useSettingsStore } from "../data/settingsStore";
import { Avatar } from "./Avatar"; // Import Avatar component
import { ChatItem } from "./ChatItem"; // Import ChatItem component

interface ChatListProps {
  selectedWorkspaceId: string | null;
}

// Chat List Component (Layer 2 Content)
export const ChatList: React.FC<ChatListProps> = ({ selectedWorkspaceId }) => {
  const { chatId } = useParams<{ chatId?: string }>();
  const currentChatId = chatId;
  // Get current user info from settings
  const name = useSettingsStore((state) => state.name);
  const status = useSettingsStore((state) => state.status);
  // Use a default avatar (could be improved later)
  const avatar = "/default-avatar.png";
  const currentUser = { id: "0000", name, status, avatar };

  // Get channels and chats from chatStore
  const channels = useChatStore((state) => state.channels);
  const chats = useChatStore((state) => state.chats);

  // Filter channels and chats based on selected workspace
  const filteredChannels = useMemo(() => Object.values(channels).filter((channel) => !selectedWorkspaceId || channel.workspaceId === selectedWorkspaceId), [channels, selectedWorkspaceId]);
  const filteredChats = useMemo(() => Object.values(chats).filter((chat) => !selectedWorkspaceId || chat.workspaceId === selectedWorkspaceId), [chats, selectedWorkspaceId]);

  // State to track expanded channels
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  // Initialize/Reset expanded state when filtered channels change (workspace switch)
  useEffect(() => {
    setExpandedChannels(new Set(filteredChannels.map((c) => c.id))); // Default to all expanded
  }, [filteredChannels]);

  // Group chats by channelId
  const chatsByChannel = filteredChats.reduce((acc, chat) => {
    (acc[chat.channelId] = acc[chat.channelId] || []).push(chat);
    return acc;
  }, {} as Record<string, typeof filteredChats[number][]>);

  // Sort chats within each channel by latestMessageTimestamp
  Object.values(chatsByChannel).forEach((chats) => chats.sort((a, b) => (b.latestMessageTimestamp || 0) - (a.latestMessageTimestamp || 0)));

  // Find the channel containing the selected chat
  const activeChannelId = useMemo(() => {
    if (!currentChatId) return null;
    const chat = filteredChats.find((c) => c.id === currentChatId);
    return chat?.channelId ?? null;
  }, [currentChatId, filteredChats]);

  // Toggle channel expansion
  const handleChannelToggle = (channelId: string) => {
    setExpandedChannels((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(channelId)) {
        newExpanded.delete(channelId);
      } else {
        newExpanded.add(channelId);
      }
      return newExpanded;
    });
  };

  // Toggle all channels expansion
  const handleToggleAllChannels = () => {
    if (expandedChannels.size === filteredChannels.length) {
      // If all are expanded, collapse all
      setExpandedChannels(new Set());
    } else {
      // Otherwise, expand all
      setExpandedChannels(new Set(filteredChannels.map((c) => c.id)));
    }
  };

  // Define class strings using CSS variables
  const containerClasses = "w-72 pt-1 bg-[var(--background-secondary)] border-r border-dashed border-[var(--border-primary)] flex flex-col h-full flex-shrink-0";
  const headerClasses = "p-4 pt-8 border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0";
  const userNameClasses = "ml-2 font-medium text-[var(--text-primary)]";
  const headerButtonClasses = "p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]";
  const searchInputClasses = "w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--text-muted)]";
  const searchIconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]";
  const channelHeaderBaseClasses = "px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider flex items-center cursor-pointer rounded-md"; // Base styles + rounded
  const channelHeaderDefaultClasses = "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] mx-1"; // Default state + hover bg + margin
  const channelHeaderActiveClasses = "text-[var(--text-accent)] bg-[var(--background-tertiary)] mx-1"; // Active state + margin
  const channelIconClasses = "mr-1.5 transition-transform duration-200"; // Base icon styles
  const channelIconDefaultClasses = "text-[var(--text-muted)]"; // Default icon color
  const channelIconActiveClasses = "text-[var(--text-accent)]"; // Active icon color
  const chatListContainerClasses = "pl-6 space-y-1 overflow-hidden"; // Indent chats further + overflow hidden
  const fallbackTextClasses = "px-4 py-4 text-sm text-center text-[var(--text-secondary)]";

  return (
    <div className={containerClasses} data-component-id="ChatList">
      {/* Top Bar / Header */}
      <div className={headerClasses}>
        <div className="flex items-center">
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" status={currentUser.status} />
          <span className={userNameClasses}>{currentUser.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          {/* Expand/Collapse All Button */}
          {filteredChannels.length > 0 && (
            <button title={expandedChannels.size === filteredChannels.length ? "Collapse All" : "Expand All"} className={headerButtonClasses} onClick={handleToggleAllChannels}>
              <ChevronsUpDown size={16} />
            </button>
          )}
          {/* TODO: Implement Add Channel/Chat functionality */}
          <button title="New Channel" className={headerButtonClasses} onClick={() => console.log("New Channel clicked")}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Channel and Chat List Area */}
      <div className="flex-grow overflow-y-auto py-2 space-y-1">
        {filteredChannels.length > 0 ? (
          filteredChannels.map((channel) => {
            const isExpanded = expandedChannels.has(channel.id);
            const isActive = channel.id === activeChannelId;
            const Icon = isExpanded ? ChevronDown : ChevronRight;
            const headerDynamicClasses = isActive ? channelHeaderActiveClasses : channelHeaderDefaultClasses;
            const iconDynamicClasses = isActive ? channelIconActiveClasses : channelIconDefaultClasses;

            return (
              <div key={channel.id}>
                {/* Channel Header (Clickable) */}
                <div className={`${channelHeaderBaseClasses} ${headerDynamicClasses}`} onClick={() => handleChannelToggle(channel.id)} role="button" aria-expanded={isExpanded} aria-controls={`channel-content-${channel.id}`}>
                  <Icon
                    size={14}
                    className={`${channelIconClasses} ${iconDynamicClasses} ${isExpanded ? "rotate-0" : "-rotate-90"}`} // Combine base, active/default color, and rotation
                  />
                  <span className="flex-grow truncate mr-2">{channel.name}</span> {/* Allow name to truncate */}
                  {/* Add New Chat and Channel Settings Buttons */}
                  <div className="flex items-center flex-shrink-0 ml-auto space-x-1">
                    <button
                      title="Channel Settings"
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-hover)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Settings for ${channel.name}`);
                      }} // Prevent channel toggle
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      title="New Chat in Channel"
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-hover)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`New Chat in ${channel.name}`);
                      }} // Prevent channel toggle
                    >
                      <MessageSquarePlus size={14} />
                    </button>
                  </div>
                </div>
                {/* Chats within the channel (Conditional Rendering) */}
                <div
                  id={`channel-content-${channel.id}`} // Accessibility
                  className={`${chatListContainerClasses} transition-max-height duration-300 ease-in-out ${isExpanded ? "max-h-screen" : "max-h-0"}`} // Simple expand/collapse animation
                >
                  {(chatsByChannel[channel.id] || []).map((chat) => (
                    <ChatItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <p className={fallbackTextClasses}>No channels in this workspace yet.</p>
        )}
        {/* Fallback if no chats exist at all in the workspace (even if channels do) */}
        {filteredChannels.length > 0 && filteredChats.length === 0 && <p className={fallbackTextClasses}>No discussions started in this workspace yet.</p>}
      </div>

      {/* Search Bar */}
      <div className="p-3 flex-shrink-0">
        <div className="relative">
          <input type="search" placeholder="Search chats..." className={searchInputClasses} />
          <Search size={16} className={searchIconClasses} />
        </div>
      </div>
    </div>
  );
};
