# Plan: Unified List UI Component and Integration

**Date:** 2025-04-18
**Version:** v3

## 1. Goals

*   Create a reusable UI component for displaying lists of items (Agents, Tools, Knowledge Bases).
*   Define TypeScript types for Agents, Tools, and Knowledge Bases in separate, organized files.
*   Refactor existing types into separate files for better maintainability.
*   Create Zustand stores for managing the state of Agents, Tools, and Knowledge Bases.
*   Integrate the list component into the respective management pages (`AgentsPage`, `ToolsPage`, `KnowledgePage`), connecting them to the new stores.
*   Enhance `src/lib/dataManager.ts` to handle loading and saving specific data types (Agents, Tools, Knowledge Bases), abstracting the underlying storage mechanism.
*   Update the existing `ChatList` component to add specific action icons for channels and clarify the main add button's function.
*   Establish a consistent pattern for displaying and interacting with these list views using state management and abstracted data persistence.

## 2. High-Level Design

*   **Type Organization:**
    *   Create separate files within `src/types/` (e.g., `agent.ts`, `tool.ts`, `knowledge.ts`, `common.ts`, `user.ts`, `chat.ts`, etc.).
    *   Define `AgentType`, `ToolType`, `KnowledgeBaseType` (with `id`, `name`, optional `description`) in their dedicated files.
    *   Move existing types from `index.ts` to their respective files.
    *   Update `src/types/index.ts` to act as a barrel file, re-exporting all types.
*   **Data Management Abstraction (`dataManager.ts`):**
    *   Modify `src/lib/dataManager.ts` to include specific functions for each data type (e.g., `loadAgents(): Promise<AgentType[]>`, `saveAgents(data: AgentType[]): Promise<void>`, and similarly for Tools and Knowledge Bases).
    *   The internal implementation of these functions within `dataManager.ts` will handle the actual file I/O (reading/writing, potentially to specific files like `agents.json` or a consolidated store, using Tauri FS APIs), error handling, and data structure. This logic is hidden from the rest of the application.
*   **State Management (Zustand):**
    *   Create new store files in `src/data/` (e.g., `agentStore.ts`, `toolStore.ts`, `knowledgeStore.ts`).
    *   Each store will manage an array of its respective type (e.g., `agents: AgentType[]`).
    *   Implement actions within each store (e.g., `loadAgents`, `addAgent`, `updateAgent`, `removeAgent`).
    *   These actions will call the corresponding functions in `dataManager.ts` (e.g., `loadAgents`, `saveAgents`) to persist changes.
*   **Generic List Component:** Create `src/components/GenericList.tsx` and `src/components/GenericListItem.tsx`.
    *   `GenericListItem`: Displays item details and action buttons (Configure, Delete). Buttons will trigger functions passed down as props, intended to call store actions.
    *   `GenericList`: Renders items using `GenericListItem`, includes a title and an "Add New" button. The button will trigger a function passed as a prop, intended to call the store's add action.
*   **Page Integration:** Replace placeholder content in `AgentsPage`, `ToolsPage`, `KnowledgePage`.
    *   Use the corresponding Zustand hooks (e.g., `useAgentStore`) to select the data array and actions.
    *   Pass the data array to `GenericList`.
    *   Pass store actions (or functions calling them) as props to `GenericList` and `GenericListItem` for the "Add New", "Configure", and "Delete" buttons.
*   **ChatList Modification:** Update the main '+' button in `ChatList.tsx` to target "Add Channel". Add `MessageSquarePlus` and `Settings` icons to the channel header row with placeholder actions.

## 3. Implementation Plan

1.  **Refactor Types:**
    *   Create new files in `src/types/` (e.g., `common.ts`, `user.ts`, `chat.ts`, `agent.ts`, `tool.ts`, `knowledge.ts`, etc.).
    *   Move existing type definitions from `src/types/index.ts` into the appropriate new files. Define `AgentType`, `ToolType`, `KnowledgeBaseType` in their files.
    *   Update `src/types/index.ts` to re-export everything from the new type files.
    *   Update imports across the project as needed.
2.  **Enhance `dataManager.ts`:**
    *   Add new async functions: `loadAgents`, `saveAgents`, `loadTools`, `saveTools`, `loadKnowledgeBases`, `saveKnowledgeBases`.
    *   Implement the internal logic for these functions to read/write data using Tauri's FS API (or other chosen persistence method). Define internal storage strategy (e.g., separate files, single file). Handle errors gracefully.
3.  **Create Zustand Stores:**
    *   Create `src/data/agentStore.ts`, `src/data/toolStore.ts`, `src/data/knowledgeStore.ts`.
    *   Define state (e.g., `agents: AgentType[]`) and actions (`loadAgents`, `addAgent`, etc.) for each.
    *   Implement `load` actions using the corresponding `dataManager.load...` functions.
    *   Implement `add`, `update`, `remove` actions that modify the state and then call the corresponding `dataManager.save...` functions.
4.  **Create `GenericListItem.tsx`:** Build the component in `src/components/` to render item details and action buttons (`Settings`, `Trash2`). Accept `onConfigure` and `onDelete` props.
5.  **Create `GenericList.tsx`:** Build the component in `src/components/` to display a title, an "Add New" button (accepting an `onAddItem` prop), and map over the data array, rendering `GenericListItem` for each item. Pass down `onConfigure` and `onDelete` props.
6.  **Update `ChatList.tsx`:**
    *   Change the title of the main `Plus` button (line 104) to "New Channel". Add a placeholder `onClick` handler.
    *   Add `MessageSquarePlus` and `Settings` icon buttons within the channel header `div` (around lines 124-130). Add basic styling and placeholder `onClick` handlers.
7.  **Update `AgentsPage.tsx`:**
    *   Import `GenericList` and `useAgentStore`.
    *   Use the store hook to get the `agents` array and relevant actions (`addAgent`, `updateAgent`, `removeAgent`).
    *   Call the `loadAgents` action on component mount (e.g., in `useEffect`).
    *   Render `GenericList`, passing the `agents` array and functions that call the store actions for `onAddItem`, `onConfigure`, `onDelete`.
8.  **Update `ToolsPage.tsx`:** Repeat step 7 for Tools and `useToolStore`.
9.  **Update `KnowledgePage.tsx`:** Repeat step 7 for Knowledge Bases and `useKnowledgeStore`.

## 4. Files to be Created/Modified

*   **Created:**
    *   `docs/plans/unified-list-ui-20250418-v3.md`
    *   `src/components/GenericList.tsx`
    *   `src/components/GenericListItem.tsx`
    *   `src/types/common.ts` (or similar for shared types)
    *   `src/types/agent.ts`
    *   `src/types/tool.ts`
    *   `src/types/knowledge.ts`
    *   `src/types/user.ts` (from refactoring)
    *   `src/types/chat.ts` (from refactoring)
    *   `src/types/workspace.ts` (from refactoring)
    *   `src/types/channel.ts` (from refactoring)
    *   `src/types/message.ts` (from refactoring)
    *   `src/types/settings.ts` (from refactoring)
    *   `src/data/agentStore.ts`
    *   `src/data/toolStore.ts`
    *   `src/data/knowledgeStore.ts`
*   **Modified:**
    *   `src/types/index.ts` (to re-export)
    *   `src/lib/dataManager.ts` (to add new load/save functions)
    *   `src/components/ChatList.tsx`
    *   `src/pages/AgentsPage.tsx`
    *   `src/pages/ToolsPage.tsx`
    *   `src/pages/KnowledgePage.tsx`
    *   Potentially many files due to type import path changes.

## 5. Future Considerations

*   Implementing the actual logic within the `onConfigure` handlers.
*   Refining the internal storage strategy within `dataManager.ts`.
*   Adding more robust error handling and loading states for data operations.
*   Refining UI/UX for adding/editing items.
*   Search/filtering for `GenericList`.