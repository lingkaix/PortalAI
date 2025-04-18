// src/types/message.ts
import { UserType } from "./user"; // Import dependency

/**
 * TODO: Represents a single message within a chat.
 */
export type MessageType = {
  id: string;
  sender: UserType;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
};