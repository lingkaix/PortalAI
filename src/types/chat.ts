// src/types/chat.ts
import { UserType } from "./user"; // Import dependency

/**
 * Represents the type of chat (direct message or group).
 */
export type ChatTypeValue = "direct" | "group";

/**
 * Represents a chat conversation.
 */
export type ChatType = {
  id: string;
  type: ChatTypeValue;
  name: string;
  avatar?: string; // Optional avatar, e.g., for group chats
  lastMessage?: string; // Preview of the last message
  unreadCount?: number; // Number of unread messages
  timestamp?: Date; // Timestamp of the last activity/message
  participants?: UserType[]; // List of participants (especially for group chats)
  workspaceId: string; // Link chat to a workspace
  channelId: string; // Link chat to a channel within a workspace
};