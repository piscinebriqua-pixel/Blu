---
name: Design System
description: Instructions for using the project's design system (colors, spacing, shadows) and component patterns.
---

# Design System Guidelines

The project uses a custom design system based on CSS variables defined in `src/index.css` and `src/design.css`.

## Core Variables

### Colors (DeepBlue Flow Palette)
- **Primary**: `var(--primary)` (#0077B6) - Main brand color.
- **Primary Dark**: `var(--primary-dark)` (#023E8A) - Used for gradients and hover states.
- **Secondary**: `var(--secondary)` (#90E0EF) - Accents and lighter elements.
- **Accent**: `var(--accent)` (#FFB703) - Highlights and important calls to action.
- **Status Green**: `var(--status-green)` (#22C55E) - Positive actions/states.
- **Status Red**: `var(--status-red)` (#EF4444) - Errors/Alerts.
- **Text Main**: `var(--text-main)` (#1E293B) - Primary text color.
- **Text Dim**: `var(--text-dim)` (#64748B) - Secondary text/descriptions.

### Spacing & Layout
- **Side Margin**: `var(--side-margin)` (40px) - Consistent padding for main containers.
- **Padding Class**: `.px-flow` - Applies the side margin padding.
- **Border Radius**:
    - `var(--radius-std)` (16px) - Standard cards/inputs.
    - `var(--radius-lg)` (24px) - Large containers/headers.
    - `var(--radius-pill)` (9999px) - Pills/Badges.

### Shadows & Depth
- **Card Shadow**: `var(--card-shadow)`
- **Card Border**: `var(--card-border)`

## Component Classes

### Cards
Use `.card-white` or `.flow-card` for standard card containers. They automatically handle background, padding, border-radius, and shadow.
```tsx
<div className="card-white">
  {/* Content */}
</div>
```

### Buttons
- **Primary**: `.btn-flow .btn-primary`
- **Icon Button**: `.btn-icon`
- **Back Button**: `.btn-back-flow`
- **Complete/Action Button**: `.btn-complete`

### Inputs
- **Text/Search**: `.search-input`
- **Photo Upload**: `.photo-dropzone`

### Typography
- Font Family: 'Inter', sans-serif.
- Gradient Header: `.header-gradient`

## Animations
- **Slide Up**: `.animate-slide-up`
- **Float**: `.float-animation`
