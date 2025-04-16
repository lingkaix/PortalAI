import React, { ReactNode } from "react";

interface PageContentProps {
  title: string;
  children?: ReactNode;
}

// Generic Page Content Area - Enhanced Warmth
export const PageContent: React.FC<PageContentProps> = ({ title, children }) => {
  // Define class strings using CSS variables
  const containerClasses = "flex-grow flex flex-col bg-[var(--background-primary)] overflow-hidden"; // Use primary background
  const headerClasses = "p-4 border-b border-[var(--border-primary)] bg-[var(--card-background)] flex-shrink-0"; // Use card background for header
  const titleClasses = "text-xl font-semibold text-[var(--text-primary)]";
  const bodyClasses = "flex-grow p-8 overflow-y-auto";
  const placeholderTextClasses = "text-[var(--text-secondary)]"; // Use secondary text for placeholder

  return (
    <div className={containerClasses} data-component-id="PageContent">
    {/* Page Header - Warmer Style */}
      <div className={headerClasses} data-tauri-drag-region>
        <h2 className={titleClasses} data-tauri-drag-region>{title}</h2>
      </div>
    {/* Page Body - Increased Padding and scrollable */}
      <div className={bodyClasses}>
        {/* Render children or a default placeholder */}
        {children || <p className={placeholderTextClasses}>Content for {title} goes here.</p>}
      </div>
    </div>
  );
};
