# PortalAI Project-Specific Rules

## Tech Stack Requirements
- Frontend Framework: React 19+ with TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS 4+
- State Management: Zustand
- Testing: Vitest
- Desktop Runtime: Tauri v2 (Rust backend)
- Icon Library: lucide-react
- UI Components: Radix Primitives

## Frontend Guidelines
- Use CSS variables for theming (defined in src/App.css)
- Follow the synthesized aesthetic design principles:
  - Functionality & Clarity: Well-structured, functional interface with clear layouts
  - Biophilic Calmness: Nature-inspired design elements
    - Use clean, professional base colors with nature-inspired accents
    - Incorporate subtle natural elements without sacrificing clarity
- Use Radix Primitives for building React components
- Follow theme guidelines in src/App.css for all UI components
- Implement responsive design using Tailwind's utility classes
- Use modern React features (hooks, suspense, etc.) appropriately

## Project Structure
- Follow the directory structure as defined in `docs/file-structure.md`
- Place all frontend source code in `src/`
- Place all Tauri/backend code in `src-tauri/`
- Keep documentation in `docs/`
- Store development plans in `docs/plans/`

## Development Workflow
- Use GitHub Actions for CI/CD (defined in .github/workflows/)
- Follow semantic versioning for releases
- Create feature branches for new development
- Keep dependencies up to date and secure

## Testing Requirements
- Write unit tests using Vitest
- Test critical business logic and UI components
- Maintain good test coverage
- Use React Testing Library for component testing

## Performance Guidelines
- Optimize bundle size
- Implement code splitting where appropriate
- Use React's built-in performance optimizations
- Monitor and optimize Tauri backend performance

## Security Requirements
- Follow Tauri's security best practices
- Implement proper input validation
- Handle sensitive data appropriately
- Use secure communication channels
- Follow the principle of least privilege for tool access
