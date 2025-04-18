import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v7 as uuidv7 } from 'uuid'; // Import v7 specifically

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a time-ordered, unique identifier (UUID v7).
 * @returns {string} A new UUID v7 string.
 */
export function generateId(): string {
  return uuidv7();
}