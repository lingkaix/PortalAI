import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

// Chat Input Component - Full Width Textarea, Enhanced Warmth
export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage(""); // Clear input after sending
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Send message on Enter key press (unless Shift is held)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in textarea
      handleSend();
    }
  };

  // Trigger hidden file input click
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection (placeholder logic)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Files selected:", files);
      // TODO: Implement actual file upload/handling logic
      alert(`Selected ${files.length} file(s). Upload not implemented yet.`);
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Auto-resize textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height to calculate scrollHeight correctly
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 112; // Max height in pixels (corresponds to max-h-28 in Tailwind)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]); // Re-run effect when message changes

  // Define class strings using CSS variables
  const containerClasses = "p-4 border-t border-[var(--border-primary)] bg-[var(--background-secondary)] flex items-end space-x-3";
  const attachButtonClasses = "p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--background-tertiary)] flex-shrink-0 transition-colors duration-150";
  const textareaClasses = "flex-grow p-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-background)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--text-muted)] max-h-28 overflow-y-auto";
  const sendButtonClasses = "p-2.5 rounded-xl bg-[var(--button-primary-background)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--input-focus-ring)] dark:focus:ring-offset-[var(--background-secondary)] flex-shrink-0 transition-colors duration-150"; // Adjusted focus ring offset for dark mode

  return (
    <div className={containerClasses} data-component-id="ChatInput">
      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

      {/* Attach Button - Softer Style */}
      <button onClick={handleAttachClick} className={attachButtonClasses} aria-label="Attach file">
        <Paperclip size={20} />
      </button>

      {/* Textarea - Full width, Increased rounding, warmer colors */}
      <textarea
        ref={textareaRef}
        rows={1} // Start with a single row
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className={textareaClasses}
        style={{ overflowY: "auto" }} // Ensure scrollbar appears if content exceeds max-height
      />

      {/* Send Button - Softer Style */}
      <button
        onClick={handleSend}
        disabled={!message.trim()} // Disable if message is empty or only whitespace
        className={sendButtonClasses}
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </div>
  );
};
