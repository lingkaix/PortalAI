PortalAI/
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       └── build-and-release.yml  # CI/CD workflow to build the app withn each tagged release on Github
├── .vscode/                     # VS Code specific settings (optional)
│   └── settings.json            # Workspace settings (e.g., formatting, extensions)
├── public/                      # Static assets directly served by Vite dev server and copied to dist
├── src/                         # Frontend source code (React + TypeScript)
│   ├── assets/                  # Frontend-specific static assets (images, fonts) processed by Vite
│   ├── components/              # Reusable React UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions, helpers, constants for the frontend
│   ├── pages/                   # Page components (if using routing)
│   ├── styles/                  # Global CSS, CSS Modules, or styling configurations
│   ├── App.tsx                  # Root React component
│   └── main.tsx                 # Frontend entry point, renders the React app
├── src-tauri/                   # Tauri backend and configuration (Rust)
│   ├── build.rs                 # Rust build script (optional, for build-time tasks)
│   ├── icons/                   # Application icons for different platforms
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.ico             # Windows icon
│   │   └── icon.png             # Base PNG icon (used to generate others)
│   ├── src/                     # Rust source code for the backend
│   │   ├── commands.rs          # Rust functions exposed to the frontend (optional)
│   │   ├── main.rs              # Main Rust application entry point
│   │   └── lib.rs               # Rust library code (if main.rs calls into a lib)
│   ├── target/                  # Rust build output directory (usually gitignored)
│   ├── Cargo.lock               # Exact dependency versions for Rust
│   ├── Cargo.toml               # Rust package manifest (dependencies, metadata)
│   └── tauri.conf.json          # Core Tauri configuration (window, plugins, build, security)
├── .gitignore                   # Specifies intentionally untracked files that Git should ignore
├── index.html                   # HTML template entry point for Vite
├── package.json                 # Node.js project manifest (dependencies, scripts)
├── postcss.config.js            # Configuration for PostCSS (if used, e.g., with Tailwind)
├── tailwind.config.js           # Configuration for Tailwind CSS (if used)
├── tsconfig.json                # TypeScript configuration for the frontend code (src/)
├── tsconfig.node.json           # TypeScript configuration for Node.js-related files (e.g., vite.config.ts)
├── vite.config.ts               # Vite configuration file
└── docs/                         # Documentation files
    ├── PRD.md                    # Product Requirements Document
    ├── backend-design.md         # Backend design document
    ├── dev-plan-phase-1.md       # Development plan for MVP phase
    ├── file-structure.md         # Documentation of the project's file structure
    ├── plans/                    # Directory for development plans
    └── references/               # Directory for reference materials
