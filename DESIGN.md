---
version: alpha
name: Hồ sơ nguyên liệu
description: >
  Minimal industrial workspace for a Vietnamese factory raw-material management
  system. Three plants (NMXH, NMQM, NMCT). Daily-driver internal tool for
  warehouse, weighbridge, and QC staff on 6–8 hour shifts.

colors:
  # Alias required by the linter
  primary: "#1E40AF"

  # Backgrounds
  bg-page:          "#FAFAFA"
  bg-surface:       "#FFFFFF"
  bg-subtle:        "#F4F4F5"

  # Text
  text-primary:     "#0F172A"
  text-secondary:   "#475569"
  text-tertiary:    "#94A3B8"

  # Accent — one, used for primary actions, links, active selection
  accent:           "#1E40AF"
  accent-hover:     "#1D4ED8"
  accent-subtle:    "#EFF6FF"

  # Status — used only for state, never decoration
  success:          "#16A34A"
  success-subtle:   "#F0FDF4"
  warning:          "#D97706"
  warning-subtle:   "#FFFBEB"
  danger:           "#DC2626"
  danger-subtle:    "#FEF2F2"
  info:             "#1E40AF"
  info-subtle:      "#EFF6FF"

  # Borders
  border:           "#E5E7EB"
  border-strong:    "#D1D5DB"

  # Dark mode overrides (applied via [data-theme="dark"])
  dark-bg-page:     "#0A0A0A"
  dark-bg-surface:  "#141414"
  dark-bg-subtle:   "#1C1C1C"
  dark-text-primary:   "#FAFAFA"
  dark-text-secondary: "#A3A3A3"
  dark-text-tertiary:  "#737373"
  dark-accent:         "#3B82F6"
  dark-accent-hover:   "#60A5FA"
  dark-border:         "#262626"
  dark-border-strong:  "#404040"

typography:
  display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.01em

  h1:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.01em

  h2:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.35

  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4

  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5

  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5

  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4

  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4

  # Monospace — for IDs, plate numbers, codes, timestamps
  code-md:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5

  code-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  sm:   4px
  md:   6px
  lg:   12px
  full: 9999px

spacing:
  1:  4px
  2:  8px
  3:  12px
  4:  16px
  5:  20px
  6:  24px
  8:  32px
  10: 40px
  12: 48px

components:
  # Primary action — one per screen
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px

  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#FFFFFF"

  # Secondary — outlined, transparent fill
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px

  # Ghost — no border, hover only
  button-ghost:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: 36px

  button-ghost-hover:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-primary}"

  # Destructive — confirmations only
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: 36px

  # Form inputs
  input:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: 36px

  # Status badges — pill, low-saturation fill
  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "#166534"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 9px"

  badge-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "#92400E"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 9px"

  badge-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "#991B1B"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 9px"

  badge-info:
    backgroundColor: "{colors.info-subtle}"
    textColor: "#1E3A8A"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 9px"

  # Navigation sidebar
  nav-item:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: 36px

  nav-item-active:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"

  # Card surface
  page:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-primary}"
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"

  # Table header row
  table-header:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-secondary}"
  table-cell-hint:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"

  # Plant switcher pill in the header
  divider:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.border-strong}"
  plant-switcher:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    height: 32px

  plant-switcher-hover:
    backgroundColor: "{colors.border}"

  # Toast notifications
  toast:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.bg-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  toast-success:
    backgroundColor: "{colors.success}"
    textColor: "#FFFFFF"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  toast-warning:
    backgroundColor: "{colors.warning}"
    textColor: "#FFFFFF"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  toast-info:
    backgroundColor: "{colors.info}"
    textColor: "#FFFFFF"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"

  # Dark mode values — applied via [data-theme="dark"] CSS block in tokens.css.
  # Listed here so agents know the dark palette exists; not rendered as a UI component.
  dark-surface:
    backgroundColor: "{colors.dark-bg-surface}"
    textColor: "{colors.dark-text-primary}"
  dark-page:
    backgroundColor: "{colors.dark-bg-page}"
    textColor: "{colors.dark-text-primary}"
  dark-subtle:
    backgroundColor: "{colors.dark-bg-subtle}"
    textColor: "{colors.dark-text-secondary}"
  dark-accent-component:
    backgroundColor: "{colors.dark-bg-subtle}"
    textColor: "{colors.dark-accent}"
  dark-accent-hover-component:
    backgroundColor: "{colors.dark-bg-page}"
    textColor: "{colors.dark-accent-hover}"
  dark-border-component:
    backgroundColor: "{colors.dark-bg-page}"
    textColor: "{colors.dark-text-secondary}"
  dark-border-strong-component:
    backgroundColor: "{colors.dark-bg-page}"
    textColor: "{colors.dark-text-primary}"
---

# DESIGN.md — Hồ sơ nguyên liệu Web App

## Overview

**Minimal industrial workspace.** This is a daily-driver internal operations tool for Vietnamese factory staff — warehouse operators, weighbridge attendants, and quality-control inspectors — who spend 6 to 8 hours a day in this interface across three manufacturing plants.

The visual language draws from Linear's information density, Vercel dashboard's calm neutral surfaces, and Notion's data-view clarity. It is a tool, not a showcase. Every design decision optimises for scan-ability, low cognitive load over a long shift, and unambiguous operational state.

**What this is not:** a consumer SaaS product. No gradients, no glass, no playful curves, no decorative illustrations, no oversized hero type. The chrome (borders, headers, sidebars) is hairline. The data is the foreground.

The primary language is Vietnamese. All labels, states, empty messages, and status text are written in Vietnamese. Field names that are technical codes (plate numbers, tax codes, national IDs, slip numbers) are rendered in monospace.

The app spans three plants — NMXH, NMQM, NMCT — and the active plant is always visible in the header. This is the single most operationally important UI element outside of the data tables themselves.

## Colors

The palette is rooted in near-white surfaces and a single deep-blue accent. Status colors are the only other hues, and they are used exclusively to communicate state — never as decoration.

- **bg-page (`#FAFAFA`):** The page canvas. Slightly off-white to reduce eye strain over long shifts.
- **bg-surface (`#FFFFFF`):** Cards, panels, modals. Pure white to create a clear visual layer above the page.
- **bg-subtle (`#F4F4F5`):** Table header rows, sidebar hover states, secondary regions.
- **text-primary (`#0F172A`):** Near-black. Headlines, table cell content, form values — anything the user reads to make a decision.
- **text-secondary (`#475569`):** Labels, metadata, column headers. Supporting information.
- **text-tertiary (`#94A3B8`):** Placeholders, hints, disabled states, timestamps in dense views.
- **accent (`#1E40AF`):** Deep blue. The single accent color. Used for primary action buttons, active navigation items, links, selected rows, and focus rings. One per screen as a primary button; elsewhere used sparingly.
- **accent-hover (`#1D4ED8`):** Slightly lighter on hover — provides feedback without a large shift.
- **accent-subtle (`#EFF6FF`):** Very light blue tint for active nav item backgrounds and selected row backgrounds. Never used for text backgrounds.
- **success (`#16A34A`):** *Hoàn thành* (completed) status. Green badges, completion indicators.
- **warning (`#D97706`):** *Chờ lượt* (waiting) status. Amber badges, queue indicators.
- **danger (`#DC2626`):** *Hủy lượt* (cancelled) status. Red badges, error states.
- **info (`#1E40AF`):** *Đang xử lý* (in progress). Same as accent — in-progress state shares the accent because active processing is the expected productive state.
- **border (`#E5E7EB`):** Hairline borders everywhere. Provides separation without visual weight.

Status colors appear only as small badge fills (low-saturation), 2px left-border accents on callouts, and dot indicators. Never as full-saturation fills behind body text.

Dark mode inverts the surface and text layers and lightens the accent to maintain contrast. All dark-mode values are prefixed `dark-` in the token set above and applied via `[data-theme="dark"]`.

## Typography

Two typefaces only.

**Inter** handles all prose, labels, navigation, table cells, and headings. Weights 400 and 500 only — 600 and above feel too heavy against the soft neutral palette. Sentence case everywhere, including buttons and menu items. Never all-caps, never mid-sentence bold.

**JetBrains Mono** is used exclusively for data that looks like a code: vehicle plate numbers (`51G-123.45`), national IDs (CCCD), tax codes (MST), weighing slip numbers, row IDs, and timestamps in dense table views. Mono distinguishes these fields visually at a glance, which matters when staff are reading a screen under time pressure.

Vietnamese diacritics must render clearly at all sizes. Inter handles this well; confirm at 13px on both light and dark surfaces.

The type scale is tight: `12 / 13 / 14 / 16 / 18 / 22 / 28px`. The `display` size (28px) is reserved for dashboard metric numbers only. Page titles use 22px. Everything operational runs at 13–14px.

## Layout

**App shell:** Left sidebar (240px expanded, 56px collapsed icon-only) plus a 56px top header, both fixed. Content area scrolls. Maximum content width 1440px — lists and dashboards fill the width, forms cap at 720px.

**Header contents (left → right):** Logo and app name; plant switcher (the operational context pill — always visible, always prominent); global search (`⌘K`); notification bell; user avatar with dropdown.

**Sidebar:** Navigation items with Lucide outline icons (16px) and Vietnamese labels. Active item: accent-colored 2px left border plus `bg: accent-subtle`, `text: accent`. Hover: `bg: bg-subtle`. Collapsing the sidebar hides the labels and centers the icons.

**Content padding:** 24px desktop, 16px mobile. Generous — this is not a tight mobile-first layout.

**Responsive breakpoints:**
- Desktop (1280px+): Full sidebar, full tables, multi-column forms where appropriate.
- Tablet (768–1279px): Sidebar auto-collapses to icons. Tables stay as tables.
- Mobile (<768px): Sidebar becomes a slide-out drawer. Tables become card lists. Forms single-column. Photo capture and weighing flows are mobile-optimised within those specific screens.

## Elevation & Depth

No shadows. Depth is created exclusively through:
- **Background contrast:** Page (`bg-page`) → surface (`bg-surface`) → subtle (`bg-subtle`).
- **Borders:** 1px hairline at `border` color.
- **z-index stacking:** Header and sidebar above content; dropdowns and popovers above those; modals above everything.

Adding `box-shadow` anywhere is a design violation. If separation is needed, add a border.

## Shapes

Four radii only. Consistent, not excessive.
- `sm` (4px): Inline badges, small chips.
- `md` (6px): Inputs, buttons, dropdown items, table row selections.
- `lg` (12px): Cards, modals, toasts, popovers.
- `full` (9999px): Pill-shaped elements — status badges, the plant switcher, avatar.

## Components

### Buttons
One primary button per screen. All others are secondary or ghost. No stacking of two filled buttons in the same view.

- **Primary:** Filled `accent`, white text, 36px height. The single "call to action" on each screen.
- **Secondary:** Transparent fill, `border` outline, `text-primary` text. For co-equal actions.
- **Ghost:** No border, no fill. Hover reveals `bg-subtle`. For tertiary/contextual actions.
- **Destructive:** Filled `danger`, white text. Appears only on confirmation dialogs.

No button ever has a shadow.

### Inputs
36px tall, `border` hairline, `rounded-md`. Label above (13px, `text-secondary`). Helper/error text below (12px). Focus ring: 2px `accent` at 30% alpha — visible but not aggressive. Disabled: 50% opacity.

### Tables
The workhorse component. Used on almost every list screen.
- Sticky header: `table-header` background, `text-secondary` labels, `label` typography.
- No zebra striping. Hairline row separators only.
- Row hover: full-row `bg-subtle` tint, pointer cursor.
- Click row to open detail. Right-click for context menu with quick actions.
- Virtualized scroll for lists over 50 rows.
- Column sort: click header to toggle; small chevron icon indicates direction.
- Mobile: tables collapse to card lists — one card per row, tap to expand.

### Status badges
Low-saturation pill. 12px text, 2px/9px padding, `rounded-full`. Background is the subtle variant of the status color; text is the full status color. Four states map to the four cargo statuses: info (in progress), warning (waiting), success (completed), danger (cancelled).

### The plant switcher
A pill-shaped button in the header. Shows the active plant's short name + chevron. Click opens a popover listing accessible plants, each with the user's role at that plant and a checkmark on the active one. Switching is immediate — no page reload. Single-plant users see the pill but the chevron is hidden and the button is non-interactive. **This element must always be visible and unambiguous — it is the operational context for everything else on screen.**

### Cards
Hairline border, `rounded-lg`, 16px padding, `bg-surface`. No shadow. Used for detail panels, metric tiles on the dashboard, and confirmation dialogs.

### Tabs
Underline style, no pill backgrounds. Active tab: 2px `accent` bottom border, 500 weight, `text-primary`. Inactive: `text-secondary`, no underline. Used to split busy detail screens (cargo detail has four tabs: Tổng quan / Cân hàng / Hình ảnh / Giám sát).

### Toasts
Bottom-right, `rounded-lg`, auto-dismiss after 4 seconds. `text-primary` (near-black) background, `bg-surface` text — inverted from the surface for contrast. Optional undo action inline. Status variant adds a 2px left-border in the status color.

### Empty states
Every empty state: one Lucide outline icon (40px, `text-tertiary`), one Vietnamese sentence (matter-of-fact, no exclamation marks), one optional secondary action. No illustrations, no decorative imagery.

### Loading states
Skeleton blocks that match the shape of the loaded content — table rows get row-height skeletons, cards get card-shaped skeletons. Never a full-page bare spinner. Inline spinner only for button-loading states ("Đang lưu..."). Skeleton pulse: very subtle, ~1.5s cycle.

## Do's and Don'ts

**Do:**
- Use sentence case for all text, labels, and buttons.
- Use monospace (`code-md` or `code-sm`) for plate numbers, IDs, MST codes, slip numbers, and timestamps in dense views.
- Keep the plant switcher always visible in the header.
- Show one primary button per screen.
- Derive all colors, fonts, spacing, and radii from tokens — never hardcode.
- Write all UI copy in Vietnamese, with full diacritics.
- Use status colors only for state communication (badges, dot indicators, 2px left-borders on callouts).
- Respect `prefers-reduced-motion` — all transitions are 150–200ms, no spring physics.

**Don't:**
- Use `font-weight: 600` or above anywhere.
- Add `box-shadow` to any element.
- Use more than one primary (filled accent) button per view.
- Use gradient backgrounds, glass/blur effects, or rounded-corner radii above 12px.
- Use status colors as full fills behind body text.
- Hardcode any hex value in a component — reference a token.
- Add decorative illustrations to empty states.
- Use emoji as UI elements or navigation icons.
- Use all-caps or title-case in labels and buttons.
