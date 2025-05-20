# General Project Rules

## Core Principles
- Security First: Prioritize security in all generated code. Avoid hardcoded secrets or credentials. Implement robust input validation and output sanitization to prevent common vulnerabilities (XSS, SQLi, etc.). Assume all external input is potentially malicious.
- Clarity & Readability: Generate code that is easy for humans to understand. Use meaningful variable, function, and class names. Follow consistent naming conventions. Add comments only where the logic is complex or non-obvious, not to explain simple code.
- Maintainability: Write modular code. Break down complex logic into smaller, manageable functions or components. Avoid overly complex structures or deep nesting. Aim for code that is easy to modify and debug later.
- Simplicity (KISS): Prefer simple, straightforward solutions over complex ones unless complexity is justified by significant performance gains or necessary functionality. "Keep It Simple, Stupid."
- Correctness: Ensure the generated code correctly implements the requested logic and handles edge cases appropriately.
- Consistency: Adhere strictly to the established coding style, patterns, and conventions of the specific project and language.
- No Premature Optimization: Write clear, working code first. Optimize only when performance analysis indicates a bottleneck and the optimization doesn't unduly sacrifice readability or maintainability.
- Robust Error Handling: Implement comprehensive error handling. Use specific exception types where appropriate. Ensure errors are logged usefully and handled gracefully without crashing or exposing sensitive information.
- Testability: Write code that is inherently testable. Favor pure functions and dependency injection where applicable to facilitate unit testing.

## Documentation & Project Management
- All documentation must be in Markdown format
- If helpful, use mermaid syntax for diagrams and KaTeX syntax for formulas
- All content (code, comments, documentation) must be in English
- When planning tasks or gathering information, ALWAYS consult the contents of the `docs/` directory first as the primary knowledge base before seeking external information. Adhere strictly to processes, structures, and decisions documented within the `docs/` directory.
- Follow the git commit guidelines as specified in `docs/git-commit-guideline.md`
- Adhere to the project's directory and file organization as defined in `docs/file-structure.md`. If a task requires changes to the established file structure (e.g., adding new standard directories, moving core components), you MUST update `docs/file-structure.md` to reflect these changes accurately as part of the task completion.
- For significant changes, create a plan document in `docs/plans/` following the pattern: `[plan_name]-[YYYYMMDD]-[version].md`(e.g., `renew-agent-configuration-ui-20250411-v1.md`). The plan document MUST include:
  - Clear description of the feature/update and its goals.
  - High-level design choices and rationale.
  - A detailed implementation plan (steps, components involved).
  - A list of the main files and/or folders expected to be created or significantly modified.
- Then, when assigned an implementation task based on a plan document, attach that document as context and follow the specified design and implementation plan rigorously. Deviations require explicit approval or updates to the document.

## Language-Specific Guidelines

### JavaScript/TypeScript
- Follow StandardJS/Prettier rules for TypeScript/JavaScript
- Use TypeScript for type safety and better maintainability
- Utilize static typing features effectively
- Write clear JSDoc documentation for public APIs

### Python
- Follow PEP 8 style guide
- Use type hints for better code clarity
- Write clear docstrings for public APIs
- Use virtual environments for dependency management

### Rust
- Follow rustfmt formatting rules
- Use rustdoc for documentation
- Leverage Rust's type system and ownership model
- Follow Rust's error handling patterns using Result and Option

## General Coding Practices
- Style & Formatting:
  - Consistent indentation, spacing, line breaks, and brace style
  - Follow language-specific formatting tools (rustfmt, prettier, black)
  - Use meaningful variable and function names
  - Avoid magic numbers/strings - use named constants

- Implementation:
  - Preserve existing code structure unless explicitly required to change
  - Avoid unnecessary updates to files
  - Consider edge cases in all implementations
  - Keep functions focused on single responsibility
  - Limit function parameters, use objects/structs for many parameters
  - Have clear return types and consistent return values
  - Add comments to explain why, not what
  - Use specific exception types, not generic ones
  - Validate inputs explicitly
  - Prefer immutable data structures where practical
  - Manage resources properly (files, connections, etc.)
  - Avoid code duplication (DRY principle)

- Testing:
  - Write unit tests for critical business logic
  - Ensure tests are independent and deterministic
  - Aim for good test coverage of core functionality

- Documentation:
  - Document public APIs clearly
  - Keep documentation up to date
  - Document complex algorithms and design decisions
