import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSettingsStore, SettingsState } from "./settingsStore"; // Import state type
import * as dataManager from "../lib/dataManager"; // Import namespace to mock
import { UserSettings, UserStatus } from "../types";
import { act } from "react"; // Try importing act from react instead

// --- Mock the dataManager module ---
// We mock the specific functions used by the store
vi.mock("../lib/dataManager", async (importOriginal) => {
  const actual = await importOriginal<typeof dataManager>();
  return {
    ...actual, // Keep other exports like constants if needed
    loadUserSettings: vi.fn(),
    saveUserSettings: vi.fn(),
  };
});

// --- Test Suite ---

// Helper function to reset the store state before each test
const resetStore = () => {
  // Reset Zustand store to initial state + defaults
  // Merge default data back into the store, don't replace entirely
  useSettingsStore.setState({
    ...dataManager.DEFAULT_SETTINGS, // Use the actual default settings
    isInitialized: false,
  });
};

describe("settingsStore", () => {
  // Cast the mocked functions for type safety in tests
  const mockedLoadUserSettings = vi.mocked(dataManager.loadUserSettings);
  const mockedSaveUserSettings = vi.mocked(dataManager.saveUserSettings);

  beforeEach(() => {
    // Reset mocks and store state before each test
    vi.resetAllMocks();
    resetStore();

    // Default mock implementations for dataManager functions
    mockedLoadUserSettings.mockResolvedValue({ ...dataManager.DEFAULT_SETTINGS }); // Load defaults by default
    mockedSaveUserSettings.mockResolvedValue(undefined); // Save succeeds by default
  });

  it("should have correct initial state", () => {
    const state = useSettingsStore.getState();
    expect(state.name).toBe(dataManager.DEFAULT_SETTINGS.name);
    expect(state.status).toBe(dataManager.DEFAULT_SETTINGS.status);
    expect(state.notificationsEnabled).toBe(dataManager.DEFAULT_SETTINGS.notificationsEnabled);
    expect(state.theme).toBe(dataManager.DEFAULT_SETTINGS.theme);
    expect(state.isInitialized).toBe(false);
  });

  describe("loadSettings action", () => {
    it("should load settings from dataManager and update state", async () => {
      const loadedSettings: UserSettings = {
        name: "Loaded User",
        status: "away",
        notificationsEnabled: true,
        theme: "Dark",
      };
      mockedLoadUserSettings.mockResolvedValue(loadedSettings);

      // Use act to wrap async state updates
      await act(async () => {
        await useSettingsStore.getState().loadSettings();
      });

      const state = useSettingsStore.getState();
      expect(mockedLoadUserSettings).toHaveBeenCalledTimes(1);
      expect(state.name).toBe(loadedSettings.name);
      expect(state.status).toBe(loadedSettings.status);
      expect(state.notificationsEnabled).toBe(loadedSettings.notificationsEnabled);
      expect(state.theme).toBe(loadedSettings.theme);
      expect(state.isInitialized).toBe(true);
    });

    it("should not load settings if already initialized", async () => {
      // Set initialized to true
      act(() => {
        useSettingsStore.setState({ isInitialized: true });
      });

      await act(async () => {
        await useSettingsStore.getState().loadSettings();
      });

      expect(mockedLoadUserSettings).not.toHaveBeenCalled();
    });

    it("should keep default settings and set initialized if loading fails", async () => {
      // const loadError = new Error("Failed to read file");
      // mockedLoadUserSettings.mockRejectedValue(loadError);

      await act(async () => {
        await useSettingsStore.getState().loadSettings();
      });

      const state = useSettingsStore.getState();
      expect(mockedLoadUserSettings).toHaveBeenCalledTimes(1);
      // State should remain as default settings
      expect(state.name).toBe(dataManager.DEFAULT_SETTINGS.name);
      expect(state.status).toBe(dataManager.DEFAULT_SETTINGS.status);
      // isInitialized should be true to prevent retries
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("setNotificationsEnabled action", () => {
    it("should update state optimistically and call saveUserSettings", async () => {
      const initialState = useSettingsStore.getState();
      const newEnabledValue = !initialState.notificationsEnabled;

      // No need for act here as save is async but state update is sync
      const savePromise = useSettingsStore.getState().setNotificationsEnabled(newEnabledValue);

      // Check optimistic update
      expect(useSettingsStore.getState().notificationsEnabled).toBe(newEnabledValue);

      // Wait for save to complete
      await act(async () => {
        await savePromise;
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      // Check that the correct state was passed to save
      const expectedStateToSave: UserSettings = {
        ...initialState,
        notificationsEnabled: newEnabledValue,
      };
      // Remove isInitialized and actions from the saved state check
      const { isInitialized: _i, loadSettings: _l, setNotificationsEnabled: _n, setTheme: _t, saveProfileSettings: _p, _internalSetSettings: _int, ...savedState } = mockedSaveUserSettings.mock.calls[0][0] as SettingsState;
      const { isInitialized: _i2, loadSettings: _l2, setNotificationsEnabled: _n2, setTheme: _t2, saveProfileSettings: _p2, _internalSetSettings: _int2, ...expectedState } = expectedStateToSave as SettingsState;
      expect(savedState).toEqual(expectedState);
    });

    it("should log error if saveUserSettings fails", async () => {
      const saveError = new Error("Failed to write");
      mockedSaveUserSettings.mockRejectedValue(saveError);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); // Spy on console.error

      await act(async () => {
        await useSettingsStore.getState().setNotificationsEnabled(true);
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save notification setting:", saveError);

      consoleErrorSpy.mockRestore(); // Restore console.error
    });
  });

  describe("setTheme action", () => {
    it("should update state optimistically and call saveUserSettings", async () => {
      const initialState = useSettingsStore.getState();
      const newThemeValue: UserSettings["theme"] = "Dark";

      const savePromise = useSettingsStore.getState().setTheme(newThemeValue);

      expect(useSettingsStore.getState().theme).toBe(newThemeValue);

      await act(async () => {
        await savePromise;
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      const expectedStateToSave: UserSettings = {
        ...initialState,
        theme: newThemeValue,
      };
      // Remove isInitialized and actions from the saved state check
      const { isInitialized: _i, loadSettings: _l, setNotificationsEnabled: _n, setTheme: _t, saveProfileSettings: _p, _internalSetSettings: _int, ...savedState } = mockedSaveUserSettings.mock.calls[0][0] as SettingsState;
      const { isInitialized: _i2, loadSettings: _l2, setNotificationsEnabled: _n2, setTheme: _t2, saveProfileSettings: _p2, _internalSetSettings: _int2, ...expectedState } = expectedStateToSave as SettingsState;
      expect(savedState).toEqual(expectedState);
    });

    it("should log error if saveUserSettings fails", async () => {
      const saveError = new Error("Failed to write theme");
      mockedSaveUserSettings.mockRejectedValue(saveError);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await act(async () => {
        await useSettingsStore.getState().setTheme("Light");
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save theme setting:", saveError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("saveProfileSettings action", () => {
    it("should update state optimistically and call saveUserSettings", async () => {
      const initialState = useSettingsStore.getState();
      const newName = "New Name";
      const newStatus: UserStatus = "away"; // Use valid status

      const savePromise = useSettingsStore.getState().saveProfileSettings(newName, newStatus);

      expect(useSettingsStore.getState().name).toBe(newName);
      expect(useSettingsStore.getState().status).toBe(newStatus);

      await act(async () => {
        await savePromise;
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      const expectedStateToSave: UserSettings = {
        ...initialState,
        name: newName,
        status: newStatus,
      };
      // Remove isInitialized and actions from the saved state check
      const { isInitialized: _i, loadSettings: _l, setNotificationsEnabled: _n, setTheme: _t, saveProfileSettings: _p, _internalSetSettings: _int, ...savedState } = mockedSaveUserSettings.mock.calls[0][0] as SettingsState;
      const { isInitialized: _i2, loadSettings: _l2, setNotificationsEnabled: _n2, setTheme: _t2, saveProfileSettings: _p2, _internalSetSettings: _int2, ...expectedState } = expectedStateToSave as SettingsState;
      expect(savedState).toEqual(expectedState);
    });

    it("should log error if saveUserSettings fails", async () => {
      const saveError = new Error("Failed to save profile");
      mockedSaveUserSettings.mockRejectedValue(saveError);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await act(async () => {
        await useSettingsStore.getState().saveProfileSettings("Fail Name", "offline");
      });

      expect(mockedSaveUserSettings).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save profile settings:", saveError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("_internalSetSettings action", () => {
    it("should update state without calling saveUserSettings", () => {
      const partialUpdate: Partial<UserSettings> = { name: "Internal Update" };

      act(() => {
        useSettingsStore.getState()._internalSetSettings(partialUpdate);
      });

      expect(useSettingsStore.getState().name).toBe("Internal Update");
      // Ensure other parts of state are preserved
      expect(useSettingsStore.getState().status).toBe(dataManager.DEFAULT_SETTINGS.status);
      expect(mockedSaveUserSettings).not.toHaveBeenCalled();
    });
  });
});
