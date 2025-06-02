import { create } from "zustand";
import { AppState } from "../types/appState";

const dbName = "app";
const storeName = "app-state";
const recordName = "appState";

interface AppStateStoreState {
    db: IDBDatabase;
    appState: AppState;
    init: () => Promise<void>; // load app state from indexed db
    setAppState: (appState: AppState) => AppState;
}

export const useAppStateStore = create<AppStateStoreState>((set, get) => ({
    db: new IDBDatabase(),
    // this is the initial state
    appState: {
        activeChatId: null,
    },
    init: async () => {
        // TODO: load app state from indexed db
        const DBOpenRequest = window.indexedDB.open(dbName);
        DBOpenRequest.onsuccess = () => {
            const db = DBOpenRequest.result;
            set({ db });
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
    setAppState: (appState: AppState) => {
        get().db.transaction(storeName, "readwrite").objectStore(storeName).put(appState, recordName);
        set({ appState });
        return appState;
    },
}));