import React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { UserStatus } from "../types"; // Import the specific type
import { cn } from "../lib/utils";
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  status?: UserStatus;
}

// Avatar Component - Refactored with Radix UI and new theme
export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = "md", status, className, ...props }) => {
  const sizeClasses = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" };
  // Use CSS variables for status colors from the updated theme
  const statusColorClasses = {
    online: "bg-[var(--success)]", // Teal/Green
    offline: "bg-[var(--text-muted)]", // Lighter gray
    away: "bg-[var(--accent-secondary)]", // Warm Gray/Beige
  };
  // Define ring classes using CSS variables
  const statusRingClasses = "ring-2 ring-[var(--card-background)] dark:ring-[var(--background-secondary)]"; // Ring matches card/secondary background

  // Fallback text: first two letters of alt text
  const fallbackText = alt?.substring(0, 2).toUpperCase() || "??";

  return (
    <AvatarPrimitive.Root className={cn("relative flex-shrink-0", sizeClasses[size], className)} {...props} data-component-id="Avatar">
      <AvatarPrimitive.Image
        className={cn("h-full w-full rounded-full object-cover")}
        src={src}
        alt={alt}
        // Basic fallback handling within Radix Image is usually sufficient,
        // but you could add onError logic here if needed.
      />
      <AvatarPrimitive.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-[var(--background-tertiary)] text-[var(--text-secondary)]", // Use tertiary background and secondary text for fallback
          "text-xs font-medium" // Adjust font size/weight as needed
        )}
        delayMs={600} // Optional delay before showing fallback
      >
        {fallbackText}
      </AvatarPrimitive.Fallback>
      {/* Status Indicator */}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full", // Slightly smaller status dot
            statusRingClasses,
            statusColorClasses[status]
          )}
        ></span>
      )}
    </AvatarPrimitive.Root>
  );
};
