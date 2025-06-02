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

/** 
 * Check if string is a valid UUID v7 
 * the valid format is xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx (x means [0-9a-f])
 * @param {string} id - The string to check
 * @returns {boolean} True if the string is a valid UUID v7, false otherwise
 */
export function isValidUuidv7(id: string): boolean {
  return id.length === 36 && id[14] === '7'
    && id[8] === '-' && id[12] === '-' && id[16] === '-' && id[20] === '-'
    && id.split('-').every((part, index) => {
      if (index === 0) {
        return part.length === 8 && /^[0-9a-f]{8}$/.test(part);
      } else if (index === 1) {
        return part.length === 4 && /^[0-9a-f]{4}$/.test(part);
      } else if (index === 2) {
        return part.length === 4 && /^[0-9a-f]{4}$/.test(part);
      } else if (index === 3) {
        return part.length === 4 && /^[0-9a-f]{4}$/.test(part);
      } else if (index === 4) {
        return part.length === 12 && /^[0-9a-f]{12}$/.test(part);
      }
      return false;
    });
}