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
- **Status Green (Done)**: `emerald-500` / `emerald-600` - Used for "Completed" interventions and positive balances.
- **Status Blue (Todo)**: `blue-500` / `blue-600` - Used for "Scheduled" tasks.
- **Status Red**: `var(--status-red)` (#EF4444) - Errors/Alerts/Debt.
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

### Glassmorphism (Premium UI)
Used for floating headers, filter bars, and view switchers.
- **Base**: `bg-white/10` or `bg-black/20` (depending on background).
- **Blur**: `backdrop-blur-xl` or `backdrop-blur-md`.
- **Border**: `border border-white/10` or `border-white/5`.
- **Shadow**: `shadow-2xl shadow-black/10`.

## Mobile Typography Standards (MANDATORY)

This application runs primarily on **smartphones**. Every component you create must respect the following minimum sizes. These are non-negotiable — violating them breaks usability on mobile.

### Minimum Font Sizes (New Standard 2026)

| Element | Tailwind Class | Minimum Size | Usage |
|---|---|---|---|
| Main Titles | `text-2xl font-black` | **24px** | Page headers, large sections |
| Section Titles | `text-xl font-black` | **20px** | Card titles, group headers |
| Standard content | `text-lg` | **18px** | Primary info, client notes |
| Form labels / Categories | `text-[14px] font-black` | **15px** | Input labels, group headers |
| Data-dense labels | `text-[12px] font-black` | **12px** | Dashboard indicators, micro-metadata |
| Status badges | `text-sm font-black` | **14px** | Tags and pills |

### ❌ Forbidden Classes (Zero Tolerance)
- `text-[8px]` to `text-[11px]` — **STRICTLY FORBIDDEN**. Content must be legible without squinting.
- `text-xs` — Avoid for readable content; use `text-sm` minimum.
- `text-slate-400` on white bg — Use `text-slate-500` minimum for contrast.

### Premium Form Element Sizes (Standard vs. Search/Action)

For the best mobile experience and visibility, use these sizes for form elements:

| Element | Font Size | Height | Usage |
|---|---|---|---|
| **Search/Select (Combobox)** | **18px (font-black)** | **72px (h-[72px])** | Searchable clients, technical selections |
| **Dropdown Options** | **15px (font-black)** | **N/A** | Items inside a list/search result |
| **Standard Input** | **16px (font-bold)** | **56px (h-14)** | Simple fields (notes, names) |
| **Date Input** | **16px (font-black)** | **56px (h-14)** | Dates (use `.cursor-pointer`) |

### Inputs: Prevent iOS Auto-Zoom & Maximize Visibility

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
- **Text/Search**: `.search-input` (Standard). For premium searchable selections, use the `Combobox` component.
- **Photo Upload**: `.photo-dropzone`

### Combobox Standards
When using the `Combobox` component for searchable selections:
- **Font**: Always use `font-black text-[18px]` for the main input.
- **Dropdown**: Always use `font-black text-[15px]` for selection options.
- **Searchability**: Every dropdown with more than 5 items **MUST** be searchable.
- **Accessibility**: Support `showPicker()` for date inputs via `onClick`.

### Typography
- Font Family: 'Inter', sans-serif.
- Gradient Header: `.header-gradient`

## Animations
- **Slide Up**: `.animate-slide-up`
- **Float**: `.float-animation`

## Empty States & Compact Action Cards (Zero-Waste Mobile Layout)

To avoid wasting critical vertical space on mobile devices, never render large empty cards with vertical spacing and a single icon. Use the **Compact CTA Pattern (Solution A)** instead:

### Rules:
1. **Empty State Height**: Never exceed `56px` for a secondary empty state card.
2. **Interactive Target**: The entire banner must be a clickable button with `min-h-[52px]` and touch feedback (`active:scale-[0.99]`).
3. **Visual Style**:
   - `border-2 border-dashed border-slate-200/90 hover:border-blue-500/80 dark:border-slate-700`
   - Background: `bg-white dark:bg-slate-800/60`
   - Icon box: `w-10 h-10 rounded-xl bg-blue-50 text-blue-600`
   - Action label: `text-xs font-black uppercase tracking-wider`
   - Helper text: `text-xs font-semibold text-slate-500`
   - Trailing plus pill: `w-8 h-8 rounded-lg bg-slate-100 text-slate-500`

### Pattern Template:
```tsx
{items.length > 0 ? (
  <div className="card-bento p-6">
    {/* Full list content when data exists */}
  </div>
) : (
  <button
    type="button"
    onClick={onOpenCreateOrAssignModal}
    className="w-full min-h-[52px] p-3.5 rounded-2xl border-2 border-dashed border-slate-200/90 hover:border-blue-500/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3 text-left transition-all group shadow-sm active:scale-[0.99]"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <UserPlus size={18} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider group-hover:text-blue-600">
          + Assigner un intervenant / tiers-payant
        </p>
        <p className="text-xs font-semibold text-slate-500 truncate">
          Aucun intervenant associé au projet
        </p>
      </div>
    </div>
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
      <Plus size={16} strokeWidth={2.5} />
    </div>
  </button>
)}
```
