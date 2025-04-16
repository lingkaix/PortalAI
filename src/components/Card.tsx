import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Card Component Wrapper - Enhanced Warmth
export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  // Define base classes using CSS variables
  const cardBaseClasses = "bg-[var(--card-background)] border border-[var(--card-border)] rounded-xl shadow-[var(--card-shadow)]";

  return (
    <div className={`${cardBaseClasses} ${className}`} data-component-id="Card">{children}</div>
  );
};
