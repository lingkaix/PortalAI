import {
  ContentMessage,
  MessageSenderType,
  MessageNetworkState,
  Part,
  CoreMessage,
  ContentMeta,
} from "../types";
import { generateId } from "./utils";
import * as schema from "../lib/db/schema";
import { Message, TextPart } from "ai";

/**
 * Creates a ContentMessage with sensible defaults.
 * This function aligns with the CoreMessage structure defined in `src/types/message.ts`.
 */
export function newContentMessage(params: {
  chatId: string;
  channelId: string;
  senderId: string;
  senderType: MessageSenderType;
  payload: Part[];
  id?: string;
  taskId?: string;
  timestamp?: number; // epoch time in milliseconds
  replyTo?: string;
  networkState?: MessageNetworkState;
  metadata?: Record<string, any>;
  // You can add other optional ContentMessage fields here if needed
  // e.g., summary, isStarred, etc.
}): ContentMessage {
  const now = Date.now();

  return {
    // BaseMessage fields
    id: params.id || generateId(),
    channelId: params.channelId,
    chatId: params.chatId,
    senderId: params.senderId,
    senderType: params.senderType,
    taskId: params.taskId || "0000",
    timestamp: params.timestamp || now,
    replyTo: params.replyTo,
    networkState: params.networkState || 'sending',
    type: "content",
    payload: params.payload,
    metadata: params.metadata,
    // ContentMessage specific fields with defaults
    reactions: [],
    isEdited: false,
    editHistory: [],
    isDeleted: false,
    isStarred: false,
  };
}

/**
 * separate the base message and the meta data of the content message
 */
export function separateContentMeta(message: ContentMessage): { base: Omit<typeof schema.messages.$inferInsert, 'contentMeta'>, meta: ContentMeta } {
  const {
    reactions, isEdited, editHistory, isDeleted, deletedInfo, isStarred,
    referenceTaskIds, contextId, isTaskArtifact, a2aId, safetyRatings,
    moderationStatus, sensitivity,
    ...base
  } = message;

  const meta: ContentMeta = {
    reactions, isEdited, editHistory, isDeleted, deletedInfo, isStarred,
    referenceTaskIds, contextId, isTaskArtifact, a2aId, safetyRatings,
    moderationStatus, sensitivity
  };

  return { base, meta };
}

/**
 * inflate the message from the database to the content message (if it is)
 */
export function inflateMessage(dbMessage: typeof schema.messages.$inferSelect): CoreMessage {
  if (dbMessage.type === 'content' && dbMessage.contentMeta) {
    return {
      ...dbMessage,
      ...dbMessage.contentMeta
    } as ContentMessage;
  }
  return dbMessage as CoreMessage;
}

/**
 * transform a AI SDK message to CotentMessage
 */
// export function formAIMessage(aiMessage: Message):
//   Omit<ContentMessage, 'id'| 'chatId' | 'channelId' | 'senderId' | 'senderType'> {
//   // transform part format from ai SDK to our own
//   const parts = aiMessage.parts?.map(part => {
//     return {
//       kind: 'text',
//       text: part.text,
//     };
//   });
//   return newContentMessage({
//     type: 'content',
//     senderType: 'agent',
//     payload: parts,
//   });
// }