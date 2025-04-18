// src/types/workspace.ts
import { ReactNode } from "react"; // Import dependency

/**
 * Represents a workspace, a top-level container for channels and chats.
 */
export type WorkspaceType = {
  id: string;
  name: string;
  icon: ReactNode; // React component or element to use as the icon
};