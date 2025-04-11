import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { mockChats, mockMessages, mockUsers } from "../data/mockData";
import { MessageType, ChatType } from "../types";
import { Message } from "../components/Message";
import { ChatInput } from "../components/ChatInput";
import { ChatHeader } from "../components/ChatHeader";

// Chat Page Component - Displays the main chat interface
export const ChatPage: React.FC = () => {
  // Get chat type and ID from URL parameters
  const { chatId, chatType } = useParams<{ chatId?: string; chatType?: "dm" | "group" }>();
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to bottom

  // Find the current chat based on URL params
  const currentChat = mockChats.find((c) => c.id === chatId && c.type === (chatType === "dm" ? "direct" : "group"));

  // State for messages in the current chat
  const [messages, setMessages] = useState<MessageType[]>([]);

  // Effect to load messages when chatId changes
  useEffect(() => {
    setMessages(chatId ? mockMessages[chatId] || [] : []);
  }, [chatId]);

  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    // Use "auto" for instant scroll on new message, "smooth" for user-initiated scroll
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Handler for sending a new message
  const handleSendMessage = (messageContent: string) => {
    if (!currentChat) return; // Should not happen if chat is selected, but good practice

    console.log(`Sending message to ${currentChat.id}:`, messageContent);

    // Create the new message object
    const newMessage: MessageType = {
      id: `m${Date.now()}`, // Simple unique ID generation
      sender: mockUsers["user3"], // Assume current user is sending
      content: messageContent,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
    };

    // Update the local messages state
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Update the mock data (in a real app, this would be an API call)
    if (mockMessages[currentChat.id]) {
      mockMessages[currentChat.id].push(newMessage);
    } else {
      mockMessages[currentChat.id] = [newMessage];
    }

    // Update the chat list's last message and timestamp
    const chatIndex = mockChats.findIndex((c) => c.id === currentChat.id);
    if (chatIndex !== -1) {
      mockChats[chatIndex].lastMessage = messageContent;
      mockChats[chatIndex].timestamp = new Date();
      // Note: This direct mutation of mockChats won't trigger re-renders in ChatList
      // unless ChatList's props change or it fetches data itself.
      // In a real app, state management (Context, Redux, Zustand) would handle this.
    }
  };

  // Render placeholder if no chat is selected
  // Define class strings using CSS variables
  const mainContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden"; // Use primary background
  const placeholderContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] items-center justify-center text-center p-10";
  const placeholderIconClasses = "text-[var(--text-muted)] mb-4";
  const placeholderHeadingClasses = "text-xl font-semibold text-[var(--text-secondary)] mb-2";
  const placeholderTextClasses = "text-[var(--text-secondary)]";
  const noMessagesContainerClasses = "text-center text-[var(--text-secondary)] mt-10";
  const noMessagesIconClasses = "mx-auto mb-2 opacity-40"; // Color inherited

  if (!currentChat) {
    // Render placeholder if no chat is selected
    return (
      <div className={placeholderContainerClasses}>
        <MessageSquare size={64} className={placeholderIconClasses} />
        <h2 className={placeholderHeadingClasses}>Select a Conversation</h2>
        <p className={placeholderTextClasses}>Choose a chat from the left sidebar to start messaging.</p>
      </div>
    );
  }

  // Render the main chat view
  return (
    <div className={mainContainerClasses}>
      {/* Removed comment */}
      {/* Chat Header */}
      <ChatHeader chat={currentChat} />
      {/* Message List - Increased Padding */}
      <div className="flex-grow overflow-y-auto p-5 space-y-2">
        {/* Removed comment */}
        {messages.length > 0 ? (
          messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              isCurrentUser={msg.sender.id === "user3"} // Determine if message is from current user
            />
          ))
        ) : (
          // Placeholder when chat has no messages
          <div className={noMessagesContainerClasses}>
            <MessageSquare size={48} className={noMessagesIconClasses} />
             No messages yet. Be the first to say hello!
          </div>
        )}
        {/* Empty div to target for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      {/* Chat Input Area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};
