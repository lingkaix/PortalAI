import React, { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

export const TitleBar: React.FC<Props> = () => {
  return <div data-tauri-drag-region className="titlebar" data-component-id="TitleBar"></div>;
};
