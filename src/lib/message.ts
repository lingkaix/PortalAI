import {
  Message as A2AMessage, // Though we are not extending, it's good for reference
  Part as A2APart,
  TextPart as A2ATextPart,
  FilePart as A2AFilePart,
  DataPart as A2ADataPart,
  Artifact as A2AArtifact, // For AgentTaskUpdatePayload
} from "../types/a2a";
import { generateId } from "./utils";
import { CoreMessage as SDKMessage } from "ai";
import {
  CoreMessage,
  ActivityTypeValue,
  ContentMessage,
  BaseMessage,
  Part
} from "../types";

/**
 * Creates a CoreMessage, providing defaults for common fields.
 * Specific helpers for each ActivityType might be more convenient.
 */
export function newMessage(params: {
  type: ActivityTypeValue;
  chatId: string;
  workspaceId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  payload?: any;
  messageId?: string;
  clientMessageId?: string;
  channelId?: string;
  taskId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}): CoreMessage {
  const now = new Date().toISOString();

  const baseMessage: BaseMessage = {
    id: params.messageId || generateId(),
    clientMessageId: params.clientMessageId,
    workspaceId: params.workspaceId,
    channelId: params.channelId,
    chatId: params.chatId,
    taskId: params.taskId,
    senderId: params.senderId,
    senderType: params.senderType,
    timestamp: params.timestamp || now,
    type: params.type,
    payload: params.payload || [],
    metadata: params.metadata,
  };

  return baseMessage as CoreMessage;
}

/**
 * Creates a ContentMessage specifically for content-based communication
 */
export function newContentMessage(params: {
  chatId: string;
  workspaceId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  parts: Part[];
  messageId?: string;
  clientMessageId?: string;
  channelId?: string;
  taskId?: string;
  timestamp?: string;
  replyToMessageId?: string;
  metadata?: Record<string, any>;
}): ContentMessage {
  const now = new Date().toISOString();

  return {
    id: params.messageId || generateId(),
    clientMessageId: params.clientMessageId,
    workspaceId: params.workspaceId,
    channelId: params.channelId,
    chatId: params.chatId,
    taskId: params.taskId,
    senderId: params.senderId,
    senderType: params.senderType,
    timestamp: params.timestamp || now,
    type: ActivityType.CONTENT_MESSAGE,
    payload: params.parts,
    reactions: [],
    isEdited: false,
    editHistory: [],
    isDeleted: false,
    relatedA2ATaskIds: [],
    uiState: 'sending',
    isPinned: false,
    replyToMessageId: params.replyToMessageId,
    metadata: params.metadata,
  };
}

// --- A2A Message Transformation ---
/**
 * Converts a CoreMessage to an A2AMessage for sending to an A2A compliant agent.
 */
export function toA2AMessage(coreMsg: CoreMessage): A2AMessage {
  // Determine A2A role
  const role: "user" | "agent" = (coreMsg.senderType === 'user') ? 'user' : 'agent';

  // Prepare A2A metadata
  const a2aMetadata: Record<string, any> = {
    coreMessageId: coreMsg.id,
    coreSenderId: coreMsg.senderId,
    coreSenderType: coreMsg.senderType,
    coreActivityType: coreMsg.type,
    originalTimestamp: coreMsg.timestamp,
    ...(coreMsg.metadata || {}),
  };
  if (coreMsg.clientMessageId) a2aMetadata.coreClientMessageId = coreMsg.clientMessageId;

  // Handle parts based on message type
  let a2aParts: A2APart[] = [];

  if (coreMsg.type === ActivityType.CONTENT_MESSAGE) {
    const contentMsg = coreMsg as ContentMessage;
    a2aParts = [...contentMsg.payload];
  }

  // If there's a payload that's not parts, convert it to a DataPart
  if (coreMsg.payload && !Array.isArray(coreMsg.payload)) {
    a2aParts.push({
      kind: 'data',
      data: coreMsg.payload,
      metadata: { isActivityPayload: true }
    } as A2ADataPart);
  }

  // Get related task IDs
  let relatedTaskIds: string[] = [];
  if (coreMsg.type === ActivityType.CONTENT_MESSAGE) {
    const contentMsg = coreMsg as ContentMessage;
    relatedTaskIds = contentMsg.relatedA2ATaskIds || [];
  }

  return {
    messageId: generateId(),
    role,
    parts: a2aParts,
    kind: 'message',
    contextId: coreMsg.chatId,
    taskId: relatedTaskIds[0],
    metadata: a2aMetadata,
  };
}

/**
 * Converts an A2AMessage (received from an agent) to a CoreMessage.
 */
export function fromA2AMessage(
  a2aMsg: A2AMessage,
  workspaceId: string,
  originalCoreMessageId?: string
): CoreMessage {
  const senderType: 'user' | 'agent' = a2aMsg.role === 'user' ? 'user' : 'agent';
  let senderId = a2aMsg.metadata?.coreSenderId || (a2aMsg.role === 'agent' ? `agent:${generateId()}` : `user:${generateId()}`);
  if (typeof senderId !== 'string') senderId = `unknown:${generateId()}`;

  let activityType: ActivityTypeValue = ActivityType.CONTENT_MESSAGE; // Default
  if (a2aMsg.metadata?.coreActivityType && typeof a2aMsg.metadata.coreActivityType === 'string') {
    // Check if the coreActivityType is a valid ActivityType enum value
    const activityTypeValues = Object.keys(ActivityType).map(key => ActivityType[key as keyof typeof ActivityType]);
    if (activityTypeValues.indexOf(a2aMsg.metadata.coreActivityType as ActivityTypeValue) !== -1) {
      activityType = a2aMsg.metadata.coreActivityType as ActivityTypeValue;
    } else {
      console.warn(`Unknown coreActivityType from A2A metadata: ${a2aMsg.metadata.coreActivityType}`);
      activityType = ActivityType.CUSTOM_ACTIVITY;
    }
  }

  // Extract activity payload from marked DataPart
  let activityPayload: Record<string, any> | undefined;
  let dataPartIndex = -1;
  for (let i = 0; i < a2aMsg.parts.length; i++) {
    const p = a2aMsg.parts[i] as A2APart;
    if (p.kind === 'data' && p.metadata?.isActivityPayload) {
      dataPartIndex = i;
      break;
    }
  }
  if (dataPartIndex !== -1) {
    activityPayload = (a2aMsg.parts[dataPartIndex] as A2ADataPart).data;
  }

  // Filter out the special activity payload from parts if it was extracted
  const coreParts = activityPayload ? a2aMsg.parts.filter((_: A2APart, index: number) => index !== dataPartIndex) : a2aMsg.parts;

  // For content messages, create a ContentMessage
  if (activityType === ActivityType.CONTENT_MESSAGE) {
    return newContentMessage({
      messageId: a2aMsg.metadata?.coreMessageId || a2aMsg.messageId,
      clientMessageId: a2aMsg.metadata?.coreClientMessageId,
      workspaceId,
      chatId: a2aMsg.contextId || "unknown_chat",
      taskId: a2aMsg.taskId,
      senderId,
      senderType,
      timestamp: a2aMsg.metadata?.originalTimestamp || new Date().toISOString(),
      parts: coreParts as Part[],
      metadata: {
        a2aOriginalMessageId: a2aMsg.messageId,
        ...(a2aMsg.metadata || {})
      },
    });
  }

  // For other activity types, create a basic message
  return newMessage({
    type: activityType,
    messageId: a2aMsg.metadata?.coreMessageId || a2aMsg.messageId,
    clientMessageId: a2aMsg.metadata?.coreClientMessageId,
    workspaceId,
    chatId: a2aMsg.contextId || "unknown_chat",
    taskId: a2aMsg.taskId,
    senderId,
    senderType,
    timestamp: a2aMsg.metadata?.originalTimestamp || new Date().toISOString(),
    payload: activityPayload,
    metadata: {
      a2aOriginalMessageId: a2aMsg.messageId,
      ...(a2aMsg.metadata || {})
    },
  });
}

/**
 * Converts a CoreMessage to an AI SDK-compatible message object (for useChat hook).
 * This is potentially lossy if CoreMessage contains non-text parts or complex data
 * not representable in the basic AI SDK Message structure.
 */
export function toSdkMessage(coreMsg: CoreMessage): SDKMessage {
  // Extract text content from parts if this is a content message
  let content = '';

  if (coreMsg.type === ActivityType.CONTENT_MESSAGE) {
    const contentMsg = coreMsg as ContentMessage;
    const textParts = contentMsg.payload.filter(part => part.kind === 'text');
    content = textParts.map(part => (part as A2ATextPart).text).join('\n');
  } else {
    // For non-content messages, create a system message describing the activity
    content = `[${coreMsg.type}] ${JSON.stringify(coreMsg.payload)}`;
  }

  // Map senderType to AI SDK role
  let role: 'user' | 'assistant' | 'system';
  switch (coreMsg.senderType) {
    case 'user':
      role = 'user';
      break;
    case 'agent':
      role = 'assistant';
      break;
    case 'system':
    default:
      role = 'system';
      break;
  }

  // Return the correct AI SDK CoreMessage structure based on role
  if (role === 'system') {
    return {
      role: 'system',
      content: content,
    };
  } else if (role === 'user') {
    return {
      role: 'user',
      content: content,
    };
  } else {
    return {
      role: 'assistant',
      content: content,
    };
  }
}

/**
 * Converts an AI SDK message to a CoreMessage (ContentMessage).
 */
export function fromSdkMessage(
  sdkMsg: SDKMessage,
  chatId: string,
  workspaceId: string,
  senderId?: string
): ContentMessage {
  // Map AI SDK role to our senderType
  let senderType: 'user' | 'agent' | 'system';
  switch (sdkMsg.role) {
    case 'user':
      senderType = 'user';
      break;
    case 'assistant':
      senderType = 'agent';
      break;
    case 'system':
    default:
      senderType = 'system';
      break;
  }

  // Create text part from content
  const parts: Part[] = [{
    kind: 'text',
    text: typeof sdkMsg.content === 'string' ? sdkMsg.content : JSON.stringify(sdkMsg.content)
  }];

  return newContentMessage({
    chatId,
    workspaceId,
    senderId: senderId || `${senderType}:${generateId()}`,
    senderType,
    parts,
    timestamp: new Date().toISOString(),
  });
}