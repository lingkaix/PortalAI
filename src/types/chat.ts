// src/types/chat.ts
import { UserType } from "./user"; // Import dependency
// It's assumed that a2a.Task['id'] is a string.
// If a2a types are directly importable, you could use:
// import { Task as A2ATask } from './a2a'; // Assuming a2a.ts is in the same directory or path is adjusted

/**
 * Represents the type of chat (direct message or group).
 */
export type ChatTypeValue = "direct" | "group";

/**
 * Represents a chat conversation.
 * A chat is a container for messages and can be associated with one or more tasks.
 * It has a primary context ID for the overall conversation, and individual tasks
 * within it can also have their own specific context IDs.
 *
 * Future Enhancements:
 * - Task Workflow Templates: Define predefined sequences of tasks or agent interactions
 *   that can be instantiated within a chat. This would allow for consistent execution
 *   of complex processes (e.g., "Weekly Report Generation", "Customer Onboarding").
 *   A chat could be associated with a `workflowTemplateId` and `currentWorkflowStep`.
 * - Granular Task States: Beyond the A2A TaskStatus, a chat might track application-specific
 *   states for tasks, e.g., "pending-assignment", "review-required".
 */
export type ChatType = {
  id: string; // Unique identifier for the chat
  type: ChatTypeValue; // "direct" or "group"
  name: string; // Display name of the chat
  avatar?: string; // Optional avatar, e.g., for group chats or a primary agent

  workspaceId: string; // Link chat to a workspace
  channelId: string; // Link chat to a channel within a workspace (if applicable)

  // Context Management
  primaryContextId: string; // Server-generated ID for the overall chat context

  // Task Management
  // IDs of tasks associated with this chat. These tasks are defined by the A2A Task interface.
  // A single chat can involve multiple tasks. For example:
  // 1. A recurring task (e.g., an agent making a daily report).
  // 2. In a group chat, different agents might have their own tasks contributing to the chat.
  // 3. A complex task might be broken down into sub-tasks, each represented here,
  //    all contributing to a larger goal within the shared chat context.
  taskIds: string[];

  // UI-related fields
  lastMessagePreview?: string; // Preview of the last message content for display in chat lists
  lastMessageTimestamp?: string; // ISO 8601 timestamp of the last message
  unreadCount?: number; // Number of unread messages for the current user

  participants: Array<{
    userId: string; // ID of the UserType
    role?: 'owner' | 'admin' | 'member' | 'guest'; // Role within this specific chat
  }>; // List of participants (users or agents represented by a user-like profile)

  // Extended metadata for application-specific needs
  metadata?: {
    [key: string]: any;
    createdBy?: string; // userId or agentId of the creator
    workflowInstanceId?: string; // If this chat is part of a larger predefined workflow
  };
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
};