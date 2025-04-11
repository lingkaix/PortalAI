import React, { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

// Card Component Wrapper - Enhanced Warmth
export const TitleBar: React.FC<Props> = () => {
  return <div data-tauri-drag-region className="titlebar"></div>;
};
