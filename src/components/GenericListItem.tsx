import React from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming you have a cn utility

// Define a generic type constraint for items that can be displayed
// They must have an id and name, description is optional
interface ListItem {
  id: string;
  name: string;
  description?: string;
}

interface GenericListItemProps<T extends ListItem> {
  item: T;
  onConfigure: (id: string) => void; // Callback for configure action
  onDelete: (id: string) => void;    // Callback for delete action
  className?: string;
}

export const GenericListItem = <T extends ListItem>({
  item,
  onConfigure,
  onDelete,
  className,
}: GenericListItemProps<T>) => {

  // Define class strings using CSS variables for consistency
  const containerClasses = "flex items-center justify-between p-3 rounded-lg hover:bg-[var(--background-secondary)] transition-colors duration-150";
  const textContainerClasses = "flex-grow overflow-hidden mr-4"; // Allow text to take space and truncate
  const nameClasses = "text-sm font-medium text-[var(--text-primary)] truncate";
  const descriptionClasses = "text-xs text-[var(--text-secondary)] truncate mt-0.5";
  const buttonContainerClasses = "flex items-center space-x-2 flex-shrink-0"; // Prevent buttons from shrinking
  const iconButtonClasses = "p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] transition-colors";

  return (
    <div className={cn(containerClasses, className)} data-component-id="GenericListItem">
      <div className={textContainerClasses}>
        <div className={nameClasses}>{item.name}</div>
        {item.description && (
          <div className={descriptionClasses}>{item.description}</div>
        )}
      </div>
      <div className={buttonContainerClasses}>
        <button
          onClick={() => onConfigure(item.id)}
          className={iconButtonClasses}
          aria-label={`Configure ${item.name}`}
          title="Configure"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className={cn(iconButtonClasses, "hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10")} // Destructive hover
          aria-label={`Delete ${item.name}`}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};