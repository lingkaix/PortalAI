import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Message } from "../components/Message";
import { ChatInput } from "../components/ChatInput";
import { ChatHeader } from "../components/ChatHeader";
import { ChatList } from "../components/ChatList";
import { useChatStore } from "../data/chatStore";

  /** 
   * /chat/:channelId 
   * /chat/:channelId/:chatId
   */
export const ChatPage: React.FC = () => {
  const { channelId, chatId } = useParams<{ channelId?: string; chatId?: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chats and messages from chatStore
  const chats = useChatStore((state) => state.chats);
  const chat = chatId ? chats[chatId] : undefined;
  const messages = chat ? chat.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = (messageContent: string) => {
    // TODO: Use useSignalStore or useChatStore.addMessage for real message sending
    // For now, do nothing
  };

  // Define class strings using CSS variables
  const pageContainerClasses = "flex h-full overflow-hidden";
  const chatAreaContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden";
  const placeholderContainerClasses = "flex-grow flex flex-col items-center justify-center text-center p-10";
  const placeholderIconClasses = "text-[var(--text-muted)] mb-4";
  const placeholderHeadingClasses = "text-xl font-semibold text-[var(--text-secondary)] mb-2";
  const placeholderTextClasses = "text-[var(--text-secondary)]";
  const noMessagesContainerClasses = "text-center text-[var(--text-secondary)] mt-10";
  const noMessagesIconClasses = "mx-auto mb-2 opacity-40";

  return (
    <div className={pageContainerClasses} data-component-id="ChatPage">
      {/* Chat List Sidebar */}
      <ChatList channelId={channelId || null} />
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
                messages.filter((msg) => msg.type === 'content').map((msg) => <Message key={msg.id} message={msg} isCurrentUser={false} />)
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
