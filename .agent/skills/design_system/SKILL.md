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

## Mobile Typography Standards (MANDATORY)

This application runs primarily on **smartphones**. Every component you create must respect the following minimum sizes. These are non-negotiable — violating them breaks usability on mobile.

### Minimum Font Sizes

| Element | Tailwind Class | Minimum Size |
|---|---|---|
| Card titles / names | `text-base` | **16px** |
| Descriptions / body text | `text-sm` | **14px** |
| Form labels | `text-xs` | **12px** |
| Badges, status pills | `text-[11px]` | **11px** |

### ❌ Forbidden Classes
- `text-[8px]` — **NEVER USE** — illegible on any device
- `text-[9px]` — **NEVER USE** — illegible on any device
- `text-[10px]` — **NEVER USE** — too small for mobile, use `text-xs` (12px) instead

### Inputs: Prevent iOS Auto-Zoom
Always use `text-base` (16px) on `<input>`, `<select>`, and `<textarea>`. If font-size is below 16px, iOS Safari automatically zooms in on the field — this breaks the layout and UX.

```tsx
// ✅ Correct
<input className="... text-base" />

// ❌ Wrong — triggers iOS zoom
<input className="... text-sm" />
```

### Touch Target Sizes
All interactive elements (buttons, links, icons) must have a **minimum tap area of 44×44px** (Apple HIG standard / Google Material 48px).

```tsx
// ✅ Icon button — visually small, but 44px tap area
<button className="w-11 h-11 flex items-center justify-center ...">
  <Edit2 size={16} />
</button>

// ❌ Wrong — 32px tap target, too small for fingers
<button className="w-8 h-8 ...">
  <Edit2 size={14} />
</button>
```

### Contrast & Opacity
- Text opacity must never go below **70%** for secondary labels
- Never combine `text-slate-400` with a font size below `text-xs`
- On dark backgrounds, prefer `text-white/80` over `text-slate-400`


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
