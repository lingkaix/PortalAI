import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exists,
  readTextFile,
  writeTextFile,
  create, // Mock create
  remove, // Mock remove
  readDir, // Mock readDir
  type DirEntry, // Import type for mocking readDir return
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
// Import functions to test from dataManager
import {
  loadUserSettings,
  saveUserSettings,
  DEFAULT_SETTINGS,
  SETTINGS_FILE, // Use constant
  KNOWLEDGE_BASE_DIR, // Use constant for subdir test
  getAppDataPath, // Also test this helper
  readJsonFile,
  writeJsonFile,
  deleteDataFile,
  listDataDir,
  deleteDataDir,
  ensureAppDataSubdir,
  _resetAppDataPathCache, // Import reset function for testing
} from "./dataManager";
import { UserSettings } from "../types";

// Mock the Tauri modules using factory functions
vi.mock("@tauri-apps/plugin-fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tauri-apps/plugin-fs")>();
  return {
    ...actual, // Keep actual types like DirEntry if needed, or mock them
    exists: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    // Mock create directly in the factory with an implementation
    create: vi.fn().mockImplementation(async (path: string | URL /*, options?: any */): Promise<void> => {
      // This mock assumes 'create' is only used for directories in dataManager.ts
      // It directly returns Promise<void> to match the directory signature.
      console.log(`Mock fs.create (directory) called for path: ${path.toString()}`);
      // No return value needed for async void
    }),
    remove: vi.fn(), // Mocked remove function
    readDir: vi.fn(), // Mocked readDir function
    // Mock BaseDirectory if it's used directly, though it seems not in dataManager itself
    BaseDirectory: {
      AppData: "AppData", // Example mock value
    },
  };
});
vi.mock("@tauri-apps/api/path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tauri-apps/api/path")>();
  return {
    ...actual,
    appDataDir: vi.fn(),
    join: vi.fn(),
  };
});

const MOCK_APP_DATA_DIR = "/mock/app/data";
const MOCK_SETTINGS_PATH = `${MOCK_APP_DATA_DIR}/${SETTINGS_FILE}`;
const MOCK_SETTINGS_PARENT_DIR = MOCK_APP_DATA_DIR; // Parent of settings.json is appDataDir
const MOCK_SUBDIR_NAME = KNOWLEDGE_BASE_DIR;
const MOCK_SUBDIR_PATH = `${MOCK_APP_DATA_DIR}/${MOCK_SUBDIR_NAME}`;
const MOCK_FILE_IN_SUBDIR_PATH = `${MOCK_SUBDIR_PATH}/test.json`;
const MOCK_FILE_IN_SUBDIR_PARENT_PATH = MOCK_SUBDIR_PATH;

describe("dataManager", () => {
  beforeEach(() => {
    // Reset mocks and cache before each test
    vi.resetAllMocks();
    _resetAppDataPathCache(); // Reset the internal cache

    // Setup mock implementations
    vi.mocked(appDataDir).mockResolvedValue(MOCK_APP_DATA_DIR);

    // Mock join to return specific paths based on input
    vi.mocked(join).mockImplementation(async (...paths) => {
      // Simple mock join, handles potential undefined/null paths
      const validPaths = paths.filter((p) => p != null) as string[];
      const joinedPath = validPaths.join("/");

      // Handle specific cases needed for tests
      if (validPaths.join("/") === `${MOCK_APP_DATA_DIR}/${SETTINGS_FILE}`) return MOCK_SETTINGS_PATH;
      if (validPaths.join("/") === `${MOCK_SETTINGS_PATH}/..`) return MOCK_SETTINGS_PARENT_DIR;
      if (validPaths.join("/") === `${MOCK_APP_DATA_DIR}/${MOCK_SUBDIR_NAME}`) return MOCK_SUBDIR_PATH;
      if (validPaths.join("/") === `${MOCK_SUBDIR_PATH}/test.json`) return MOCK_FILE_IN_SUBDIR_PATH;
      if (validPaths.join("/") === `${MOCK_FILE_IN_SUBDIR_PATH}/..`) return MOCK_FILE_IN_SUBDIR_PARENT_PATH;

      // Default mock join behavior - robustly join non-empty parts
      return validPaths.filter(Boolean).join("/");
    });

    // Default mock for exists (can be overridden in tests)
    vi.mocked(exists).mockResolvedValue(true); // Assume things exist by default
    // No need to mock 'create' implementation here anymore, it's done in the factory
    // vi.mocked(create).mock...
    vi.mocked(remove).mockResolvedValue(undefined); // Mock successful removal
    vi.mocked(writeTextFile).mockResolvedValue(undefined); // Mock successful write
    vi.mocked(readTextFile).mockResolvedValue("{}"); // Mock successful read (empty json)
    vi.mocked(readDir).mockResolvedValue([]); // Mock successful readDir (empty)
  });

  // --- getAppDataPath ---
  describe("getAppDataPath", () => {
    it("should return the cached path on subsequent calls", async () => {
      vi.mocked(exists).mockResolvedValue(true); // Assume dir exists
      const path1 = await getAppDataPath();
      const path2 = await getAppDataPath();
      expect(path1).toBe(MOCK_APP_DATA_DIR);
      expect(path2).toBe(MOCK_APP_DATA_DIR);
      expect(appDataDir).toHaveBeenCalledTimes(1); // Called only once
      expect(exists).toHaveBeenCalledTimes(1);
    });

    it("should create the directory if it doesn't exist", async () => {
      vi.mocked(exists).mockResolvedValue(false); // Dir does not exist initially
      const path = await getAppDataPath();
      expect(path).toBe(MOCK_APP_DATA_DIR);
      expect(exists).toHaveBeenCalledWith(MOCK_APP_DATA_DIR);
      expect(create).toHaveBeenCalledWith(MOCK_APP_DATA_DIR); // Use create
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if directory creation fails", async () => {
      const creationError = new Error("Permission denied");
      vi.mocked(exists).mockResolvedValue(false);
      vi.mocked(create).mockRejectedValue(creationError); // Mock create failure

      await expect(getAppDataPath()).rejects.toThrow(`Failed to create app data directory. Original error: ${creationError}`);
      expect(create).toHaveBeenCalledWith(MOCK_APP_DATA_DIR);
    });
  });

  // --- ensureAppDataSubdir ---
  describe("ensureAppDataSubdir", () => {
    it("should return the path if the subdirectory exists", async () => {
      vi.mocked(exists).mockResolvedValue(true); // Both appDataDir and subdir exist
      const subdirPath = await ensureAppDataSubdir(MOCK_SUBDIR_NAME);
      expect(subdirPath).toBe(MOCK_SUBDIR_PATH);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(create).not.toHaveBeenCalled();
    });

    it("should create the subdirectory if it doesn't exist", async () => {
      vi.mocked(exists)
        .mockResolvedValueOnce(true) // appDataDir exists
        .mockResolvedValueOnce(false); // subdir does not exist
      const subdirPath = await ensureAppDataSubdir(MOCK_SUBDIR_NAME);
      expect(subdirPath).toBe(MOCK_SUBDIR_PATH);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(create).toHaveBeenCalledWith(MOCK_SUBDIR_PATH); // Use create
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if subdirectory creation fails", async () => {
      const creationError = new Error("Disk full");
      vi.mocked(exists)
        .mockResolvedValueOnce(true) // appDataDir exists
        .mockResolvedValueOnce(false); // subdir does not exist
      vi.mocked(create).mockRejectedValue(creationError); // Mock create failure

      await expect(ensureAppDataSubdir(MOCK_SUBDIR_NAME)).rejects.toThrow(`Failed to create app data subdirectory ${MOCK_SUBDIR_NAME}: ${creationError}`);
      expect(create).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
    });
  });

  // --- readJsonFile ---
  describe("readJsonFile", () => {
    const testData = { key: "value", count: 1 };
    const testJsonString = JSON.stringify(testData);

    it("should read and parse a valid JSON file", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue(testJsonString);

      const data = await readJsonFile<{ key: string; count: number }>(SETTINGS_FILE);

      expect(data).toEqual(testData);
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should return default value if file does not exist", async () => {
      vi.mocked(exists).mockResolvedValue(false);
      const defaultValue = { default: true };

      const data = await readJsonFile(SETTINGS_FILE, defaultValue);

      expect(data).toEqual(defaultValue);
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
      expect(readTextFile).not.toHaveBeenCalled();
    });

    it("should throw error if file does not exist and no default value is provided", async () => {
      vi.mocked(exists).mockResolvedValue(false);

      await expect(readJsonFile(SETTINGS_FILE, null)).rejects.toThrow(`File not found: ${SETTINGS_FILE}`);
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should return default value if JSON parsing fails", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue("invalid json");
      const defaultValue = { default: true };

      const data = await readJsonFile(SETTINGS_FILE, defaultValue);

      expect(data).toEqual(defaultValue);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should throw error if JSON parsing fails and no default value is provided", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue("invalid json");

      await expect(readJsonFile(SETTINGS_FILE, null)).rejects.toThrow(
        /Error parsing JSON file/ // Match partial error message
      );
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should return default value if readTextFile throws an error", async () => {
      const readError = new Error("Read permission denied");
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockRejectedValue(readError);
      const defaultValue = { default: true };

      const data = await readJsonFile(SETTINGS_FILE, defaultValue);

      expect(data).toEqual(defaultValue);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should throw error if readTextFile throws and no default value is provided", async () => {
      const readError = new Error("Read permission denied");
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockRejectedValue(readError);

      await expect(readJsonFile(SETTINGS_FILE, null)).rejects.toThrow(`Error reading file ${SETTINGS_FILE}: ${readError}`);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });
  });

  // --- writeJsonFile ---
  describe("writeJsonFile", () => {
    const testData = { name: "Test User", id: 123 };
    const testJsonString = JSON.stringify(testData, null, 2);

    it("should write data to a file, creating parent directory if needed", async () => {
      // Simulate parent directory NOT existing initially for the nested file case
      const nestedRelativePath = `${MOCK_SUBDIR_NAME}/test.json`;
      vi.mocked(exists)
        .mockResolvedValueOnce(true) // appDataDir exists
        .mockResolvedValueOnce(false) // parent dir (MOCK_SUBDIR_PATH) does NOT exist
        .mockResolvedValueOnce(false); // Need exists check again inside writeJsonFile for parent

      await writeJsonFile(nestedRelativePath, testData);

      // Check parent directory creation
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, nestedRelativePath);
      expect(join).toHaveBeenCalledWith(MOCK_FILE_IN_SUBDIR_PATH, "..");
      expect(exists).toHaveBeenCalledWith(MOCK_FILE_IN_SUBDIR_PARENT_PATH); // Check if parent exists
      expect(create).toHaveBeenCalledWith(MOCK_FILE_IN_SUBDIR_PARENT_PATH); // Expect parent creation
      expect(create).toHaveBeenCalledTimes(1);

      // Check file writing
      expect(writeTextFile).toHaveBeenCalledWith(MOCK_FILE_IN_SUBDIR_PATH, testJsonString);
      expect(writeTextFile).toHaveBeenCalledTimes(1);
    });

    it("should write data to a file when parent directory already exists", async () => {
      vi.mocked(exists).mockResolvedValue(true); // Assume appDataDir and parent dir exist

      await writeJsonFile(SETTINGS_FILE, testData);

      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, SETTINGS_FILE);
      expect(join).toHaveBeenCalledWith(MOCK_SETTINGS_PATH, "..");
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PARENT_DIR); // Check parent exists
      expect(create).not.toHaveBeenCalled(); // Parent exists, no creation needed
      expect(writeTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH, testJsonString);
      expect(writeTextFile).toHaveBeenCalledTimes(1);
    });

    it("should throw error if parent directory creation fails", async () => {
      const nestedRelativePath = `${MOCK_SUBDIR_NAME}/test.json`;
      const creationError = new Error("Cannot create dir");
      vi.mocked(exists)
        .mockResolvedValueOnce(true) // appDataDir exists
        .mockResolvedValueOnce(false); // parent dir (MOCK_SUBDIR_PATH) does NOT exist
      vi.mocked(create).mockRejectedValue(creationError); // Mock creation failure

      await expect(writeJsonFile(nestedRelativePath, testData)).rejects.toThrow(`Failed to create parent directory for ${nestedRelativePath}: ${creationError}`);
      expect(create).toHaveBeenCalledWith(MOCK_FILE_IN_SUBDIR_PARENT_PATH);
      expect(writeTextFile).not.toHaveBeenCalled();
    });

    it("should throw error if writing file fails", async () => {
      const writeError = new Error("Disk full");
      vi.mocked(exists).mockResolvedValue(true); // Assume parent dir exists
      vi.mocked(writeTextFile).mockRejectedValue(writeError);

      await expect(writeJsonFile(SETTINGS_FILE, testData)).rejects.toThrow(`Error writing file ${SETTINGS_FILE}: ${writeError}`);
      expect(create).not.toHaveBeenCalled(); // Parent exists
      expect(writeTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH, testJsonString);
    });
  });

  // --- deleteDataFile ---
  describe("deleteDataFile", () => {
    it("should delete the file if it exists", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      await deleteDataFile(SETTINGS_FILE);
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
      expect(remove).toHaveBeenCalledWith(MOCK_SETTINGS_PATH); // Use remove
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it("should not attempt deletion if file does not exist", async () => {
      vi.mocked(exists).mockResolvedValue(false);
      await deleteDataFile(SETTINGS_FILE);
      expect(exists).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
      expect(remove).not.toHaveBeenCalled();
    });

    it("should throw error if deletion fails", async () => {
      const deleteError = new Error("Permission denied");
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(remove).mockRejectedValue(deleteError); // Mock remove failure

      await expect(deleteDataFile(SETTINGS_FILE)).rejects.toThrow(`Error deleting file ${SETTINGS_FILE}: ${deleteError}`);
      expect(remove).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });
  });

  // --- listDataDir ---
  describe("listDataDir", () => {
    const mockEntries: DirEntry[] = [
      // Add required boolean flags for DirEntry
      { name: "file1.txt", isFile: true, isDirectory: false, isSymlink: false },
      { name: "subdir", isFile: false, isDirectory: true, isSymlink: false },
    ];

    it("should list directory contents if directory exists", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readDir).mockResolvedValue(mockEntries);

      const entries = await listDataDir(MOCK_SUBDIR_NAME);

      expect(entries).toEqual(mockEntries);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(readDir).toHaveBeenCalledWith(MOCK_SUBDIR_PATH); // No recursive option needed for mock
      expect(readDir).toHaveBeenCalledTimes(1);
    });

    it("should return empty array if directory does not exist", async () => {
      vi.mocked(exists).mockResolvedValue(false); // Dir does not exist

      const entries = await listDataDir(MOCK_SUBDIR_NAME);

      expect(entries).toEqual([]);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(readDir).not.toHaveBeenCalled();
    });

    it("should throw error if reading directory fails", async () => {
      const readError = new Error("Read error");
      vi.mocked(exists).mockResolvedValue(true); // Dir exists
      vi.mocked(readDir).mockRejectedValue(readError); // Mock readDir failure

      await expect(listDataDir(MOCK_SUBDIR_NAME)).rejects.toThrow(`Error listing directory ${MOCK_SUBDIR_NAME}: ${readError}`);
      expect(readDir).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
    });
  });

  // --- deleteDataDir ---
  describe("deleteDataDir", () => {
    it("should delete the directory recursively if it exists", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      await deleteDataDir(MOCK_SUBDIR_NAME);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(remove).toHaveBeenCalledWith(MOCK_SUBDIR_PATH, { recursive: true }); // Use remove with recursive
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it("should not attempt deletion if directory does not exist", async () => {
      vi.mocked(exists).mockResolvedValue(false);
      await deleteDataDir(MOCK_SUBDIR_NAME);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, MOCK_SUBDIR_NAME);
      expect(exists).toHaveBeenCalledWith(MOCK_SUBDIR_PATH);
      expect(remove).not.toHaveBeenCalled();
    });

    it("should throw error if directory deletion fails", async () => {
      const deleteError = new Error("Cannot remove directory");
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(remove).mockRejectedValue(deleteError); // Mock remove failure

      await expect(deleteDataDir(MOCK_SUBDIR_NAME)).rejects.toThrow(`Error deleting directory ${MOCK_SUBDIR_NAME}: ${deleteError}`);
      expect(remove).toHaveBeenCalledWith(MOCK_SUBDIR_PATH, { recursive: true });
    });
  });

  // --- loadUserSettings ---
  describe("loadUserSettings", () => {
    it("should load settings using readJsonFile", async () => {
      const loadedSettings: UserSettings = { name: "Loaded User", status: "away", notificationsEnabled: true, theme: "Dark" };
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(loadedSettings));

      const settings = await loadUserSettings();

      expect(settings).toEqual(loadedSettings);
      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, SETTINGS_FILE);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });

    it("should return default settings if file does not exist", async () => {
      vi.mocked(exists).mockResolvedValue(false);

      const settings = await loadUserSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(readTextFile).not.toHaveBeenCalled();
    });

    it("should return default settings if file content is invalid", async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue("invalid json");

      const settings = await loadUserSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(readTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH);
    });
  });

  // --- saveUserSettings ---
  describe("saveUserSettings", () => {
    it("should save settings using writeJsonFile", async () => {
      const settingsToSave: UserSettings = { name: "Saved User", status: "away", notificationsEnabled: false, theme: "Light" }; // Changed "busy" to "away"
      const expectedJson = JSON.stringify(settingsToSave, null, 2);
      vi.mocked(exists).mockResolvedValue(true); // Assume parent dir exists

      await saveUserSettings(settingsToSave);

      expect(join).toHaveBeenCalledWith(MOCK_APP_DATA_DIR, SETTINGS_FILE);
      expect(writeTextFile).toHaveBeenCalledWith(MOCK_SETTINGS_PATH, expectedJson);
    });

    // Error cases are covered by writeJsonFile tests
  });
});
