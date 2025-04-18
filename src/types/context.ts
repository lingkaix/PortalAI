// src/types/context.ts
import { ReactNode } from "react"; // Import dependency

/**
 * Defines the shape of the context for managing the right sidebar.
 */
export interface RightSidebarContextType {
  isOpen: boolean;
  openSidebar: (content: ReactNode) => void;
  closeSidebar: () => void;
  content: ReactNode;
}