import React from "react";
import { X } from "lucide-react";
import { useRightSidebar } from "../contexts/RightSidebarContext"; // Import the hook

// Right Sidebar Component (Slide-out) - Enhanced Warmth
export const RightSidebar: React.FC = () => {
  const { isOpen, closeSidebar, content } = useRightSidebar();

  // Define class strings using CSS variables
  const sidebarBaseClasses = "fixed top-0 right-0 h-full w-80 bg-[var(--card-background)] border-l border-[var(--border-primary)] shadow-xl rounded-l-2xl transform transition-transform duration-300 ease-in-out z-40";
  const headerClasses = "p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0";
  const titleClasses = "font-semibold text-lg text-[var(--text-primary)]";
  const closeButtonClasses = "p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--background-tertiary)] transition-colors duration-150";
  const contentAreaClasses = "flex-grow overflow-y-auto p-5";
  const placeholderTextClasses = "text-[var(--text-secondary)]"; // Reusing from PageContent

  return (
    <div
      className={`${sidebarBaseClasses} ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      aria-hidden={!isOpen} // Improve accessibility
    >
      <div className="h-full flex flex-col">
        {/* Header - Warmer Style */}
        <div className={headerClasses}>
          <h3 className={titleClasses}>Details</h3>
          {/* Close Button - Softer Style */}
          <button onClick={closeSidebar} className={closeButtonClasses} aria-label="Close details sidebar">
            <X size={20} />
          </button>
        </div>
        {/* Content Area - Increased Padding */}
        <div className={contentAreaClasses}>
          {/* Render the content passed via context, or a default message */}
          {content || <p className={placeholderTextClasses}>No details to show.</p>}
        </div>
      </div>
    </div>
  );
};
