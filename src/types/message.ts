// src/types/message.ts
import {
  TextPart as A2ATextPart,
  FilePart as A2AFilePart,
  DataPart as A2ADataPart,
  Artifact as A2AArtifact, // For AgentTaskUpdatePayload
} from "./a2a";

// TODO: via action messages, user or agent can change the status of workspace, channel and chat.
// But we should review each permission carefully.
// And we may move some message types to signal types, if the action is only from system rather than user or agent.
export type CoreMessage = ContentMessage | UserJoinedChatMessage | UserLeftChatMessage
  | UserInvitedToChatMessage | ChatMetadataUpdatedMessage | ChannelCreatedMessage | ChannelDeletedMessage
  | MessageEditedMessage | MessageDeletedMessage | ReactionAddedMessage | ReactionRemovedMessage
  | MessagePinnedMessage | MessageUnpinnedMessage | SystemNotificationMessage | AgentActionRequestMessage
  | AgentActionResponseMessage | AgentTaskUpdateMessage | CustomActivityMessage;

// --- ActivityType Enum (Defines the nature of the CoreMessage) ---
export const ActivityTypeEnum = [
  "content_message", "custom_activity",
  "user_joined_chat", "user_left_chat", "user_invited_to_chat", "chat_metadata_updated",
  "channel_created", "channel_deleted",
  "message_edited", "message_deleted", "reaction_added", "reaction_removed", "message_pinned", "message_unpinned",
  "system_notification", "agent_action_request", "agent_action_response", "agent_task_update",
] as const;
export type ActivityTypeValue = (typeof ActivityTypeEnum)[number];

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

// --- CoreMessage Definition (Independent of A2AMessage structure) ---
export const MessageSenderTypeEnum = ["user", "agent", "system"] as const;
export type MessageSenderType = (typeof MessageSenderTypeEnum)[number];
export const MessageNetworkStateEnum = ["sending", "sent", "received", "receiving_stream", "failed"] as const;
export type MessageNetworkState = (typeof MessageNetworkStateEnum)[number];
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

  type: ActivityTypeValue; // The primary type of event this message represents
  payload: Record<string, any> | Part[]; // Typed by interfaces above based on `type`.

  // --- fields below match the A2A Message structure ---
  // General Purpose Metadata for any other custom data, versioning, source system info, trace IDs etc.
  // Avoid putting core, frequently accessed fields here; promote them to top-level if common.
  metadata?: Record<string, any> | null;

}

export interface ContentMessage extends BaseMessage {
  type: "content_message";
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
  /** Identifier created by the message creator (in a2a agent network).
   * if the message is created by the user / system in the app, it equals to the id.
   * '0000' means the message is not in a a2a network (e.g. local message).
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

// --- Activity Payload Interfaces (for CoreMessage.activityPayload) ---
// These describe the structured data for specific activity types.
export interface UserJoinedChatPayload { joinedUserId: string; invitedByUserId?: string; method?: 'invitation' | 'link' | 'added_by_admin'; }
export interface UserLeftChatPayload { leftUserId: string; removedByUserId?: string; reason?: string; }
export interface UserInvitedToChatPayload { invitedUserId: string; invitedByUserId: string; message?: string; }
export interface ChatMetadataUpdatedPayload { updatedFields: Array<keyof ChatMetadataFields>; oldValues?: Partial<ChatMetadataFields>; newValues: Partial<ChatMetadataFields>; }
export interface ChatMetadataFields { name?: string; topic?: string; avatarUrl?: string; isPrivate?: boolean; } // Helper for above
export interface ChannelCreatedPayload { channelId: string; name: string; creatorId: string; isPrivate?: boolean; members?: string[]; }
export interface ChannelDeletedPayload { channelId: string; deleterId: string; reason?: string; }
export interface MessageEditedPayload { targetMessageId: string; /* New content is in the CoreMessage.parts */ }
export interface MessageDeletedPayload { targetMessageId: string; /* This is a soft delete marker for targetMessageId */ }
export interface ReactionAddedPayload { targetMessageId: string; emoji: string; /* Reactor is senderId */ }
export interface ReactionRemovedPayload { targetMessageId: string; emoji: string; /* Remover is senderId */ }
export interface MessagePinnedPayload { targetMessageId: string; }
export interface MessageUnpinnedPayload { targetMessageId: string; }
export interface SystemNotificationPayload { title?: string; text: string; level?: 'info' | 'warning' | 'error' | 'success'; requiresAck?: boolean; detailsUrl?: string; }
export interface AgentActionRequestPayload { command: string; targetAgentId?: string; params?: Record<string, any>; requestSource?: 'user_typed' | 'ui_button'; }
export interface AgentActionResponsePayload { originalRequestId: string; status: 'success' | 'failure' | 'pending'; details?: string | Record<string, any>; resultingArtifacts?: A2AArtifact[]; }
export interface AgentTaskUpdatePayload { taskId: string; status?: string; progress?: number; description?: string; artifacts?: A2AArtifact[]; }
export interface CustomActivityPayload { customType: string; data: Record<string, any>; }

export interface UserJoinedChatMessage extends BaseMessage {
  type: "user_joined_chat";
  payload: UserJoinedChatPayload;
}
export interface UserLeftChatMessage extends BaseMessage {
  type: "user_left_chat";
  payload: UserLeftChatPayload;
}
export interface UserInvitedToChatMessage extends BaseMessage {
  type: "user_invited_to_chat";
  payload: UserInvitedToChatPayload;
}
export interface ChatMetadataUpdatedMessage extends BaseMessage {
  type: "chat_metadata_updated";
  payload: ChatMetadataUpdatedPayload;
}
export interface ChannelCreatedMessage extends BaseMessage {
  type: "channel_created";
  payload: ChannelCreatedPayload;
}
export interface ChannelDeletedMessage extends BaseMessage {
  type: "channel_deleted";
  payload: ChannelDeletedPayload;
}
export interface MessageEditedMessage extends BaseMessage {
  type: "message_edited";
  payload: MessageEditedPayload;
}
export interface MessageDeletedMessage extends BaseMessage {
  type: "message_deleted";
  payload: MessageDeletedPayload;
}
export interface ReactionAddedMessage extends BaseMessage {
  type: "reaction_added";
  payload: ReactionAddedPayload;
}
export interface ReactionRemovedMessage extends BaseMessage {
  type: "reaction_removed";
  payload: ReactionRemovedPayload;
}
export interface MessagePinnedMessage extends BaseMessage {
  type: "message_pinned";
  payload: MessagePinnedPayload;
}
export interface MessageUnpinnedMessage extends BaseMessage {
  type: "message_unpinned";
  payload: MessageUnpinnedPayload;
}
export interface SystemNotificationMessage extends BaseMessage {
  type: "system_notification";
  payload: SystemNotificationPayload;
}
export interface AgentActionRequestMessage extends BaseMessage {
  type: "agent_action_request";
  payload: AgentActionRequestPayload;
}
export interface AgentActionResponseMessage extends BaseMessage {
  type: "agent_action_response";
  payload: AgentActionResponsePayload;
}
export interface AgentTaskUpdateMessage extends BaseMessage {
  type: "agent_task_update";
  payload: AgentTaskUpdatePayload;
}
export interface CustomActivityMessage extends BaseMessage {
  type: "custom_activity";
  payload: CustomActivityPayload;
}