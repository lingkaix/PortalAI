import {
    Message as A2AMessage, // Though we are not extending, it's good for reference
    Part as A2APart,
    TextPart as A2ATextPart,
    FilePart as A2AFilePart,
    DataPart as A2ADataPart,
    Artifact as A2AArtifact, // For AgentTaskUpdatePayload
  } from "./a2a";
  import { generateId } from "./utils";
  import { CoreMessage as sdkMessage } from "ai";
  import { CoreMessage, ActivityType } from "../types/message";

/**
 * Creates a CoreMessage, providing defaults for common fields.
 * Specific helpers for each ActivityType might be more convenient.
 */
export function newMessage({
    activityType,
    chatId,
    workspaceId,
    senderId,
    senderType,
    parts,
    activityPayload,
    messageId,
    clientMessageId,
    taskId: threadId,
    timestamp,
    reactions,
    isEdited,
    editHistory,
    isDeleted,
    deletedInfo,
    replyToMessageId,
    relatedA2ATaskIds,
    uiState,
    isPinned,
    safetyRatings,
    moderationStatus,
    sensitivity,
    metadata,
  }: Partial<Omit<CoreMessage, 'messageId' | 'timestamp' | 'senderId' | 'senderType' | 'activityType' | 'chatId' | 'workspaceId'>> &
    Pick<CoreMessage, 'activityType' | 'chatId' | 'workspaceId' | 'senderId' | 'senderType'>
    & { messageId?: string; timestamp?: string; } // Allow overriding generated ID and timestamp
  ): CoreMessage {
    const now = new Date().toISOString();
    return {
      messageId: messageId || generateId(),
      clientMessageId,
      workspaceId,
      chatId,
      taskId: threadId,
      senderId,
      senderType,
      timestamp: timestamp || now,
      activityType,
      parts: parts || [],
      activityPayload,
      reactions: reactions || [],
      isEdited: isEdited || false,
      editHistory: editHistory || [],
      isDeleted: isDeleted || false,
      deletedInfo,
      replyToMessageId,
      relatedA2ATaskIds: relatedA2ATaskIds || [],
      uiState: uiState || 'sending',
      isPinned: isPinned || false,
      safetyRatings,
      moderationStatus,
      sensitivity,
      metadata,
    };
  }
  

// --- A2A Message Transformation (Conceptual - to be implemented by services/orchestrator) ---
/**
 * Concept: Converts a CoreMessage to an A2AMessage for sending to an A2A compliant agent.
 * This is a simplified example. Real implementation would need more sophisticated mapping,
 * especially for activityPayload and various activityTypes.
 */
export function toA2AMessage(coreMsg: CoreMessage): A2AMessage {
    // Determine A2A role
    const role: "user" | "agent" = (coreMsg.senderType === 'user') ? 'user' : 'agent';
  
    // Prepare A2A metadata
    const a2aMetadata: Record<string, any> = {
      coreMessageId: coreMsg.messageId, // Link back to the original CoreMessage
      coreSenderId: coreMsg.senderId,
      coreSenderType: coreMsg.senderType,
      coreActivityType: coreMsg.activityType,
      originalTimestamp: coreMsg.timestamp,
      ...(coreMsg.metadata || {}), // Carry over general metadata
    };
    if (coreMsg.clientMessageId) a2aMetadata.coreClientMessageId = coreMsg.clientMessageId;
  
    // Parts: Use CoreMessage.parts directly if they are already A2APart[].
    // If CoreMessage.activityPayload needs to be sent as a DataPart, it should be added here.
    let a2aParts: A2APart[] = [...(coreMsg.parts || [])];
  
    // If there's an activityPayload and it's meaningful for the agent,
    // and not already represented in parts, convert it to a DataPart.
    // This logic depends heavily on the specific activityType and agent capabilities.
    if (coreMsg.activityPayload && Object.keys(coreMsg.activityPayload).length > 0) {
      // Avoid duplicating if parts already contains this data
      const existingDataPayload = a2aParts.find(p => p.kind === 'data' && p.metadata?.isActivityPayload) as A2ADataPart | undefined;
      if (!existingDataPayload || JSON.stringify(existingDataPayload.data) !== JSON.stringify(coreMsg.activityPayload)) {
        a2aParts.push({
          kind: 'data',
          data: coreMsg.activityPayload,
          metadata: { isActivityPayload: true } // Mark this DataPart's origin
        } as A2ADataPart);
      }
    }
  
    // Ensure there's at least one part if the activity implies content (e.g. TEXT_MESSAGE with no explicit parts)
    // This is a basic fallback; specific activity types might require smarter part generation.
    if (a2aParts.length === 0 && coreMsg.activityType === ActivityType.TEXT_MESSAGE) {
      // If CoreMessage.text existed, it would be mapped to a part above.
      // This implies TEXT_MESSAGE might need its text content directly in a part.
      // For this example, let's assume if parts is empty for TEXT_MESSAGE, it's an issue or needs a default.
      // A better approach: ensure the createTextCoreMessage (if we had one) always creates a TextPart.
      // For now, sending an empty parts array if that's what CoreMessage had.
    }
  
  
    return {
      messageId: generateId(), // A2A message gets its own ID for this specific exchange
      role,
      parts: a2aParts,
      kind: 'message', // Standard A2A kind
      contextId: coreMsg.chatId, // Map chatId to A2A contextId
      taskId: coreMsg.relatedA2ATaskIds?.[0], // Simplification: take the first related task ID
      metadata: a2aMetadata,
      // referenceTaskIds: coreMsg.relatedA2ATaskIds, // Could also be used
    };
  }
  
  /**
   * Concept: Converts an A2AMessage (received from an agent) to a CoreMessage.
   * This is a simplified example.
   */
  export function fromA2AMessage(
    a2aMsg: A2AMessage,
    workspaceId: string, // Must be provided from the application context
    // Potentially other context like the original CoreMessage ID if this is a response
    originalCoreMessageId?: string
  ): CoreMessage {
  
    const senderType: 'user' | 'agent' = a2aMsg.role === 'user' ? 'user' : 'agent';
    let senderId = a2aMsg.metadata?.coreSenderId || (a2aMsg.role === 'agent' ? `agent:${generateId()}` : `user:${generateId()}`);
    if (typeof senderId !== 'string') senderId = `unknown:${generateId()}`;
  
  
    let activityType: ActivityType = ActivityType.TEXT_MESSAGE; // Default
    if (a2aMsg.metadata?.coreActivityType && typeof a2aMsg.metadata.coreActivityType === 'string') {
      if (Object.values(ActivityType).includes(a2aMsg.metadata.coreActivityType as ActivityType)) {
        activityType = a2aMsg.metadata.coreActivityType as ActivityType;
      } else {
        // If coreActivityType from metadata isn't a known enum value,
        // might map to CUSTOM_ACTIVITY or handle as an error/default.
        console.warn(`Unknown coreActivityType from A2A metadata: ${a2aMsg.metadata.coreActivityType}`);
        activityType = ActivityType.CUSTOM_ACTIVITY;
      }
    }
  
    // Attempt to extract activityPayload from a marked DataPart
    let activityPayload: Record<string, any> | undefined;
    const dataPartIndex = a2aMsg.parts.findIndex(p => p.kind === 'data' && p.metadata?.isActivityPayload);
    if (dataPartIndex !== -1) {
      activityPayload = (a2aMsg.parts[dataPartIndex] as A2ADataPart).data;
      // Optionally remove this specific DataPart from parts if it's now in activityPayload
      // Or keep it if agents might also use parts for other things. For now, keep.
    }
  
    // Filter out the special activity payload from parts if it was extracted
    const coreParts = activityPayload ? a2aMsg.parts.filter((_, index) => index !== dataPartIndex) : a2aMsg.parts;
  
  
    return createCoreMessage({
      messageId: a2aMsg.metadata?.coreMessageId || a2aMsg.messageId, // Prefer original ID if present
      clientMessageId: a2aMsg.metadata?.coreClientMessageId,
      workspaceId,
      chatId: a2aMsg.contextId || "unknown_chat", // contextId from A2A maps to chatId
      // threadId:  // Needs to be derived or in metadata
      senderId,
      senderType,
      timestamp: a2aMsg.metadata?.originalTimestamp || new Date().toISOString(),
      activityType,
      parts: coreParts,
      activityPayload,
      relatedA2ATaskIds: a2aMsg.taskId ? [a2aMsg.taskId] : a2aMsg.referenceTaskIds,
      metadata: {
        a2aOriginalMessageId: a2aMsg.messageId, // Store the A2A message ID for traceability
        ...(a2aMsg.metadata || {})
      },
      // Other CoreMessage fields would be defaults or derived
    });
  }



  /**
 * Converts a CoreMessage to an AI SDK-compatible message object (for useChat hook).
 * This is potentially lossy if CoreMessage contains non-text parts or complex data
 * not representable in the basic AI SDK Message structure.
 */
export function coreMessageToSdkMessage(coreMsg: CoreMessage): sdkMessage{
  // TODO
}