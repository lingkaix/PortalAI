import React, { useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";
import { useChatStore } from "../data/chatStore";
import { ChatHeader } from "./ChatHeader";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { MessageSquare } from "lucide-react";
import type { Part, TextPart, MessageSenderType } from "../types/message";

interface ChatViewProps {
  chatId: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatId }) => {
  const navigate = useNavigate();
  // if no chatId, go back to dashboard
  if (!chatId) {
    navigate('/');
    return null;
  }

  const addMessage = useChatStore((state) => state.addMessage);
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  const updateLastViewedMessage = useChatStore((state) => state.updateLastViewedMessage);
  const chat = useChatStore((state) => state.chats[chatId]);
  const messages = chat.messages.filter((msg) => msg.type === 'content');
  const lastViewedMessageId = chat.lastViewedMessageId;
  const virtuosoRef = useRef<any>(null);
  const lastViewedIndex = messages.findIndex((msg) => msg.id === lastViewedMessageId);

  // Scroll to lastViewedMessageId on mount
  useEffect(() => {
    if (lastViewedIndex >= 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: lastViewedIndex, align: 'center', behavior: 'auto' });
    }
    // eslint-disable-next-line
  }, [chatId]);

  // Periodically update lastViewedMessageId to the last visible message
  useEffect(() => {
    if (!messages.length) return;
    const interval = setInterval(() => {
      // Find the last message in view (or just the last message for now)
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== lastViewedMessageId) {
        updateLastViewedMessage(chatId, lastMsg.id);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [chatId, messages, lastViewedMessageId, updateLastViewedMessage]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!chat) return;
    // Compose a new message object (with correct payload type)
    const newMessage = {
      id: Date.now().toString(),
      chatId: chat.id,
      channelId: chat.channelId,
      senderId: "0000", // local user
      senderType: "user" as MessageSenderType,
      taskId: "0000",
      timestamp: Date.now(),
      networkState: "sending" as const,
      type: "content" as const,
      payload: [{ kind: 'text', text: messageContent } as TextPart] as Part[],
    };
    await addMessage(newMessage);
  }, [chat, addMessage]);

  const chatAreaContainerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden";
  const noMessagesContainerClasses = "flex-grow flex flex-col items-center justify-center text-center p-10";
  const noMessagesIconClasses = "text-[var(--text-muted)] mb-4";

  return (
    <div className={chatAreaContainerClasses}>
      <ChatHeader chat={chat} />
      <div className="flex-grow overflow-y-auto p-5">
        {chat && messages.length > 0 ? (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            firstItemIndex={0}
            initialTopMostItemIndex={lastViewedIndex >= 0 ? lastViewedIndex : undefined}
            itemContent={(index, msg) => (
              <Message key={msg.id} message={msg} isCurrentUser={msg.senderId === "0000"} />
            )}
            startReached={() => loadMoreMessages(chatId)}
            followOutput={true}
            style={{ flex: 1 }}
          />
        ) : (
          <div className={noMessagesContainerClasses}>
            <MessageSquare size={48} className={noMessagesIconClasses} />
            No messages yet. Be the first to say hello!
          </div>
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};