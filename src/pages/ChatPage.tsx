import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { mockChats, mockMessages, mockUsers, mockWorkspaces } from "../data/mockData"; // Added mockWorkspaces
import { MessageType, ChatType } from "../types";
import { Message } from "../components/Message";
import { ChatInput } from "../components/ChatInput";
import { ChatHeader } from "../components/ChatHeader";
import { ChatList } from "../components/ChatList"; // Import ChatList

export const ChatPage: React.FC = () => {
  const { chatId, chatType } = useParams<{ chatId?: string; chatType?: "dm" | "group" }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: This needs proper workspace context later. For now, just use the first one.
  const selectedWorkspaceId = mockWorkspaces[0]?.id || null;

  const currentChat = mockChats.find((c) => c.id === chatId && c.type === (chatType === "dm" ? "direct" : "group"));
  const [messages, setMessages] = useState<MessageType[]>([]);

  useEffect(() => {
    setMessages(chatId ? mockMessages[chatId] || [] : []);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = (messageContent: string) => {
    if (!currentChat) return;
    console.log(`Sending message to ${currentChat.id}:`, messageContent);
    const newMessage: MessageType = {
      id: `m${Date.now()}`,
      sender: mockUsers["user3"],
      content: messageContent,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    if (mockMessages[currentChat.id]) {
      mockMessages[currentChat.id].push(newMessage);
    } else {
      mockMessages[currentChat.id] = [newMessage];
    }
    const chatIndex = mockChats.findIndex((c) => c.id === currentChat.id);
    if (chatIndex !== -1) {
      mockChats[chatIndex].lastMessage = messageContent;
      mockChats[chatIndex].timestamp = new Date();
    }
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
      {/* Pass the selectedWorkspaceId (needs proper context later) */}
      <ChatList selectedWorkspaceId={selectedWorkspaceId} />

      {/* Main Chat Area */}
      <div className={chatAreaContainerClasses}>
        {!currentChat ? (
          // Render placeholder if no chat is selected
          <div className={placeholderContainerClasses}>
            <MessageSquare size={64} className={placeholderIconClasses} />
            <h2 className={placeholderHeadingClasses}>Select a Conversation</h2>
            <p className={placeholderTextClasses}>Choose a chat from the left sidebar to start messaging.</p>
          </div>
        ) : (
          // Render the main chat view
          <>
            <ChatHeader chat={currentChat} />
            <div className="flex-grow overflow-y-auto p-5 space-y-2">
              {messages.length > 0 ? (
                messages.map((msg) => <Message key={msg.id} message={msg} isCurrentUser={msg.sender.id === "user3"} />)
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
