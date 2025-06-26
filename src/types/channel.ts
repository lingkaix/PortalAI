// src/types/channel.ts

/**
 * Represents a channel within a workspace, used to group chats.
 */
export type ChannelType = {
  id: string;
  name: string;
  description?: string | null;
  participants: Array<{
    userId: string;
    addedBy: string; // id of the user who added this participant to the channel
    role?: 'owner' | 'admin' | 'member' | 'guest'; // Role within this specific chat
  }>; // List of participants (users or agents represented by a user-like profile)

  /** positive number means pinned (descending order) of the channel in the workspace, 
   * 0 means unpinned (normal order by latest activity in app), 
   * negative means archived and not shown in the UI, 
   * AND run any task or recieve update, AND excludes from any context 
   */
  order: number;

  // --- future fields ---
  knowledgeBaseIds?: string[] | null; // ids of the knowledge bases this channel is associated within this workspace

  metadata?: Record<string, any> & {
    createdAt?: number;
    createdBy?: string; // id of the user or agent who created this channel`
  } | null; // metadata for the channel
};