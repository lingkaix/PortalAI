// src/types/message.ts
import { Message as A2AMessage, Part as A2APart, TextPart as A2ATextPart } from "./a2a";
import { generateId } from "../lib/utils"; // Assuming utils is in ../lib

/**
 * CoreMessage is the central message type for the application.
 * It serves for:
 *  - Internal state management (chats, tasks).
 *  - Persistent storage.
 *  - UI representation.
 *  - Communication with A2A compliant agents (it's directly compatible).
 *  - Base for conversion to/from AI SDK message types.
 *
 * It directly uses the A2A Message structure and enriches its metadata
 * for application-specific needs and easier access to common fields.
 */
export interface CoreMessage extends A2AMessage {
  // A2AMessage already has: messageId, role, parts, kind, metadata, referenceTaskIds, taskId, contextId

  // We'll ensure specific fields are typed within metadata for consistency.
  metadata: A2AMessage['metadata'] & {
    senderId: string;       // ID of the user or agent who sent the message (maps to UserType.id or Agent.id)
    timestamp: string;      // ISO 8601 string timestamp of when the message was created/received locally

    // Optional fields for AI SDK interop or UI needs:
    originalSdkRole?: 'user' | 'assistant' | 'system' | 'function' | 'tool'; // If converted from AI SDK
    clientMessageId?: string; // A client-generated ID for optimistic updates before server ID is known
    uiState?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'; // For UI rendering status
    // Add other standardized metadata as needed
  };

  // Ensuring these are present, even if optional in A2A base for some contexts.
  // For our CoreMessage, a message usually belongs to a chat (contextId) and potentially a task.
  contextId: string; // The primaryContextId of the ChatType this message belongs to.
  taskId?: string;    // Optional: if this message is directly part of a specific task within the chat.
}

// --- Type Guards & Utility Functions ---

export function isTextPart(part: A2APart): part is A2ATextPart {
  return part.kind === 'text';
}

/**
 * Helper to create a CoreMessage, ensuring all required fields are present.
 */
export function createCoreMessage({
  content,
  role,
  senderId,
  contextId, // The Chat's primaryContextId
  messageId,
  taskId,
  parts,
  metadata = {},
  referenceTaskIds,
  kind = "message",
}: {
  content?: string; // Simplified: creates a single TextPart if provided
  role: 'user' | 'agent';
  senderId: string;
  contextId: string;
  messageId?: string;
  taskId?: string;
  parts?: A2APart[];
  metadata?: Record<string, any>;
  referenceTaskIds?: string[];
  kind?: "message"; // a2a.Message specifies 'message' as kind
}): CoreMessage {
  const msgId = messageId || generateId();
  const finalParts = parts || (content !== undefined ? [{ kind: 'text', text: content } as A2ATextPart] : []);

  if (finalParts.length === 0) {
    throw new Error("Message content or parts must be provided.");
  }

  return {
    messageId: msgId,
    role,
    parts: finalParts,
    kind,
    metadata: {
      senderId,
      timestamp: new Date().toISOString(),
      ...metadata, // Allow overriding or adding more metadata from input
    },
    contextId,
    taskId,
    referenceTaskIds,
  };
}


// --- AI SDK Conversion Utilities ---

/**
 * Converts an AI SDK Message (from 'ai' or '@ai-sdk/react') to a CoreMessage.
 * Requires contextId to be provided.
 */
export function sdkMessageToCoreMessage(
  sdkMsg: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    content: string;
    createdAt?: Date;
    // tool_calls, tool_call_id, name (for function/tool calls) can be added if needed
  },
  senderId: string, // Explicitly provide the senderId (e.g., current user ID or agent ID)
  chatContextId: string, // The primaryContextId of the chat this message belongs to
  associatedTaskId?: string,
): CoreMessage {
  const messageId = sdkMsg.id || generateId();
  const timestamp = sdkMsg.createdAt?.toISOString() || new Date().toISOString();

  let coreRole: 'user' | 'agent' = 'agent';
  if (sdkMsg.role === 'user') {
    coreRole = 'user';
  } else if (sdkMsg.role === 'system') {
    // System messages can be mapped to 'agent' with a special senderId like 'system'
    // Or handled differently based on application logic.
    // For now, mapping to agent. SenderId should be 'system' or similar.
    coreRole = 'agent';
  }
  // 'assistant', 'function', 'tool' roles from AI SDK map to 'agent' in CoreMessage.
  // Specifics of function/tool calls would need to be in `parts` (e.g. as DataPart) or metadata.

  return {
    messageId,
    role: coreRole,
    parts: [{ kind: 'text', text: sdkMsg.content } as A2ATextPart],
    kind: 'message',
    metadata: {
      senderId,
      timestamp,
      originalSdkRole: sdkMsg.role,
      clientMessageId: sdkMsg.id, // AI SDK id can serve as clientMessageId if generated on client
    },
    contextId: chatContextId,
    taskId: associatedTaskId,
  };
}

/**
 * Converts a CoreMessage to an AI SDK-compatible message object (for useChat hook).
 * This is potentially lossy if CoreMessage contains non-text parts or complex data
 * not representable in the basic AI SDK Message structure.
 */
export function coreMessageToSdkMessage(coreMsg: CoreMessage): {
  id: string;
  role: 'user' | 'assistant' | 'system'; // AI SDK limited roles
  content: string;
  createdAt: Date;
  // display?: React.ReactNode; // For custom UI rendering in AI SDK if needed
} {
  const content = coreMsg.parts
    .filter(isTextPart)
    .map(part => part.text)
    .join('\n'); // Join multiple text parts, or take the first.

  let sdkRole: 'user' | 'assistant' | 'system' = 'assistant'; // Default for 'agent'
  if (coreMsg.role === 'user') {
    sdkRole = 'user';
  } else if (coreMsg.metadata?.originalSdkRole) {
    // If originalSdkRole is present and valid, use it.
    const MAPPABLE_ROLES: Array<'user' | 'assistant' | 'system'> = ['user', 'assistant', 'system'];
    if (MAPPABLE_ROLES.includes(coreMsg.metadata.originalSdkRole as any)) {
        sdkRole = coreMsg.metadata.originalSdkRole as 'user' | 'assistant' | 'system';
    }
  } else if (coreMsg.metadata?.senderId === 'system') { // Convention for system messages
      sdkRole = 'system';
  }

  return {
    id: coreMsg.messageId,
    role: sdkRole,
    content,
    createdAt: new Date(coreMsg.metadata.timestamp),
  };
}