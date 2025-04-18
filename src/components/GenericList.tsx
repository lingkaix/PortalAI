import React from 'react';
import { Plus } from 'lucide-react';
import { GenericListItem } from './GenericListItem'; // Import the item component
import { cn } from '../lib/utils'; // Assuming you have a cn utility

// Re-use or define the ListItem interface expected by GenericListItem
interface ListItem {
  id: string;
  name: string;
  description?: string;
}

interface GenericListProps<T extends ListItem> {
  title: string;
  items: T[];
  onAddItem: () => void;        // Callback for the "Add New" button
  onConfigure: (id: string) => void; // Passed down to GenericListItem
  onDelete: (id: string) => void;    // Passed down to GenericListItem
  className?: string;
  itemClassName?: string; // Optional class for individual items
}

export const GenericList = <T extends ListItem>({
  title,
  items,
  onAddItem,
  onConfigure,
  onDelete,
  className,
  itemClassName,
}: GenericListProps<T>) => {

  // Define class strings using CSS variables
  const containerClasses = "flex flex-col h-full"; // Make container take full height
  const headerClasses = "flex items-center justify-between p-3 border-b border-[var(--border-color)] flex-shrink-0";
  const titleClasses = "text-base font-semibold text-[var(--text-primary)]";
  const addButtonClasses = "p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] transition-colors";
  const listContainerClasses = "flex-grow overflow-y-auto p-2 space-y-1"; // Allow list to scroll

  return (
    <div className={cn(containerClasses, className)} data-component-id="GenericList">
      {/* Header with Title and Add Button */}
      <div className={headerClasses}>
        <h2 className={titleClasses}>{title}</h2>
        <button
          onClick={onAddItem}
          className={addButtonClasses}
          aria-label={`Add new ${title.toLowerCase().replace(' settings', '')}`} // More specific label
          title="Add New"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* List Area */}
      <div className={listContainerClasses}>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            No items yet. Click 'Add New' to create one.
          </p>
        ) : (
          items.map((item) => (
            <GenericListItem
              key={item.id}
              item={item}
              onConfigure={onConfigure}
              onDelete={onDelete}
              className={itemClassName} // Pass down item-specific class if provided
            />
          ))
        )}
      </div>
    </div>
  );
};