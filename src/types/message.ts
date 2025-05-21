// src/types/message.ts
import { UserType } from "./user"; // Import dependency

/**
 * TODO: Do we need a warp of a2a.Message?
 */
export type MessageType = {
  id: string;
  sender: UserType;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
};