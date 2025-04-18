// src/types/settings.ts
import { UserStatus } from "./user"; // Import dependency

/**
 * Represents the user-configurable settings for the application.
 */
export interface UserSettings {
  name: string; // User's display name
  status: UserStatus; // User's current status
  notificationsEnabled: boolean; // Whether desktop notifications are enabled
  theme: 'Light' | 'Dark' | 'System'; // Selected application theme
}