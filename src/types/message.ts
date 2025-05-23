// src/types/message.ts
import {
  TextPart as A2ATextPart,
  FilePart as A2AFilePart,
  DataPart as A2ADataPart,
  Artifact as A2AArtifact, // For AgentTaskUpdatePayload
} from "./a2a";

export type CoreMessage = ContentMessage | UserJoinedChatMessage | UserLeftChatMessage
  | UserInvitedToChatMessage | ChatMetadataUpdatedMessage | ChannelCreatedMessage | ChannelDeletedMessage
  | MessageEditedMessage | MessageDeletedMessage | ReactionAddedMessage | ReactionRemovedMessage
  | MessagePinnedMessage | MessageUnpinnedMessage | SystemNotificationMessage | AgentActionRequestMessage
  | AgentActionResponseMessage | AgentTaskUpdateMessage | CustomActivityMessage;

// --- ActivityType Enum (Defines the nature of the CoreMessage) ---
export enum ActivityType {
  // Standard Communication
  CONTENT_MESSAGE = "content_message",          // User/Agent content message, it may contain text, files, or structured data (e.g., rich content)

  // Membership & Chat/Channel Management
  USER_JOINED_CHAT = "user_joined_chat",
  USER_LEFT_CHAT = "user_left_chat",
  USER_INVITED_TO_CHAT = "user_invited_to_chat",
  CHAT_METADATA_UPDATED = "chat_metadata_updated", // e.g., name, topic, avatar of the chat
  CHANNEL_CREATED = "channel_created",          // System event indicating a new channel/chat was made
  CHANNEL_DELETED = "channel_deleted",

  // Message Interactions
  MESSAGE_EDITED = "message_edited",
  MESSAGE_DELETED = "message_deleted",      // Soft deletion of a target message
  REACTION_ADDED = "reaction_added",
  REACTION_REMOVED = "reaction_removed",
  MESSAGE_PINNED = "message_pinned",
  MESSAGE_UNPINNED = "message_unpinned",

  // System, Moderation & Agent-Specific Actions
  SYSTEM_NOTIFICATION = "system_notification",  // Generic notification from the system
  AGENT_ACTION_REQUEST = "agent_action_request",// User explicitly requests an agent to do something (e.g., /ban @user)
  // The payload would detail the action.
  AGENT_ACTION_RESPONSE = "agent_action_response",// Agent's response/confirmation to an action request.
  AGENT_TASK_UPDATE = "agent_task_update",    // Agent provides an update on a background task

  // Fallback/Custom for extensibility, for future use
  CUSTOM_ACTIVITY = "custom_activity",
}

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
export type FilePart = A2AFilePart & { metadata?: { _PortalAppFile: AppFilePartMetadata } }
export type DataPart = A2ADataPart & { metadata?: { _PortalAppData: DataPartMetadata } }
export type Part = TextPart | FilePart | DataPart

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


// --- CoreMessage Definition (Independent of A2AMessage structure) ---
export interface BaseMessage {
  messageId: string;        // Unique ID for this message/event (UUID v7 recommended)
  clientMessageId?: string; // Optional: client-generated ID for optimistic updates

  workspaceId: string;      // ID of the workspace
  channelId?: string;        // ID of the channel this message belongs to
  chatId: string;           // ID of the chat/channel this message belongs to
  taskId?: string;         // If part of a task, ID of the root message of the task

  senderId: string;         // ID of the User, Agent, or special "system" ID
  senderType: 'user' | 'agent' | 'system';

  timestamp: string;        // ISO 8601 string: when the event was created/processed by the system

  type: ActivityType; // The primary type of event this message represents
  payload?: Record<string, any> | Part[]; // Typed by interfaces above based on `type`.

  // --- General Purpose Metadata ---
  // For any other custom data, versioning, source system info, trace IDs etc.
  // Avoid putting core, frequently accessed fields here; promote them to top-level if common.
  metadata?: Record<string, any>;
}

export interface ContentMessage extends BaseMessage {
  type: ActivityType.CONTENT_MESSAGE;
  // `parts` will hold the primary content, structured as A2A Parts.
  // For activities (like USER_JOINED), `parts` might be empty or contain a system-generated summary,
  // while `activityPayload` holds the structured data.
  payload: Part[];
  // --- Interaction & Lifecycle State ---
  reactions?: Array<{ emoji: string; userIds: string[]; count: number; }>;
  isEdited?: boolean;
  editHistory?: Array<{ editorUserId: string; editedAt: string; previousPartsHash?: string; }>; // Hash of A2APart[]
  isDeleted?: boolean; // Soft delete flag for this message itself
  deletedInfo?: { deletedByUserId: string; deletedAt: string; };

  // --- Relational & Contextual Info ---
  replyToMessageId?: string;
  relatedA2ATaskIds?: string[]; // IDs of A2A tasks this message might be relevant to or trigger

  // --- UI & Client-Side State ---
  uiState?: 'sending' | 'sent' | 'delivered_to_server' | 'delivered_to_recipient' | 'viewed' | 'failed_to_send' | 'pending_retry';
  isPinned?: boolean;

  // --- Safety, Moderation, Security ---
  safetyRatings?: Array<{
    provider: string; // e.g., "google_perspective", "openai_moderation"
    category: string; // e.g., "HATE_SPEECH", "SELF_HARM"
    severityScore?: number; // 0.0 - 1.0
    isBlocked?: boolean;
  }>;
  moderationStatus?: 'approved' | 'rejected' | 'pending_manual_review' | 'auto_flagged';
  sensitivity?: 'confidential' | 'internal_only' | 'public'; // Data sensitivity classification
}
export interface UserJoinedChatMessage extends BaseMessage {
  type: ActivityType.USER_JOINED_CHAT;
  payload: UserJoinedChatPayload;
}
export interface UserLeftChatMessage extends BaseMessage {
  type: ActivityType.USER_LEFT_CHAT;
  payload: UserLeftChatPayload;
}
export interface UserInvitedToChatMessage extends BaseMessage {
  type: ActivityType.USER_INVITED_TO_CHAT;
  payload: UserInvitedToChatPayload;
}
export interface ChatMetadataUpdatedMessage extends BaseMessage {
  type: ActivityType.CHAT_METADATA_UPDATED;
  payload: ChatMetadataUpdatedPayload;
}
export interface ChannelCreatedMessage extends BaseMessage {
  type: ActivityType.CHANNEL_CREATED;
  payload: ChannelCreatedPayload;
}
export interface ChannelDeletedMessage extends BaseMessage {
  type: ActivityType.CHANNEL_DELETED;
  payload: ChannelDeletedPayload;
}
export interface MessageEditedMessage extends BaseMessage {
  type: ActivityType.MESSAGE_EDITED;
  payload: MessageEditedPayload;
}
export interface MessageDeletedMessage extends BaseMessage {
  type: ActivityType.MESSAGE_DELETED;
  payload: MessageDeletedPayload;
}
export interface ReactionAddedMessage extends BaseMessage {
  type: ActivityType.REACTION_ADDED;
  payload: ReactionAddedPayload;
}
export interface ReactionRemovedMessage extends BaseMessage {
  type: ActivityType.REACTION_REMOVED;
  payload: ReactionRemovedPayload;
}
export interface MessagePinnedMessage extends BaseMessage {
  type: ActivityType.MESSAGE_PINNED;
  payload: MessagePinnedPayload;
}
export interface MessageUnpinnedMessage extends BaseMessage {
  type: ActivityType.MESSAGE_UNPINNED;
  payload: MessageUnpinnedPayload;
}
export interface SystemNotificationMessage extends BaseMessage {
  type: ActivityType.SYSTEM_NOTIFICATION;
  payload: SystemNotificationPayload;
}
export interface AgentActionRequestMessage extends BaseMessage {
  type: ActivityType.AGENT_ACTION_REQUEST;
  payload: AgentActionRequestPayload;
}
export interface AgentActionResponseMessage extends BaseMessage {
  type: ActivityType.AGENT_ACTION_RESPONSE;
  payload: AgentActionResponsePayload;
}
export interface AgentTaskUpdateMessage extends BaseMessage {
  type: ActivityType.AGENT_TASK_UPDATE;
  payload: AgentTaskUpdatePayload;
}
export interface CustomActivityMessage extends BaseMessage {
  type: ActivityType.CUSTOM_ACTIVITY;
  payload: CustomActivityPayload;
}