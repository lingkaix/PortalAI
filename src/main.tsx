import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initTauriWindowControls } from "./lib/tauriWindow";

// Initialize window controls only if running in Tauri
initTauriWindowControls();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
