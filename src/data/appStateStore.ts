import { create } from "zustand";
import { AppState } from "../types/appState";

const dbName = "app";
const storeName = "app-state";
const recordName = "appState";

interface AppStateStoreState {
  db?: IDBDatabase;
  appState: AppState;
  init: () => Promise<void>; // load app state from indexed db
  setAppState: (appState: Partial<AppState>) => void;
}

export const useAppStateStore = create<AppStateStoreState>((set, get) => ({
  db: undefined,
  // this is the initial state
  appState: {
    activeChatId: null,
  },
  init: async () => {
    // Specify a version to ensure onupgradeneeded runs if schema changes
    const DB_VERSION = 1;
    const DBOpenRequest = window.indexedDB.open(dbName, DB_VERSION);
    DBOpenRequest.onupgradeneeded = () => {
      const db = DBOpenRequest.result;
      // create object store if it doesn't exist
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    DBOpenRequest.onsuccess = () => {
      const db = DBOpenRequest.result;
      set({ db });
      // Always check if the object store exists before using
      if (!db.objectStoreNames.contains(storeName)) {
        // This should not happen if versioning is correct, but guard just in case
        console.error(`Object store ${storeName} does not exist.`);
        return;
      }
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(recordName);
      request.onsuccess = () => {
        const appState = request.result as AppState | undefined;
        if (appState) {
          set({ appState });
        } else {
          // create a new app state if it doesn't exist
          const appState = get().appState;
          db.transaction(storeName, "readwrite").objectStore(storeName).add(appState, recordName);
        }
      };
    };
  },
  setAppState: (appState: Partial<AppState>) => {
    get().db!.transaction(storeName, "readwrite").objectStore(storeName).put(appState, recordName);
    set({ appState: { ...get().appState, ...appState } });
    return appState;
  },
}));