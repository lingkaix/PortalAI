import {
  exists,
  readTextFile,
  writeTextFile,
  create, // Renamed from createDir
  readDir,
  remove, // Used for both files and dirs
  BaseDirectory,
  type DirEntry, // Correct type name is DirEntry
} from "@tauri-apps/plugin-fs";
import { join, appDataDir } from "@tauri-apps/api/path";
// No longer need separate import for Dirent
import { UserSettings } from "../types"; // Keep for default settings export

// --- Constants for specific data files/dirs based on dev plan ---
export const SETTINGS_FILE = "settings.json";
export const AGENTS_FILE = "agents.json";
export const MCP_FILE = "mcp.json";
export const KNOWLEDGE_INDEX_FILE = "knowledge.json"; // Index file
export const CHANNELS_INDEX_FILE = "channels.json"; // Index file

export const KNOWLEDGE_BASE_DIR = "knowledge"; // Dir for knowledge bases
export const CHANNELS_DATA_DIR = "channels"; // Dir for channel messages/assets

// Default settings (exported for use in settingsStore)
export const DEFAULT_SETTINGS: UserSettings = {
  name: "User",
  status: "online",
  notificationsEnabled: false,
  theme: "System",
};

// --- Core Data Directory Management ---

let _appDataDirPath: string | null = null;

/**
 * Resolves and caches the full path to the app's data directory.
 * Ensures the directory exists.
 * @returns {Promise<string>} The full path to the app data directory.
 */
export async function getAppDataPath(): Promise<string> {
  if (_appDataDirPath) {
    return _appDataDirPath;
  }

  const dataDir = await appDataDir();
  if (!(await exists(dataDir))) {
    try {
      // create will create the directory if it doesn't exist.
      // It doesn't support recursive creation directly in plugin-fs v2 beta.
      // We rely on the OS allowing creation at this standard path.
      await create(dataDir);
      console.log("App data directory created:", dataDir);
    } catch (e) {
      console.error("Failed to create app data directory:", dataDir, e);
      // Re-throw with a more specific message, including the original error string
      throw new Error(`Failed to create app data directory. Original error: ${e}`);
    }
  }
  _appDataDirPath = dataDir;
  return dataDir;
}

/**
 * Ensures a specific subdirectory exists within the app data directory.
 * @param {string} dirName - The name of the subdirectory.
 * @returns {Promise<string>} The full path to the subdirectory.
 */
export async function ensureAppDataSubdir(dirName: string): Promise<string> {
  const appDataPath = await getAppDataPath();
  const dirPath = await join(appDataPath, dirName);
  if (!(await exists(dirPath))) {
    try {
      await create(dirPath); // Use create without recursive option
      console.log(`App data subdirectory created: ${dirPath}`);
    } catch (e) {
      console.error(`Failed to create app data subdirectory: ${dirPath}`, e);
      throw new Error(`Failed to create app data subdirectory ${dirName}: ${e}`);
    }
  }
  return dirPath;
}

// --- Test Utility ---
/**
 * Resets the cached app data path. ONLY FOR USE IN TESTS.
 * @internal
 */
export function _resetAppDataPathCache(): void {
  _appDataDirPath = null;
}

// --- Generic File Operations ---

/**
 * Reads and parses a JSON file from the app data directory.
 * @template T - The expected type of the parsed JSON data.
 * @param {string} relativePath - The path relative to the app data directory (e.g., "settings.json" or "knowledge/index.json").
 * @param {T | null} [defaultValue=null] - The default value to return if the file doesn't exist or is invalid. If null, errors will throw.
 * @returns {Promise<T | null>} The parsed data or the default value.
 * @throws If defaultValue is null and the file doesn't exist or parsing fails.
 */
export async function readJsonFile<T>(relativePath: string, defaultValue: T | null = null): Promise<T | null> {
  const appDataPath = await getAppDataPath();
  const filePath = await join(appDataPath, relativePath);

  try {
    if (await exists(filePath)) {
      const fileContent = await readTextFile(filePath);
      try {
        const data = JSON.parse(fileContent) as T;
        // Basic check if it's an object (for JSON)
        if (data && typeof data === "object") {
          console.log(`Successfully read and parsed JSON from: ${filePath}`);
          return data;
        } else {
          console.warn(`Invalid JSON structure in file: ${filePath}. Content: ${fileContent.substring(0, 100)}...`);
          if (defaultValue === null) {
            throw new Error(`Invalid JSON structure in file: ${relativePath}`);
          }
          return defaultValue;
        }
      } catch (parseError) {
        console.error(`Error parsing JSON file: ${filePath}`, parseError);
        if (defaultValue === null) {
          throw new Error(`Error parsing JSON file ${relativePath}: ${parseError}`);
        }
        return defaultValue;
      }
    } else {
      console.log(`File not found: ${filePath}. Returning default value.`);
      if (defaultValue === null) {
        throw new Error(`File not found: ${relativePath}`);
      }
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    if (defaultValue === null) {
      throw new Error(`Error reading file ${relativePath}: ${error}`);
    }
    return defaultValue; // Fallback to default on any read error
  }
}

/**
 * Writes data as a JSON string to a file in the app data directory.
 * Creates the directory if it doesn't exist.
 * @template T - The type of the data to write.
 * @param {string} relativePath - The path relative to the app data directory (e.g., "settings.json").
 * @param {T} data - The data to serialize and write.
 * @returns {Promise<void>}
 * @throws If writing fails.
 */
export async function writeJsonFile<T>(relativePath: string, data: T): Promise<void> {
  const appDataPath = await getAppDataPath();
  const filePath = await join(appDataPath, relativePath);
  // Ensure the directory containing the file exists (useful for nested paths like 'knowledge/some_id/index.json')
  const parentDir = await join(filePath, ".."); // Get parent directory path
  if (!(await exists(parentDir))) {
    try {
      await create(parentDir); // Use create without recursive option
      console.log(`Created parent directory for file: ${parentDir}`);
    } catch (e) {
      console.error(`Failed to create parent directory: ${parentDir}`, e);
      throw new Error(`Failed to create parent directory for ${relativePath}: ${e}`);
    }
  }

  try {
    const dataString = JSON.stringify(data, null, 2); // Pretty print JSON
    await writeTextFile(filePath, dataString);
    console.log(`Data successfully written to: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file: ${filePath}`, error);
    throw new Error(`Error writing file ${relativePath}: ${error}`); // Re-throw
  }
}

/**
 * Deletes a file within the app data directory.
 * @param {string} relativePath - The path relative to the app data directory.
 * @returns {Promise<void>}
 * @throws If deletion fails.
 */
export async function deleteDataFile(relativePath: string): Promise<void> {
  const appDataPath = await getAppDataPath();
  const filePath = await join(appDataPath, relativePath);
  try {
    if (await exists(filePath)) {
      await remove(filePath); // Use remove instead of removeFile
      console.log(`File deleted successfully: ${filePath}`);
    } else {
      console.log(`File not found, skipping deletion: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
    throw new Error(`Error deleting file ${relativePath}: ${error}`);
  }
}

// --- Directory Operations ---

/**
 * Lists files and directories within a specific subdirectory of the app data directory.
 * @param {string} relativePath - The path relative to the app data directory.
 * @param {boolean} [recursive=false] - Whether to list recursively.
 * @returns {Promise<DirEntry[]>} A list of directory entries.
 * @throws If reading the directory fails.
 */
export async function listDataDir(relativePath: string, recursive: boolean = false): Promise<DirEntry[]> {
  // Use DirEntry[] type
  const appDataPath = await getAppDataPath();
  const dirPath = await join(appDataPath, relativePath);
  try {
    if (await exists(dirPath)) {
      // NOTE: The 'recursive' parameter is currently ignored as plugin-fs v2 readDir
      // does not support it directly in the options object.
      // Manual recursion would be needed if deep listing is required.
      const entries = await readDir(dirPath); // Removed options object
      console.log(`Listed directory contents for: ${dirPath}`);
      return entries;
    } else {
      console.log(`Directory not found, cannot list: ${dirPath}`);
      return []; // Return empty array if dir doesn't exist
    }
  } catch (error) {
    console.error(`Error listing directory: ${dirPath}`, error);
    throw new Error(`Error listing directory ${relativePath}: ${error}`);
  }
}

/**
 * Deletes a directory and its contents within the app data directory.
 * @param {string} relativePath - The path relative to the app data directory.
 * @returns {Promise<void>}
 * @throws If deletion fails.
 */
export async function deleteDataDir(relativePath: string): Promise<void> {
  const appDataPath = await getAppDataPath();
  const dirPath = await join(appDataPath, relativePath);
  try {
    if (await exists(dirPath)) {
      await remove(dirPath, { recursive: true }); // Use remove instead of removeDir
      console.log(`Directory deleted successfully: ${dirPath}`);
    } else {
      console.log(`Directory not found, skipping deletion: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error deleting directory: ${dirPath}`, error);
    throw new Error(`Error deleting directory ${relativePath}: ${error}`);
  }
}

// --- Specific Data Accessors  ---

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

// Add similar specific loaders/savers for agents, mcp, knowledge index, etc. as needed
// Example:
// export async function loadAgentsConfig(): Promise<AgentConfig[] | null> {
//    return await readJsonFile<AgentConfig[]>(AGENTS_FILE, []); // Default to empty array
// }
// export async function saveAgentsConfig(config: AgentConfig[]): Promise<void> {
//    await writeJsonFile(AGENTS_FILE, config);
// }
