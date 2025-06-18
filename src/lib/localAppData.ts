import { exists, readTextFile, writeTextFile, create } from "@tauri-apps/plugin-fs";
import { join, appDataDir } from "@tauri-apps/api/path";

// export fs related actions from Tauri
// TODO: (post MVP) use ZenFS as a middle layer of filesystem, 
// so that make the app runnable in a browser (and possibly other node.js or bun).
export * from "@tauri-apps/plugin-fs";
export * from "@tauri-apps/api/path";

export const CHANNELS_DATA_DIR = "channels"; // Dir for channel messages/assets

// --- JSON File Operations ---
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
 * Resolves and caches the full path to the app's data directory.
 * Ensures the directory exists.
 * @returns {Promise<string>} The full path to the app data directory.
 */
let _appDataDirPath: string | null = null;
async function getAppDataPath(): Promise<string> {
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