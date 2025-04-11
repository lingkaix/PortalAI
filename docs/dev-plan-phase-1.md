# Development Plan & Milestones: Project Portal - Phase 1 (Local MVP)

Version: 0.4  
Date: April 10, 2025

## 1. Introduction

This document outlines the development plan and milestones for **Phase 1** of Project Portal. The primary goal of this phase is to deliver a **Minimum Viable Product (MVP)** as a **free, local-only desktop application**. This MVP will demonstrate the core concepts of the Portal platform, including the agent framework (Model-Tools-Memory leveraging LangChain.js/LangGraph.js), key agent roles and interactions, and essential local data management (using JSON files), all **without requiring user signup or any server-side infrastructure.**  
This initial phase focuses on validating the core architecture, agent capabilities, and user experience in a self-contained environment before exploring cloud-based features and team collaboration.

## 2. Phase 1 Scope & Goals

* **Deliverable:** A functional, cross-platform desktop application (Windows, macOS, Linux via Tauri) distributed for free.  
* **Core Functionality:**  
  * **Personal Workspace:** Implement the user's private workspace environment.  
  * **Local Agent Framework:** Build the foundation for defining and running agents based on the Model-Tools-Memory concept locally, utilizing **LangChain.js/LangGraph.js**.  
  * **Local Configuration/Metadata:** Use local **JSON files** for agent configurations, tool configurations, and Knowledge Base metadata.  
  * **Key Agent Demonstrations:** Implement a core set of agents (Admin, Orchestrator, Researcher, Designer, Coder) to showcase different capabilities and the crucial multi-agent interaction pattern.  
  * **Essential Built-in Tools:** Provide fundamental tools for agents (web Browse, file system access, information extraction, codeAct execution).  
  * **Basic External Tool Config:** Allow users to configure external (e.g., MCP) tools via JSON input/file.  
* **Key Exclusions (for Phase 1):**  
  * No user accounts, authentication, or signup.  
  * No server backend or cloud synchronization.  
  * No Team Workspaces or multi-user collaboration features.  
  * No advanced code execution sandbox (beyond the codeAct needs) or web rendering within the app initially.  
  * No Memory Auditing/Editing features.  
  * No Asset Sharing features.  
  * No database (using JSON files instead).

## 3. Architecture & Technical Details

* **Application Shell (Tauri):** Provides the cross-platform desktop container, access to native OS capabilities, and manages the Rust backend process.  
* **Frontend (TypeScript Dominant):**  
  * **Primary Language:** **TypeScript** for UI (React/Vite/Tailwind), agent logic, tool implementations, state management, and interactions with Rust backend via Tauri's JS API bridge.  
  * **Key Libraries:** **LangChain.js/LangGraph.js** for agent creation, orchestration, context management, and tool integration.  
* **Backend/Core Logic (Rust via Tauri - Minimalist Role):**  
  * **Core Task:** Handles tasks requiring native performance or capabilities not suitable/available for the frontend TS environment (e.g., interfacing with specific OS libraries not exposed by Tauri's JS API, CPU-intensive computations if any). May provide optimized file I/O or helper functions callable from TS.  
  * **Tauri API Bridge:** Exposes necessary functions (e.g., readFile, writeFile) to the TypeScript frontend.  
* **Agent Execution Environment:**  
  * **Framework:** Built using **LangChain.js/LangGraph.js**.  
  * **Orchestration & codeAct:** The Orchestrator agent (TS, using LangGraph) will generate **TypeScript/JavaScript code snippets** following the codeAct pattern.  
  * **Other Agents:** Logic implemented in TypeScript, leveraging LangChain abstractions.  
* **Configuration & Metadata (Local JSON Files):**  
  * Replace database with local JSON files stored in the application's data directory.  
  * agents.json: Stores configurations for defined agents (LLM settings like API key source/model name, temperature, assigned tools, role/prompt).  
  * mcp-tools.json: Stores configurations for external MCP tools provided by the user.  
  * knowledge-base.json: Stores metadata for Knowledge Base files (path, user-assigned category, AI-generated summary, timestamps).  
  * **Data Access:** Read/write operations on these JSON files handled by TypeScript functions calling Tauri's FS APIs. Need to manage potential concurrent access if applicable, though less likely in MVP.  
* **Knowledge Base Implementation:**  
  * **Storage:** Original documents stored directly on the user's local file system.  
  * **Metadata/Indexing:** File paths, categories, summaries stored in knowledge-base.json.  
  * **Context Retrieval:** Logic in TS reads knowledge-base.json to find relevant document summaries/metadata based on queries, then loads full content from disk via Tauri FS API as needed.  
* **Tools Implementation (TypeScript First):**  
  * **Goal:** Implement tools using TypeScript libraries/functions, callable via LangChain/LangGraph.  
  * **CodeAct Execution:** A dedicated TS function execution sandbox (currently using web worker) within the frontend will execute the generated TS/JS code. Requires strict validation and sandboxing. Available tools/functions exposed to this environment.  
  * **Built-in Tools:**  
    * *Headless Browser:* Use Playwright  
    * *Local File Reader/Writer:* Use Tauri's FS API directly from TypeScript, exposed as a tool.  
    * *File Information Extractor:* Use TS libraries (e.g., pdf.js, etc.).  
    * *Agent Interaction Functions (codeAct targets):* Functions like listAgents(), callAgent(agentName, args) exposed as callable TS functions/LangChain tools.  
  * **External (MCP) Tool Configuration:** UI allows editing mcp-tools.json. Logic (in TS) parses this file to make HTTP calls or execute commands based on the config (with security validation).

## 4. Key Agents & Implementation Details

* **Core Framework:** Use LangChain.js/LangGraph.js for agent definition, state management, tool usage, and chaining/graph execution.  
* **Configuration:** Agents load configuration (model, temp, tools) from agents.json.  
* **Workspace Admin Agent:** TS-based agent (LangChain), uses file system tools.  
* **Orchestrator/Planner Agent (CRITICAL):** TS-based agent (LangGraph), generates TS/JS codeAct snippets executed via the dedicated executor tool. Manages multi-agent workflows.  
* **Deep Research Agent:** TS-based agent (LangChain), uses Headless Browser, File Extractor, and KB (JSON metadata) tools.  
* **Image Generation Agent (Designer):** TS-based agent (LangChain), placeholder or basic API call via HTTP tool.  
* **Programming Agent:** TS-based agent (LangChain), generates code snippets as text.

## **5. Build, Release, and Auto-Update**

* **5.1 CI/CD:** GitHub Actions triggered by Git tags.  
* **5.2 Automated Builds:** Tauri build for: macOS (x86_64, aarch64), Windows (x86_64), Linux (x86_64, Flatpak).  
* **5.3 Automated Releases:** Create GitHub Release with built binaries/installers.  
* **5.4 Application Auto-Update:** Tauri updater module configured to check GitHub Releases.

## **6. Milestone Deliverables**

1. **M1: Foundational Framework & Project Infrastructure:**  
   * **Core Setup:** Tauri app initialized, basic window, frontend build pipeline (Vite/React/TS).  
   * **CI/CD Pipeline:** Setup and testing of GitHub Actions CI/CD for build (incl. Flatpak) and release automation triggered by Git tags.  
   * **Auto-Updater:** Implementation and testing of Tauri's auto-updater checking GitHub Releases.  
   * **Testing Infrastructure:** Setup Unit Testing (Vitest for TS, cargo test for Rust helpers) and basic E2E Testing foundation (e.g., Playwright/Cypress + Tauri driver). Integrate tests into CI pipeline.  
   * **Basic State Management:** Setup client-side state management (e.g., Zustand, Redux Toolkit).  
2. **M2: UI Design & Implementation:**  
   * **Focus:** Implement the primary user interface components based on designs (React/Tailwind).  
   * **Deliverables:** Functional UI shell including:  
     * Personal Workspace layout (project list/sidebar).  
     * Chat interface components (message display, input area).  
     * Basic Settings panel structure.  
     * Placeholders for agent configuration and KB view.  
3. **M3: Core Agent Framework & Essential Tools:**  
   * **Agent Foundation:** Integrate **LangChain.js/LangGraph.js**. Define basic agent structure reading config from agents.json (file created manually initially). Implement core agent calling/context sharing mechanism. Implement UI for basic LLM config (API key input, temperature slider).  
   * **Key Tools Implementation (TS First):**  
     * Implement the secure **codeAct TS/JS execution environment**.  
     * Implement **Headless Browser** tool (TS/Rust).  
     * Implement **File System** tool (via Tauri API).  
     * Implement logic for calling **External MCP tools** based on mcp-tools.json (file created manually initially).  
     * Lay groundwork for **Deep Research** agent's tool usage patterns.  
4. **M4: Agent Implementation & Configuration UI:**  
   * **Implement Core Agents:** Build the specific agent logic using the M3 framework: Workspace Admin, Orchestrator (utilizing codeAct), Researcher, Designer (basic), Coder (basic).  
   * **Configuration UI:** Implement UI components for users to view, add, and edit agent configurations (reading/writing agents.json). Implement UI for configuring external MCP tools (reading/writing mcp-tools.json).  
5. **M5: Knowledge Base (JSON) & Polish:**  
   * **KB Metadata:** Implement logic for reading/writing knowledge-base.json.  
   * **KB File Handling:** Implement UI and logic (via Tauri API) for adding files to the KB (copying files locally) and associating them with metadata in knowledge-base.json.  
   * **Context Retrieval:** Implement logic to use knowledge-base.json to find relevant documents/summaries for agent context.  
   * **Agent KB Integration:** Integrate Research/Admin agents to read from and write to the KB (knowledge-base.json + associated files).  
   * **Finalization:** Comprehensive testing, bug fixing, documentation updates, final packaging.

