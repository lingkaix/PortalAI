import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Message } from "../components/Message";
import { ChatInput } from "../components/ChatInput";
import { ChatHeader } from "../components/ChatHeader";
import { ChatList } from "../components/ChatList";
import { useChatStore } from "../data/chatStore";
import { ChatView } from "../components/ChatView";

/** 
 * /chat/:channelId 
 * /chat/:channelId/:chatId
 */
export const ChatPage: React.FC = async () => {
  const { channelId, chatId } = useParams<{ channelId?: string; chatId?: string }>();
  const [viewMode, setViewMode] = useState<'chat' | 'create' | 'search'>('chat');

  let chatLoaded = false;
  if (chatId) {
    // we check and load chat here for ChatView to use
    chatLoaded = await useChatStore.getState().setActiveChat(chatId);
  }

  // Define class strings using CSS variables
  const pageContainerClasses = "flex h-full overflow-hidden";
  const chatAreaContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden";
  const placeholderContainerClasses = "flex-grow flex flex-col items-center justify-center text-center p-10";
  const placeholderIconClasses = "text-[var(--text-muted)] mb-4";
  const placeholderHeadingClasses = "text-xl font-semibold text-[var(--text-secondary)] mb-2";
  const placeholderTextClasses = "text-[var(--text-secondary)]";

  // Placeholder components
  const ChatCreationDialog = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
      <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">Create a New Chat</h2>
      <p className="text-[var(--text-secondary)]">Chat creation dialog goes here.</p>
    </div>
  );
  const SearchResult = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
      <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">Search Results</h2>
      <p className="text-[var(--text-secondary)]">Search results will be displayed here.</p>
    </div>
  );

  return (
    <div className={pageContainerClasses} data-component-id="ChatPage">
      {/* Chat List Sidebar */}
      <ChatList channelId={channelId || null} />
      {/* Main Chat Area (switchable) */}
      <div className={chatAreaContainerClasses}>
        {!chatLoaded && viewMode === 'chat' ? (
          <div className={placeholderContainerClasses}>
            <MessageSquare size={64} className={placeholderIconClasses} />
            <h2 className={placeholderHeadingClasses}>Select a Conversation</h2>
            <p className={placeholderTextClasses}>Choose a chat from the left sidebar to start messaging.</p>
          </div>
        ) : viewMode === 'create' ? (
          <ChatCreationDialog />
        ) : viewMode === 'search' ? (
          <SearchResult />
        ) : (
          <ChatView
            chatId={chatId!}
          />
        )}
      </div>
    </div>
  );
};
