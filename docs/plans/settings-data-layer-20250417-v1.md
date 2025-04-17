# Plan: Settings Data Layer Implementation

**Version:** v1
**Date:** 2025-04-17

## 1. Goal

Create a reactive data layer for application settings (`UserSettings`) stored in `[appDataDir]/settings.json`. This layer will use Zustand for state management and `@tauri-apps/plugin-fs` for file persistence. Settings will be loaded on startup, accessible throughout the app, and updated/saved based on user interactions in `SettingsPage.tsx`.

## 2. Dependencies

- `zustand`: For state management.
- `@tauri-apps/plugin-fs`: For file system interaction via Tauri.
- `@tauri-apps/api`: Core Tauri API utilities (like `path`).

## 3. Implementation Steps

1.  **Install Dependencies:**
    ```bash
    npm install zustand @tauri-apps/plugin-fs @tauri-apps/api
    ```
2.  **Define Settings Type (`src/types/index.ts`):**
    ```typescript
    export interface UserSettings {
      name: string;
      status: 'online' | 'offline' | 'away';
      notificationsEnabled: boolean;
      theme: 'Light' | 'Dark' | 'System';
    }
    ```
3.  **Create Settings File Manager (`src/lib/settingsManager.ts`):**
    - Encapsulates reading/writing `settings.json` in `appDataDir`.
    - Handles file/directory creation and default values.
    - Uses `@tauri-apps/plugin-fs` and `@tauri-apps/api/path`.
    - Default Settings: `{ name: 'User', status: 'online', notificationsEnabled: false, theme: 'System' }`
4.  **Create Zustand Store (`src/data/settingsStore.ts`):**
    - Manages `UserSettings` state.
    - Provides actions: `loadSettings`, `setNotificationsEnabled`, `setTheme`, `saveProfileSettings`.
    - Integrates with `settingsManager` for loading and saving.
    - Saves immediately for theme/notifications, on explicit action for profile.
5.  **Integrate Settings Loading (`src/App.tsx` or `src/main.tsx`):**
    - Use `useEffect` on app mount to call `useSettingsStore.getState().loadSettings()`.
6.  **Refactor `SettingsPage.tsx`:**
    - Replace local state for settings with state from `useSettingsStore`.
    - Connect UI controls (inputs, switch, radios) to store state and actions.
    - Update `handleSaveChanges` to call `saveProfileSettings`.
    - Remove mock data dependencies for settings.
7.  **Update `docs/file-structure.md`:**
    - Add entries for `src/lib/settingsManager.ts` and `src/data/settingsStore.ts`.

## 4. Architecture Diagram

```mermaid
graph TD
    subgraph Initialization
        A[App Startup] --> B(Load Settings Store);
        B --> C{settings.json Exists?};
        C -- Yes --> D(fs.readTextFile);
        C -- No --> E(Create Defaults);
        D --> F(Parse JSON);
        F -- Success --> H(Update Zustand State);
        F -- Fail --> E;
        E --> G(fs.writeTextFile Defaults);
        G --> H;
    end

    subgraph SettingsPage Interaction
        I[SettingsPage] --> J(useSettingsStore);
        J --> K[Display settings.*];
        K --> L[Name/Status Inputs (Local State)];
        K --> M[Notification Switch];
        K --> N[Theme Radios];

        L -- User Input --> O(Update localName/localStatus);
        O --> P{Click 'Save Changes'};
        P -- Yes --> Q(store.saveProfileSettings);

        M -- User Toggles --> T(store.setNotificationsEnabled);
        N -- User Selects --> U(store.setTheme);

        subgraph Save Flow
          Q --> R(Update Zustand State);
          T --> R;
          U --> R;
          R --> S(saveSettingsToFile);
          S --> T_JSON([settings.json]);
        end
    end

    subgraph Other Components
        V[Other Components] --> J;
        J --> W(Read settings.*);
    end

    subgraph File System
        X(settingsManager.ts);
        X -- Uses --> Y[@tauri-apps/plugin-fs];
        X -- Manages --> T_JSON;
    end

    style T_JSON fill:#f9f,stroke:#333,stroke-width:2px
```

## 5. Files to be Created/Modified

- **Created:**
    - `docs/plans/settings-data-layer-20250417-v1.md` (This file)
    - `src/lib/settingsManager.ts`
    - `src/data/settingsStore.ts`
- **Modified:**
    - `package.json` (Dependencies)
    - `package-lock.json` (Dependencies)
    - `src/types/index.ts` (Add `UserSettings` type)
    - `src/App.tsx` or `src/main.tsx` (Load settings on startup)
    - `src/pages/SettingsPage.tsx` (Integrate store)
    - `docs/file-structure.md` (Add new file paths)