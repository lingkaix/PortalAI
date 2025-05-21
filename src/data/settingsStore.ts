import { create } from "zustand";
import { UserSettings, UserStatus } from "../types";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
export const SETTINGS_FILE = "settings.json";
// Default settings (exported for use in settingsStore)
export const DEFAULT_SETTINGS: UserSettings = {
  name: "Me",
  status: "online",
  notificationsEnabled: false,
  theme: "System",
};
/**
 * Loads user settings, returning defaults if not found or invalid.
 * @returns {Promise<UserSettings>}
 */
export async function loadUserSettings(): Promise<UserSettings> {
  // Use the generic function, providing the specific path and a non-null default
  return (await readJsonFile<UserSettings>(SETTINGS_FILE, DEFAULT_SETTINGS)) ?? DEFAULT_SETTINGS;
}

/**
 * Saves user settings.
 * @param {UserSettings} settings - The settings object to save.
 * @returns {Promise<void>}
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  // Use the generic function
  await writeJsonFile<UserSettings>(SETTINGS_FILE, settings);
}
export interface SettingsState extends UserSettings {
  // Export the interface
  // Actions
  _internalSetSettings: (settings: Partial<UserSettings>) => void;
  loadSettings: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setTheme: (theme: UserSettings["theme"]) => Promise<void>;
  saveProfileSettings: (name: string, status: UserStatus) => Promise<void>;
  isInitialized: boolean; // Flag to track if settings have been loaded
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state (defaults before loading)
  ...DEFAULT_SETTINGS,
  isInitialized: false,

  // Internal action to update state without saving
  _internalSetSettings: (settings) => set((state) => ({ ...state, ...settings })),

  // Action to load settings from file
  loadSettings: async () => {
    if (get().isInitialized) {
      console.log("Settings already initialized.");
      return;
    }
    try {
      console.log("Loading user settings...");
      // Use the new specific loader function
      const loadedSettings = await loadUserSettings();
      set({ ...loadedSettings, isInitialized: true });
      console.log("User settings loaded into store:", loadedSettings);
    } catch (error) {
      console.error("Failed to load settings into store:", error);
      // Keep default settings if loading fails, mark as initialized to prevent retries
      set({ isInitialized: true });
    }
  },

  // Action to update notification setting and save immediately
  setNotificationsEnabled: async (enabled) => {
    const newState = { ...get(), notificationsEnabled: enabled };
    set({ notificationsEnabled: enabled }); // Update state optimistically
    try {
      // Use the new specific save function
      await saveUserSettings(newState);
    } catch (error) {
      console.error("Failed to save notification setting:", error);
      // Optionally revert state or show error to user
    }
  },

  // Action to update theme setting and save immediately
  setTheme: async (theme) => {
    const newState = { ...get(), theme: theme };
    set({ theme: theme }); // Update state optimistically
    try {
      // Use the new specific save function
      await saveUserSettings(newState);
    } catch (error) {
      console.error("Failed to save theme setting:", error);
      // Optionally revert state or show error to user
    }
  },

  // Action to update profile settings and save
  saveProfileSettings: async (name, status) => {
    const newState = { ...get(), name: name, status: status };
    set({ name: name, status: status }); // Update state optimistically
    try {
      // Use the new specific save function
      await saveUserSettings(newState);
    } catch (error) {
      console.error("Failed to save profile settings:", error);
      // Optionally revert state or show error to user
    }
  },
}));

// Optional: Trigger initial load when the store module is first imported
// This ensures settings are loaded early, but might not be ideal in all scenarios.
// Consider moving the load call to your main App component's effect hook instead.
// useSettingsStore.getState().loadSettings();
