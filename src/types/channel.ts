// src/types/channel.ts

/**
 * Represents a channel within a workspace, used to group chats.
 */
export type ChannelType = {
  id: string;
  name: string;
  workspaceId: string; // Link channel to a workspace
};