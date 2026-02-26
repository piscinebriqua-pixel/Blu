---
name: Project Structure
description: Overview of the src directory, key components, and routing to help the AI navigate the project faster.
---

# Project Structure Overview

This project is a React application built with Vite and TypeScript.

## Key Directories

### `src/`
- **`components/`**: Reusable UI components.
    - `GabaritPage.tsx`: Main layout template for pages.
    - `ModalLayout.tsx`: Standard modal wrapper.
    - `NewIntervention.tsx`: Giant form for creating/editing work records.
    - `ThemeToggle.tsx`: Dark/Light mode switcher.
- **`pages/`**: Route components (views).
    - `Dashboard.tsx`: Main landing page after login.
    - `Login.tsx`: Authentication page.
    - `Clients.tsx`: Client management.
    - `Planning.tsx`: Main calendar and scheduling (multi-view).
    - `Interventions.tsx`: List of all work history.
    - `Technicians.tsx`: Staff management.
    - `Showcase.tsx`: Gallery/Showcase page.
- **`lib/`**: Utility functions and external service configurations (e.g., `supabase.ts`).
- **`assets/`**: Static assets like images and fonts.

## Key Files
- `src/App.tsx`: Main application component, likely contains routing logic.
- `src/main.tsx`: Entry point.
- `src/index.css`: Global styles and variables (Tailwind or custom CSS).
- `src/design.css`: Specific design system extensions.

## Routing
Routing is likely handled by `react-router-dom` in `App.tsx` or a dedicated router file.
