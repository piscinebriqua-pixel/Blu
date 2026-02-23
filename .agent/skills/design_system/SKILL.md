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
| Card titles / names | `text-base font-black` | **16px** |
| Descriptions / body text | `text-base` | **16px** |
| Form labels / Category labels | `text-[13px] font-bold` | **13px** |
| Badges, status pills | `text-xs` | **12px** |

### ❌ Forbidden Classes
- `text-[8px]` to `text-[10px]` — **NEVER USE**
- `text-xs` — Avoid for body text, only for small badges/pills.
- `text-sm` — Avoid for main content, prefer `text-base` (16px).

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

#### Rule 1 — Labels on colored/gradient backgrounds (stat cards, headers)
Labels displayed on blue, violet or dark gradient backgrounds **must be clearly visible**. Never use low-opacity white text as a label on a colored card.

```tsx
// ✅ Correct — label clearly legible on gradient
<span className="text-xs font-bold text-white/90 uppercase tracking-widest">AUJOURD'HUI</span>

// ❌ Wrong — disappears on gradient background, especially in sunlight
<span className="text-[11px] font-bold text-white/50 uppercase">AUJOURD'HUI</span>
```

**Rules for on-gradient labels:**
- Minimum opacity: `text-white/80` (never below `text-white/70`)
- Minimum size: `text-xs` (12px)
- Font weight: `font-bold` minimum — never `font-normal` on a colored bg
- Always use `uppercase tracking-widest` for label-style caps text

#### Rule 2 — Secondary info text on white cards (technician, date, meta)
Text like technician names, dates, and metadata inside white cards must be legible even in bright outdoor conditions.

```tsx
// ✅ Correct — uses slate-500 (not 400) with text-sm
<span className="text-sm font-semibold text-slate-500">WALID · 21/02</span>

// ❌ Wrong — slate-400 + text-xs = nearly invisible outdoors
<span className="text-xs text-slate-400">WALID · 21/02</span>
```

**Rules for secondary card info:**
- Minimum color: `text-slate-500` (never `text-slate-300` or `text-slate-400` for readable content)
- Minimum size: `text-sm` (14px)
- For muted metadata (pure decorative): `text-slate-400` is acceptable only if `text-sm` or larger
- Icon + text combos (clock, user, location): icon must be at least `size={14}`, never `size={10}` or `size={12}`

#### Rule 3 — General opacity rule
- Text opacity must never go below **70%** for any readable label
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
