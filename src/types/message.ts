// src/types/message.ts
import {
  TextPart as A2ATextPart,
  FilePart as A2AFilePart,
  DataPart as A2ADataPart,
} from "./a2a";

// TODO: via action messages, user or agent can change the status of workspace, channel and chat. 
// But we should review each permission carefully.
export type CoreMessage = ContentMessage | ActionMessage;

// --- Application-Specific Metadata for A2APart ---
// These interfaces define how we might structure the `metadata` field within A2A parts
// for our application's internal use, e.g., for caching or UI hints.
export interface AppFilePartMetadata {
  localCachePath?: string;    // Path to a locally cached version of the file
  thumbnailUrl?: string;      // URL or local path to a thumbnail for image/video
  blurhash?: string;          // For image placeholders
  uploadProgress?: number;    // 0-100 if it's an ongoing upload from the client
  errorCode?: string | number;// If file processing/upload failed for this part
  // ... other app-specific file details
}
export interface DataPartMetadata {
  renderHint?: string; // e.g., "adaptive_card_v1.2", "slack_block_kit"
  layoutId?: string; // Identifier for a pre-defined layout template for rich content
  // ... other app-specific data part details
}
export type TextPart = A2ATextPart
export type FilePart = A2AFilePart & { metadata?: { _PortalAppMetadata: AppFilePartMetadata } }
export type DataPart = A2ADataPart & { metadata?: { _PortalAppMetadata: DataPartMetadata } }
export type Part = TextPart | FilePart | DataPart

export const MessageSenderTypeEnum = ["user", // real person
  "agent", // AI model/agent
  "system"] as const; // system message, like '0001' is from Magic Couch(AI admin in the app)
export type MessageSenderType = (typeof MessageSenderTypeEnum)[number];
export const MessageNetworkStateEnum = ["sending", "sent", "received", "receiving_stream", "failed"] as const;
export type MessageNetworkState = (typeof MessageNetworkStateEnum)[number];
export const MessageTypeEnum = ["content", "action"] as const; //
export type MessageType = (typeof MessageTypeEnum)[number];

export interface BaseMessage {
  id: string;        // Unique ID for this message/event (UUID v7 recommended)

  workspaceId: string;      // ID of the workspace
  channelId: string;        // ID of the channel this message belongs to
  chatId: string;           // ID of the chat/channel this message belongs to

  senderId: string;         // ID of the User, Agent, or special "system" ID
  senderType: MessageSenderType;

  // ID of the task this message is related to. '0000' means the message has not related to any task.
  taskId: string;
  // we should give this message a short summary for quickly gethering the context of the message
  summary?: string | null;

  /**
    * Timestamp string when the message was created.
    * Epoch time in milliseconds, created by the database when inserting the message.
    * Not comparable to the timestamp in the A2A Message structure (ISO 8601).
    * */
  timestamp: number;

  replyTo?: string | null; // message id of the message this message is replying to

  networkState: MessageNetworkState;

  type: MessageType; // The primary type of event this message represents
  payload: Record<string, any> | Part[]; // Typed by interfaces above based on `type`.

  // --- fields below match the A2A Message structure ---
  // General Purpose Metadata for any other custom data, versioning, source system info, trace IDs etc.
  // Avoid putting core, frequently accessed fields here; promote them to top-level if common.
  metadata?: Record<string, any> | null;

}

// for transforming between Messages in Sqlite (with Drizzle schema) and ContentMessage
export type ContentMeta = Omit<ContentMessage, keyof BaseMessage>

export interface ContentMessage extends BaseMessage {
  type: "content";
  // `parts` will hold the primary content, structured as A2A Parts.
  // For activities (like USER_JOINED), `parts` might be empty or contain a system-generated summary,
  // while `activityPayload` holds the structured data.
  payload: Part[];
  // --- Interaction & Lifecycle State ---
  reactions?: Array<{ emoji: string; userIds: string[]; count: number; }>;
  isEdited?: boolean;
  editHistory?: Array<{ editorUserId: string; editedAt: number; previousPartsHash: string; }>; // Hash(SHA256) of A2APart[] without the metadata
  isDeleted?: boolean; // Soft delete flag for this message itself
  deletedInfo?: { deletedByUserId: string; deletedAt: string; };

  isStarred?: boolean; // whether the message is starred by the user, default to false

  /** List of tasks referenced as context by this message.*/
  referenceTaskIds?: string[];
  /** The context the message is associated with */
  contextId?: string | null;
  isTaskArtifact?: boolean; // whether the message is a (A2A) task artifact, default to false
  /** Identifier created by the message creator (in a2a agent network).
   * if the message is created by the user / system in the app, it equals to the id.
   * '0000' means the message is not in a a2a network (e.g. local message).
   * if isTaskArtifact is true, a2aId is the id of the task artifact.
  */
  a2aId?: string | null;

  // --- Safety, Moderation, Security ---
  // TODO: post MVP
  safetyRatings?: Array<{
    provider: string; // e.g., "google_perspective", "openai_moderation"
    category: string; // e.g., "HATE_SPEECH", "SELF_HARM"
    severityScore?: number; // 0.0 - 1.0
    isBlocked?: boolean;
  }>;
  moderationStatus?: 'approved' | 'rejected' | 'pending_manual_review' | 'auto_flagged';
  sensitivity?: 'confidential' | 'internal_only' | 'public'; // Data sensitivity classification
}

// TODO: define all kinds of actions' playload
export interface ActionMessage extends BaseMessage {
  type: "action";
  payload: Record<string, any>;
}




