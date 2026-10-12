---
name: Project Structure
description: Overview of the src directory, key components, and routing to help the AI navigate the project faster.
---

# Project Structure Overview

This project is a React 19 application built with Vite and TypeScript for pool maintenance & service management ("Blu").

## Key Directories

### `src/`
- **`components/`**: Reusable UI components.
    - `PageLayout.tsx`: Master layout template with standardized header, responsive navigation, and actions.
    - `ModalLayout.tsx`: Standard modal wrapper with Portal teleportation (`createPortal`), smooth transitions, and drawer handle.
    - `ConfirmModal.tsx`: Accessible confirmation modal.
    - `BottomNav.tsx`: Mobile bottom navigation bar.
    - `NewIntervention.tsx`: Comprehensive modal form for creating/editing pool maintenance interventions.
    - `ui/`: Design system primitives (`Button.tsx`, `Combobox.tsx`, `Input.tsx`, `Select.tsx`, `PhotoUpload.tsx`).
- **`pages/`**: Route components (views).
    - `Dashboard.tsx`: Operational hub with quick metrics and tiles.
    - `Login.tsx`: Mobile-first authentication screen.
    - `Clients.tsx` / `ClientDetail.tsx`: Client management, pools, devis, and billing history.
    - `Planning.tsx`: Multi-view calendar and scheduling for technician interventions.
    - `Interventions.tsx`: Comprehensive history and logs of field operations.
    - `Technicians.tsx` / `TechnicianDetail.tsx` / `TechnicianPortal.tsx`: Staff management, portal, and field workflow.
    - `AdminFinance.tsx`: Financial dashboard, advances, expenses, and technician collections.
    - `Chantiers.tsx` / `PoolCatalogue.tsx`: Worksite tracking and pool catalog.
- **`lib/`**: Core utilities and services.
    - `supabase.ts`: Supabase client configured with full database types.
    - `database.types.ts`: TypeScript schema generated from PostgreSQL.
    - `formatters.ts`: Currency, date, and phone formatting.
    - `paymentService.ts`: Payment ventilation calculations.
    - `recurrenceService.ts`: Recurring maintenance calculations.
- **`assets/`**: Static assets like logos, brand marks, and fonts.

## Key Files
- `src/App.tsx`: Application router, session state, and protected route wrapper.
- `src/main.tsx`: Entry point.
- `src/index.css`: Global DeepBlue Flow Design System styles, CSS variables, and utility classes.

## Routing
Routing is handled with `react-router-dom` in `src/App.tsx`.
