import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Message } from "../components/Message";
import { ChatInput } from "../components/ChatInput";
import { ChatHeader } from "../components/ChatHeader";
import { ChatList } from "../components/ChatList";
import { useChatStore } from "../data/chatStore";
import { useSettingsStore } from "../data/settingsStore";

  /** 
   * /chat/:channelId 
   * /chat/:channelId/:chatId
   */
export const ChatPage: React.FC = () => {
  const { chatId, chatType } = useParams<{ chatId?: string; chatType?: "dm" | "group" }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user info from settings
  const name = useSettingsStore((state) => state.name);
  const status = useSettingsStore((state) => state.status);
  const avatar = "/default-avatar.png";
  const currentUser = { id: "0000", name, status, avatar };

  // Get chats and messages from chatStore
  const chats = useChatStore((state) => state.chats);
  const chat = chatId ? chats[chatId] : undefined;
  const messages = chat ? chat.messages : [];

  // TODO: Replace with real workspace context if available
  const selectedWorkspaceId = chat ? chat.workspaceId : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = (messageContent: string) => {
    // TODO: Use useSignalStore or useChatStore.addMessage for real message sending
    // This is a placeholder for now
    // You may want to call useChatStore.getState().addMessage or similar
    // For now, do nothing
  };

  // Define class strings using CSS variables
  const pageContainerClasses = "flex h-full overflow-hidden"; // Main container for list + chat
  const chatAreaContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden"; // Chat area container
  const placeholderContainerClasses = "flex-grow flex flex-col items-center justify-center text-center p-10";
  const placeholderIconClasses = "text-[var(--text-muted)] mb-4";
  const placeholderHeadingClasses = "text-xl font-semibold text-[var(--text-secondary)] mb-2";
  const placeholderTextClasses = "text-[var(--text-secondary)]";
  const noMessagesContainerClasses = "text-center text-[var(--text-secondary)] mt-10";
  const noMessagesIconClasses = "mx-auto mb-2 opacity-40";

  return (
    <div className={pageContainerClasses} data-component-id="ChatPage">
      {/* Chat List Sidebar */}
      <ChatList selectedWorkspaceId={selectedWorkspaceId} />
      {/* Main Chat Area */}
      <div className={chatAreaContainerClasses}>
        {!chat ? (
          <div className={placeholderContainerClasses}>
            <MessageSquare size={64} className={placeholderIconClasses} />
            <h2 className={placeholderHeadingClasses}>Select a Conversation</h2>
            <p className={placeholderTextClasses}>Choose a chat from the left sidebar to start messaging.</p>
          </div>
        ) : (
          <>
            <ChatHeader chat={chat} />
            <div className="flex-grow overflow-y-auto p-5 space-y-2">
              {messages.length > 0 ? (
                messages.filter((msg) => msg.type === 'content').map((msg) => <Message key={msg.id} message={msg} isCurrentUser={msg.senderId === currentUser.id} />)
              ) : (
                <div className={noMessagesContainerClasses}>
                  <MessageSquare size={48} className={noMessagesIconClasses} />
                  No messages yet. Be the first to say hello!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    </div>
  );
};
