---
name: Coding Standards
description: Rules for React components, TypeScript usage, and general coding style preferences.
---

# Coding Standards & Best Practices

## General
- **Language**: TypeScript (`.tsx`, `.ts`).
- **Style**: Use functional components with hooks.
- **Formatting**: Use 4 spaces for indentation (or match existing file config).

## React Components
- **Naming**: PascalCase for components (e.g., `MyComponent.tsx`).
- **Props**: Use interfaces for prop types.
- **State**: Use `useState` for local state, context for global state if needed.
- **Effects**: Use `useEffect` sparingly and ensure dependency arrays are correct.

## Styling
- **Method**: Global CSS variables and utility classes defined in `src/index.css`.
- **Avoid**: Inline styles (`style={{ ... }}`) unless dynamic.
- **Classes**: Use `className` with the predefined utility classes (e.g., `.card-white`, `.btn-primary`, `.text-muted`).

## TypeScript
- **Strictness**: Avoid `any` where possible. Define interfaces for data structures.
- **Null Checks**: Handle potential `null` or `undefined` values, especially from API responses.

## Imports
- Group imports:
    1. React and standard libraries.
    2. Third-party libraries (e.g., `lucide-react`, `supabase`).
    3. Internal components.
    4. Internal utilities/types.
    5. Styles.
