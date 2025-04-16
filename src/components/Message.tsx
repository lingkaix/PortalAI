import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { MessageType } from "../types"; // Import type
import { Avatar } from "./Avatar"; // Import component

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean; // Pass this prop explicitly
}

// Message Component - Enhanced Warmth
export const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const { id, sender, content, timestamp, upvotes, downvotes } = message;

  const timeString = timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // TODO: Implement actual vote handling logic
  const handleVote = (type: "up" | "down") => {
    console.log(`Voted ${type} on message ${id}`);
    // In a real app, this would likely involve updating state or calling an API
  };

  // Define class strings using CSS variables
  const containerBaseClasses = "flex items-start space-x-3 py-3 px-4 group";
  const senderNameClasses = "text-xs font-medium text-[var(--text-secondary)] mb-1";
  const bubbleBaseClasses = "select-text relative px-3.5 py-2 rounded-xl max-w-xs md:max-w-md lg:max-w-lg break-words shadow-[var(--card-shadow)]"; // Use card shadow
  const currentUserBubbleClasses = "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] rounded-br-lg"; // Use accent for user
  const otherUserBubbleClasses = "bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-bl-lg";
  const metaContainerClasses = "flex items-center mt-1.5 space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200";
  const timestampClasses = "text-xs text-[var(--text-muted)]";
  const voteButtonClasses = "text-[var(--text-muted)] p-1 rounded-full hover:bg-[var(--background-tertiary)] transition-colors";
  const upvoteHoverClasses = "hover:text-[var(--success)]";
  const downvoteHoverClasses = "hover:text-[var(--destructive)]";
  const voteCountClasses = "text-xs text-[var(--text-muted)]";


  return (
    <div className={`${containerBaseClasses} ${isCurrentUser ? "justify-end" : ""}`} data-component-id="Message">
      {/* Show sender avatar only if not the current user */}
      {!isCurrentUser && <Avatar src={sender.avatar} alt={sender.name} size="md" />}

      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Show sender name only if not the current user */}
        {!isCurrentUser && <span className={senderNameClasses}>{sender.name}</span>}

        {/* Message bubble: Increased rounding, emerald color for user */}
        <div
          className={`${bubbleBaseClasses} ${isCurrentUser ? currentUserBubbleClasses : otherUserBubbleClasses}`}
        >
          {content}
        </div>

        {/* Timestamp and vote buttons (appear on hover) */}
        <div className={metaContainerClasses}>
          <span className={timestampClasses}>{timeString}</span>
          {/* Upvote button */}
          <button onClick={() => handleVote("up")} className={`${voteButtonClasses} ${upvoteHoverClasses}`}>
            <ThumbsUp size={14} />
          </button>
          <span className={voteCountClasses}>{upvotes > 0 ? upvotes : ""}</span>
          {/* Downvote button */}
          <button onClick={() => handleVote("down")} className={`${voteButtonClasses} ${downvoteHoverClasses}`}>
            <ThumbsDown size={14} />
          </button>
          <span className={voteCountClasses}>{downvotes > 0 ? downvotes : ""}</span>
        </div>
      </div>

      {/* Show current user avatar only if it's their message */}
      {isCurrentUser && <Avatar src={sender.avatar} alt={sender.name} size="md" />}
    </div>
  );
};
