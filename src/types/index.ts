import { ReactNode } from "react";

// User related types
export type UserStatus = "online" | "offline" | "away";

export type UserType = {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
};

// Message related types
export type MessageType = {
  id: string;
  sender: UserType;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
};

// Chat related types
export type ChatTypeValue = "direct" | "group";

export type ChatType = {
  id: string;
  type: ChatTypeValue;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
  timestamp?: Date;
  participants?: UserType[];
  workspaceId: string; // Link chat to a workspace
  channelId: string; // Link chat to a channel
};

// Workspace related types
export type WorkspaceType = {
  id: string;
  name: string;
  icon: ReactNode;
};

// Channel related types
export type ChannelType = {
  id: string;
  name: string;
  workspaceId: string; // Link channel to a workspace
};

// Context related types (if needed outside context file)
export interface RightSidebarContextType {
  isOpen: boolean;
  openSidebar: (content: ReactNode) => void;
  closeSidebar: () => void;
  content: ReactNode;
}
