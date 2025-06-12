import { isTauri } from './utils';

/**
 * Initializes Tauri window controls (minimize, maximize, close) if running in Tauri environment.
 * This should be called once when the app starts.
 */
export async function initTauriWindowControls(): Promise<void> {
  // Only proceed if we're in a Tauri environment
  if (!isTauri()) {
    return;
  }

  try {
    // Dynamically import Tauri APIs only when needed
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();

    // Add event listeners for window controls
    const minimizeBtn = document.getElementById('titlebar-minimize');
    const maximizeBtn = document.getElementById('titlebar-maximize');
    const closeBtn = document.getElementById('titlebar-close');

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => appWindow.minimize());
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => appWindow.toggleMaximize());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => appWindow.close());
    }
  } catch (error) {
    console.warn('Failed to initialize Tauri window controls:', error);
  }
}

/**
 * Utility to safely call Tauri window operations
 */
export const tauriWindow = {
  /**
   * Minimize the window (only works in Tauri)
   */
  async minimize(): Promise<void> {
    if (!isTauri()) return;
    
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (error) {
      console.warn('Failed to minimize window:', error);
    }
  },

  /**
   * Toggle maximize/restore the window (only works in Tauri)
   */
  async toggleMaximize(): Promise<void> {
    if (!isTauri()) return;
    
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (error) {
      console.warn('Failed to toggle maximize window:', error);
    }
  },

  /**
   * Close the window (only works in Tauri)
   */
  async close(): Promise<void> {
    if (!isTauri()) return;
    
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (error) {
      console.warn('Failed to close window:', error);
    }
  }
}; 