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
// Import functions to test from localAppData
import {
  readJsonFile,
  writeJsonFile,
} from "./localAppData";

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
const MOCK_SUBDIR_NAME = "test-subdir";
const MOCK_SUBDIR_PATH = `${MOCK_APP_DATA_DIR}/${MOCK_SUBDIR_NAME}`;
const MOCK_FILE_IN_SUBDIR_PATH = `${MOCK_SUBDIR_PATH}/test.json`;
const MOCK_FILE_IN_SUBDIR_PARENT_PATH = MOCK_SUBDIR_PATH;

// TODO: testings
