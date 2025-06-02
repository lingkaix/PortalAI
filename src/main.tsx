import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// import { db } from "./lib/db/database";
// import { migrate } from 'drizzle-orm/sqlite-proxy/migrator'
// migrate(db, async (queries) => {
//   console.log(queries)
// }, {
//   migrationsFolder: "./migrations",
// })

// from: https://v2.tauri.app/learn/window-customization/#creating-a-custom-titlebar
import { getCurrentWindow } from '@tauri-apps/api/window';
// when using `"withGlobalTauri": true`, you may use
// const { getCurrentWindow } = window.__TAURI__.window;
const appWindow = getCurrentWindow();
document
  .getElementById('titlebar-minimize')
  ?.addEventListener('click', () => appWindow.minimize());
document
  .getElementById('titlebar-maximize')
  ?.addEventListener('click', () => appWindow.toggleMaximize());
document
  .getElementById('titlebar-close')
  ?.addEventListener('click', () => appWindow.close());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
