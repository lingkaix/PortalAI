import React, { useState, createContext, useContext, ReactNode } from "react";
import { RightSidebarContextType } from "../types"; // Import the type

// Create the context with an initial undefined value
const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

// Custom hook to use the RightSidebar context
export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error("useRightSidebar must be used within a RightSidebarProvider");
  }
  return context;
};

// Provider component
export const RightSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);

  const openSidebar = (newContent: ReactNode) => {
    setContent(newContent);
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
    // Optional: Clear content when closing
    // setContent(null);
  };

  const value = { isOpen, openSidebar, closeSidebar, content };

  return <RightSidebarContext.Provider value={value}>{children}</RightSidebarContext.Provider>;
};
