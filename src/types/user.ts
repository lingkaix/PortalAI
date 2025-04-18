// src/types/user.ts

/**
 * Represents the possible statuses for a user.
 */
export type UserStatus = "online" | "offline" | "away";

/**
 * Represents a user in the system.
 */
export type UserType = {
  id: string;
  name: string;
  avatar: string; // URL or path to the avatar image
  status: UserStatus;
};