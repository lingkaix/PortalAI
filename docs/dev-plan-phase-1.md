# Project Portal: Development Plan - Phase 1 (Local MVP)

Version: 1.2  
Date: May 22, 2025

## Introduction

This document outlines the initial development plan for Project Portal, focusing on delivering a Minimum Viable Product (MVP) as a free, local-only desktop application. This phase prioritizes establishing the core user interface, foundational agent capabilities, essential tools, and the necessary infrastructure for testing and deployment. All features are scoped for a personal workspace environment.

### Key Exclusions (for MVP):

* No user accounts, authentication, or signup.  
* No server backend or cloud synchronization.  
* No Team Workspaces or multi-user collaboration features.  
* No advanced code execution sandbox (beyond the codeAct needs) or web rendering within the app initially.  
* No Memory Auditing/Editing features.  
* No Asset Sharing features.  
* No database (using JSON files instead).

## Part 1: Core UI Development (Tauri + React)

This part focuses on building the primary user interface and navigation structure.  
1.1. General Application Layout:

* Platform: Tauri with React frontend (TypeScript, Vite, Tailwind CSS).  
* Structure:  
  * Left Sidebar: Primary navigation pane for switching between main pages/modules (Dashboard, Chats, Agent Management, etc.).  
  * Main Content Area: Central area for displaying the content of the selected page.  
  * Pop-up Right Sidebar (Contextual): A collapsible/expandable sidebar on the right for displaying context-specific information (e.g., agent details, tool options, task details). *Future: User resizable, detachable as separate window.*  
  * Notification System: Pop-up notifications (e.g., toasts) from the bottom of the screen for errors, warnings, or important alerts.

1.2. Dashboard Page:

* Purpose: Central landing page for the Personal Workspace.  
* Content:  
  * Overview of workspace activity: Display the last 3-5 accessed channels/tasks. No complex filtering, historical aggregation, or detailed analytics for MVP.  
  * Access point for general information and quick actions.  
  * Initial Setup Guidance: The Dashboard area or a first-run modal should guide the user through essential initial configurations, such as setting up their LLM API key (if required by configured agents) and understanding how to interact with 'Magic Conch' for initial tasks or help.  
* "Magic Conch" (Workspace Supervisor / Personal Assistant) Integration:  
  * Provides a primary, easily accessible interface for "Magic Conch" to act as an all-over chat AI for simple or ad-hoc questions.  
  * Users can engage in general chat with Magic Conch for:  
    * Summarizing workspace status.  
    * Navigating to specific channels/tasks.  
    * Creating new tasks through conversation.  
    * Querying general historical knowledge (from what Magic Conch has access to within the personal workspace).  
    * Seeking help that might require Magic Conch to delegate to other specialized agents.

1.3. Chat UI (Channels & Tasks):

* Core Functionality: The most critical page for user-agent interaction.  
* Structure:  
  * Ability to create/manage "Channels" (acting as project containers or thematic discussions for the Personal Workspace MVP).  
  * Ability to create/manage "Tasks" within Channels. A task will typically instantiate a specific chat session.  
* Chat Interface:  
  * Supports group chat dynamics where the user interacts with one or more AI agents (e.g., the Orchestrator Agent bringing in other expert agents).  
  * Direct chat with specific agents.  
  * *Future (Post-MVP):* Multi-human collaboration.  
* Channel/Task Management Considerations:  
  * Provide an intuitive way to list, search, and navigate channels and tasks.  
  * Streamline the process of creating a new task within the appropriate channel.  
  * *(Potentially a pinned channel for "Magic Conch" for quick access if not solely on the dashboard).*

1.4. Agent Management Page:

* Purpose: Manage agents available within the Personal Workspace.  
* Functionality:  
  * List built-in agents (e.g., "Magic Conch" Orchestrator Agent, "Shiny Dolphin," "Super Wombat").  
  * Allow users to add/configure new local agents (based on available models and tools, configuration via JSON file as per PRD).  
  * Display agent status and basic details.  
  * Manage agent memory settings (e.g., clearing short-term memory, pointing to specific long-term memory files/contexts if applicable).  
  * *Future (Post-MVP):* Adding remote agents via A2A protocol.

1.5. Tool Management Page:

* Purpose: Manage tools available for agents.  
* Functionality:  
  * List built-in tools provided by the application.  
  * Allow users to configure/add MCP (Multi-Modal Cognitive Processes) tools via JSON configuration files.

1.6. Settings Page:

* Purpose: General application settings.  
* Functionality:  
  * Configure default LLM model settings (e.g., API key source, endpoint for local models like Ollama, default temperature).  
  * Basic user profile information (local, no accounts).  
  * Application preferences (e.g., theme, notification settings).

1.7. Future Pages (Post-MVP):

* Knowledge Base Management Page.  
* Timers/Scheduled Tasks Page.  
* Receipts/Workflows/Templates Page.

## Part 2: Foundational Agent Implementation

This part focuses on developing the initial set of key functional agents and the underlying framework.  
2.1. "Magic Conch" (Workspace Supervisor / Personal Assistant):

* Role: Acts as the user's primary AI assistant within the Personal Workspace. Serves as both a workspace administrator and an all-over chat AI for general queries.  
* Capabilities:  
  * Understands natural language queries about the workspace.  
  * Can summarize workspace status.  
  * Helps navigate or initiate actions (e.g., creating tasks/channels).  
  * Accesses and utilizes the Personal Workspace's general knowledge.  
  * For general queries, can call upon other specialized agents (e.g., ask "Super Wombat" to search online, or "Shiny Dolphin" to review a file).  
  * If a general chat becomes complex or requires long-term tracking, Magic Conch will suggest moving the conversation to a new or existing channel/task.  
* Framework: Implemented using LangChain.js/LangGraph.js, configured via agents.json.

2.2. "Super Wombat" (Online Research Agent):

* Role: Specialized agent for accessing all kinds of online content.  
* Model: Utilizes an LLM that supports search (via tool use/function calling).  
* Capabilities:  
  * Takes a search query or topic as input.  
  * Uses the "Headless Browser Tool" to perform searches, browse webpages, and retrieve information.  
  * Can summarize findings, answer questions based on web content, or provide URLs to relevant sources.  
* Framework: Implemented using LangChain.js, utilizing the browser tool.

2.3. "Shiny Dolphin" (Multimodal File Processing Agent):

* Role: Specialized agent for reading and understanding a wide variety of local files and content types.  
* Model: Utilizes a multimodal LLM.  
* Capabilities:  
  * Takes a file path and query/extraction instruction as input.  
  * Uses "File Reader" and "File Information Extractor" tools to process different file types (text, docx, pdf, images, videos, etc., based on tool capabilities).  
  * Can summarize content, answer questions about the file, describe images/videos, or extract specific data.  
* Framework: Implemented using LangChain.js, utilizing multimodal file processing tools.

2.4. Core Agent Framework (Model-Tool-Memory):

* Implement the foundational structures using LangChain.js/LangGraph.js for:  
  * Defining agents (loading configuration from agents.json).  
  * Managing agent memory (Short-Term/Working Context passed dynamically in prompts or held as ephemeral in-memory objects during a session; Long-Term/Learned Knowledge stored in dedicated agent-specific JSON files or structured sections within a general knowledge JSON, focusing on simple key-value or text list storage for MVP).  
  * Integrating and calling tools (both built-in and configured MCP tools).  
  * Orchestrating agent interactions (especially for the Orchestrator/Planner agent as defined in the PRD, which uses codeAct).  
  * Agent Error Communication: Agents must clearly communicate failures, inability to perform a task, or ambiguities to the user, providing reasons where possible via the chat interface, rather than failing silently or providing incomplete/misleading information.

## Part 3: Core Tooling & Integration

This part focuses on developing the essential built-in tools and the mechanism for integrating external tools.  
3.1. Built-in Tools:

* codeAct Execution Environment: A secure environment (TS/JS sandbox) for the Orchestrator Agent to execute generated TS/JS code snippets for calling other agents or tools. For MVP, this environment will primarily execute code for calling other registered agents/tools and basic conditional logic or data manipulation directly related to task flow, not arbitrary complex computations or UI manipulations.  
* Headless Browser Tool: For enabling agents like "Super Wombat" to browse the web, scrape information, and conduct online research. (Implemented in TS/Puppeteer or Rust backend).  
* Local File Reader Tool: Allows agents like "Shiny Dolphin" to read content from local files (via Tauri FS API).  
* File Information Extractor Tool: Allows agents like "Shiny Dolphin" to extract text and structured data from various file types (PDF, TXT, MD initially, expanding to DOCX, image metadata, video transcripts as feasible with TS libraries or Rust helpers).

3.2. MCP Tool Integration:

* Configuration: Users can configure external MCP tools by providing/editing a mcp_tools.json file.  
* Invocation: Agents (via codeAct or specific LangChain tool classes) can call these configured MCP tools, typically via HTTP requests or local command execution (with appropriate security considerations and user consent for local execution).

## Part 4: Infrastructure & DevOps

This part focuses on establishing robust development and deployment practices.  
4.1. Automated Testing:

* Unit Testing: Setup for TypeScript (Vite/Vitest) and any Rust helper functions (cargo test).  
* End-to-End (E2E) Testing: Basic framework setup (e.g., Playwright or Cypress with Tauri driver) for testing core UI flows.  
* CI Integration: All tests to be run automatically in the CI pipeline.

4.2. Automated Build Process (CI/CD):

* Platform: GitHub Actions.  
* Trigger: On new Git tags.  
* Targets: Build and package the Tauri application for:  
  * macOS (x86_64 and arm64)  
  * Windows (x86_64)  
  * Linux (x86_64 - Flatpak)  
* Release: Automatically create a GitHub Release and upload built artifacts.

4.3. Automated Application Updater:

* Implement Tauri's built-in updater module.  
* Configure to check the project's GitHub Releases for new versions.  
* Prompt user for updates.

## Development Phasing Approach (High-Level)

While the plan is structured in four parts, development will likely interleave these:

1. Foundation: Prioritize Part 4 (Infrastructure - CI/CD basics, updater setup) and Part 1 (General UI Layout, core Tauri setup).  
2. Core Agent & UI: Implement the essential Chat UI (Part 1) and the Core Agent Framework with the Orchestrator Agent and codeAct (Part 2 & 3). Introduce "Magic Conch" with its basic chat interface on the Dashboard.  
3. Key Tools & Specialized Agents: Develop essential built-in tools and the specialized agents ("Super Wombat," "Shiny Dolphin") (Part 2 & 3).  
4. Supporting UI & Features: Complete other UI pages (Agent/Tool Management, Settings) (Part 1).  
5. Testing & Polish: Iteratively enhance E2E testing, fix bugs, and polish the user experience across all implemented parts.

This plan provides a roadmap for the initial local MVP of Project Portal. Each part will be broken down further into specific tasks and sprints during development.