# Design Brief — Hồ sơ nguyên liệu Web App

A modern internal web app for managing raw-material (forest product) cargo intake at factory sites in Vietnam. Replaces an aging AppSheet app. Used daily by operations staff, weighbridge operators, quality-control inspectors, and managers across three factory plants.

---

## The user and the context

The people using this app are on their feet at a weighbridge, in a quality-control booth, or at a manager's desk. Shifts run six to eight hours. Each plant processes dozens of trucks a day, and the same screens are looked at hundreds of times. **Calm, scannable, and fast** beats expressive every time.

Primary language is **Vietnamese**, with full diacritics. Some fields use technical codes (plate numbers, tax codes, national ID numbers) that should read as monospace.

The app is **desktop-primary** — weighbridge and reception are fixed workstations on 1280–1920 px screens. Mobile support matters for field photo capture and supervisor walk-arounds, but should not compromise desktop density.

---

## Design direction

**Minimal industrial workspace.** Think Linear's clarity, Vercel's restraint, and Notion's data-view density — tuned for an operational tool rather than a creative one. No gradients, no glass, no playful curves. The aesthetic is "serious productivity software," not "consumer SaaS."

The visual language should:

- Feel **calm**: lots of whitespace, no decorative noise, generous line spacing.
- Feel **dense where it counts**: tables and lists are the workhorse; they should fit many rows on screen without feeling cramped.
- Feel **modern**: hairline borders, soft neutrals, a single accent color used sparingly.
- Feel **tool-like, not branded**: this is software people use, not a brochure. No marketing hero sections, no oversized type, no decorative illustrations.

Avoid: gradient backgrounds, drop shadows on cards, glass/blur effects, rounded-corner extremes, oversized headings, mid-sentence bold, full-saturation colors, emoji as UI elements, illustration-heavy empty states.

---

## Design tokens

**No color, font size, spacing, radius, or transition value is hardcoded in any component.** All values reference semantic CSS custom properties (design tokens). This is what makes the app themeable — swap a theme by swapping token values, not by editing components.

### Token structure

Tokens have two tiers. Components only ever touch semantic tokens (tier 2).

```css
/* ─── Tier 1: Primitives — named raw values, never used in components ─── */
--blue-400: #60A5FA;  --blue-500: #3B82F6;
--blue-700: #1D4ED8;  --blue-800: #1E40AF;
--slate-400: #94A3B8; --slate-600: #475569; --slate-900: #0F172A;
--neutral-50: #FAFAFA; --neutral-400: #A3A3A3; --neutral-600: #737373;
--neutral-800: #262626; --neutral-900: #141414; --neutral-950: #0A0A0A;
--green-600: #16A34A; --amber-600: #D97706; --red-600: #DC2626;
--white: #FFFFFF;

/* ─── Tier 2: Semantic tokens — what components reference ─── */
:root {
  --color-bg-page:        var(--neutral-50);
  --color-bg-surface:     var(--white);
  --color-bg-subtle:      var(--neutral-100);

  --color-text-primary:   var(--slate-900);
  --color-text-secondary: var(--slate-600);
  --color-text-tertiary:  var(--slate-400);

  --color-accent:         var(--blue-800);
  --color-accent-hover:   var(--blue-700);
  --color-accent-subtle:  var(--blue-50);

  --color-success:        var(--green-600);
  --color-warning:        var(--amber-600);
  --color-danger:         var(--red-600);
  --color-info:           var(--color-accent);

  --color-border:         var(--slate-200);
  --color-border-strong:  var(--slate-300);

  --color-table-header-bg: var(--neutral-50);

  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-sm: 4px; --radius-md: 6px;
  --radius-lg: 12px; --radius-full: 9999px;

  --duration-fast: 150ms; --duration-normal: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}

/* Dark mode — semantic tokens only; primitives unchanged */
[data-theme="dark"] {
  --color-bg-page:        var(--neutral-950);
  --color-bg-surface:     var(--neutral-900);
  --color-bg-subtle:      var(--neutral-800);
  --color-text-primary:   var(--neutral-50);
  --color-text-secondary: var(--neutral-400);
  --color-text-tertiary:  var(--neutral-600);
  --color-border:         var(--neutral-800);
  --color-border-strong:  var(--neutral-700);
  --color-accent:         var(--blue-500);
  --color-accent-hover:   var(--blue-400);
  --color-table-header-bg: var(--neutral-900);
}
```

**Adding a new theme** means adding one `[data-theme="name"]` block. Zero component changes.

### Palette intent

The default theme uses:
- **Backgrounds**: near-white page (`--color-bg-page`), pure white surfaces (`--color-bg-surface`)
- **Text**: near-black primary, mid-grey secondary, light-grey tertiary
- **Accent**: deep blue — one accent, used for primary actions, links, and active selection only
- **Status**: green for completed, amber for waiting, red for cancelled, blue (same as accent) for in-progress. Status colors appear as small badges, dot indicators, or 2px left-borders — never as full background fills behind text.

---

## Typography

- **Sans**: Inter. Weights 400 and 500 only — never 600 or above. They feel heavy against the soft palette.
- **Mono**: JetBrains Mono. Used exclusively for IDs, codes, plate numbers, tax codes, national ID numbers, timestamps.
- **Sizes**:
  - 13 px — secondary text, table cells, badges
  - 14 px — body, form labels, button text
  - 16 px — emphasized body
  - 18 px — section titles
  - 22 px — page titles
  - 28 px — dashboard stat numbers
- **Line height**: 1.5 for body, 1.3 for headings.
- **Sentence case everywhere**, including buttons. Never Title Case, never ALL CAPS.
- **No mid-sentence bolding** in body text.

Vietnamese diacritics must render cleanly at all sizes — Inter handles this well.

---

## Layout

### App shell
- **Left sidebar**, 240 px expanded / 56 px collapsed. Collapsible by a header icon button.
- **Top header**, 56 px tall, full width. Sticky.
- **Content area**, padded 24 px on desktop, 16 px on mobile. Max content width 1440 px; lists and dashboards can go edge-to-edge, forms cap at 720 px.

### Header contents (left to right)
1. Logo + app name (compact, single line)
2. Plant switcher — this is critical, see below
3. Global search input (`⌘K` shortcut, expandable)
4. Notification bell (with count badge if unread)
5. User avatar + dropdown menu

### Sidebar contents
Vertical list of navigation items, each with a Lucide outline icon (16 px) + Vietnamese label. Active item gets a 2 px accent left-border and accent-tinted background. Hover gets a subtle background tint.

Navigation labels (in Vietnamese):
- Trang chủ — home
- Xe hàng — cargo
- Phiếu cân — weighing slips
- Hồ sơ rừng — plot registry
- Nhà cung cấp — suppliers
- Nguyên liệu — materials
- Tài xế — drivers
- Báo cáo — reports
- Cài đặt — settings (gated by role)

---

## The plant switcher (header element)

This is the most important non-obvious UI element. Three factory plants exist (NMXH, NMQM, NMCT); users may have access to one or more, with different roles in each. The active plant scopes every screen in the app.

**Design**: a pill-shaped button in the header showing the active plant's short name and a chevron. Click opens a popover with a list of accessible plants — each row shows plant name, the user's role at that plant, and a checkmark for the active one. Switching is instant; no full reload. If the user has access to only one plant, the pill is non-interactive (chevron hidden) but still visible for clarity.

---

## Components

Use shadcn/ui as the base library where possible. The non-negotiables below override defaults when they conflict.

### Buttons
- **Primary**: filled accent, white text, 36 px tall, 12 px horizontal padding, 8 px radius. One primary per screen.
- **Secondary**: transparent fill, hairline border, primary text color. Same height/padding.
- **Ghost**: no border, no fill, accent-tinted hover. For tertiary actions.
- **Destructive**: red fill, white text. Only on confirm screens.
- No shadows on any button.

### Inputs (text, select, textarea, date)
- 36 px tall, hairline border, 6 px radius.
- Label above the input (13 px, secondary text color). Helper or error text below (12 px).
- Focus: 2 px accent ring at 30% alpha. No glow.
- Disabled state: 50% opacity, no border darken.

### Tables
- Sticky header row with subtle background tint (`var(--color-table-header-bg)`).
- Zebra striping **off** by default. Hairline row separators only.
- Hover row: full-row tint, cursor pointer.
- Sort by clicking column header — show a small chevron when sorted.
- Click row to open detail. Right-click for context menu.
- For long lists (>50 rows): virtualized scroll with the header staying pinned.
- Column widths: sized to content, with the most important column getting flex-grow.
- On mobile: tables collapse to card lists — one card per row, key fields stacked, tap to open detail.

### Tabs
- Underline style, no pill backgrounds.
- Active tab: accent underline (2 px) + 500 weight text.
- Inactive: secondary text color, hairline-only underline.
- Used for splitting busy detail screens (e.g. cargo detail has Tổng quan / Cân hàng / Hình ảnh / Giám sát).

### Cards
- Hairline border, 12 px radius, 16 px padding.
- No shadows, ever. The border provides separation.
- Card title (if any): 14 px medium weight, top-aligned, with optional secondary action top-right.

### Badges (used for status)
- Small pill, 11 px text, 4 px vertical / 9 px horizontal padding.
- Background uses the 50-stop of the status color (~10% saturation), text uses the 800-stop. Never high-saturation fills.

### Modals and dialogs
- Used sparingly. Most edits open inline or in a right-side panel that slides over the content (not a true modal).
- True modals (centered overlay) only for confirmations and short focused tasks.
- 480 px default width, white surface, hairline border, 12 px radius.

### Toasts
- Bottom-right, auto-dismiss after 4 seconds.
- Single line of text + optional undo button.
- Status colors as a 2 px left-border accent, not full fills.

### Tooltips
- Dark background (`var(--color-bg-tooltip, var(--neutral-950))`), white text, 12 px, small. Appears on hover after 400 ms.

### Empty states
Every empty state has the same three-part structure:
1. A single Lucide outline icon, 40 px, tertiary text color.
2. A one-line message in Vietnamese, matter-of-fact tone. No "Whoops!" or exclamation marks.
3. An optional secondary button for the most likely next action.

No illustrations. No decorative imagery.

### Loading states
- Skeleton blocks matching the layout of the loaded content (table rows = row-shaped skeletons; cards = card-shaped). Never a bare spinner on a full page.
- Inline spinner only for in-button loading (e.g. "Saving...").
- Skeleton color: very subtle pulse between two close neutrals; ~1.5 s cycle.

### Error states
- Inline: red text below the input, with a small icon.
- Full-screen (e.g. data fetch failed): centered card with a Lucide outline icon, one-line cause, a retry button.
- Toast for transient/background errors.

---

## Iconography

Lucide icons throughout. Outline style only — never filled variants. 16–20 px inline; 24 px max for decorative use.

Every icon is paired with a label, except icon-only buttons (which get `aria-label` and a tooltip). No emoji as UI elements.

---

## Motion

- 150 ms ease-out for state changes (tab switches, expand/collapse, hover transitions, popovers opening).
- 200 ms ease-out for panels sliding in.
- No spring physics. No bouncy effects. No parallax.
- Respect `prefers-reduced-motion`.

---

## Responsive behaviour

- **Desktop (1280+ px)**: full sidebar, full tables, multi-column forms where appropriate.
- **Tablet (768–1279 px)**: sidebar auto-collapses to icons. Tables remain as tables. Forms become single-column.
- **Mobile (under 768 px)**: sidebar becomes a slide-out drawer behind a hamburger icon. Tables become card lists. Plant switcher remains in the header. Photo capture flows are mobile-optimized — large capture buttons, full-bleed previews.

---

## Accessibility

- WCAG AA contrast on every text/background combination.
- Visible focus rings on all interactive elements — 2 px accent at 30% alpha.
- All form errors announced via `aria-live`.
- All non-decorative icons have `aria-label`.
- Keyboard reachable: every action achievable without a mouse.
- `⌘K` / `Ctrl K` opens global search; `Esc` closes any popover or modal.

---

## Key screens to design

These are the visually load-bearing screens. If you design these well, the rest of the app inherits naturally.

### 1. Home dashboard
Top of the app for the active plant. Today's stats (cargo waiting, in progress, completed today, cancelled) as four metric cards across the top. Below: a 30-day trend chart (line, 200 px tall) and a recent activity feed (scrollable list of latest cargo events).

### 2. Cargo list — the daily workhorse
The screen users see most. Table view with filter chips at the top (Chờ lượt / Đang xử lý / Hoàn thành / Hủy lượt — each chip shows a count badge), search input, date-range filter. Table columns: plate number (mono), driver name, material, primary supplier, status badge, created at. Sticky header. Click row to open detail.

### 3. Cargo detail
Tabbed layout with a header summary card (plate, driver, status badge, key timestamps) and four tabs: Tổng quan (overview), Cân hàng (weighing), Hình ảnh (photos), Giám sát & hoàn thành (monitoring & completion). Each tab content area is independent — see them as four sub-screens.

### 4. Weighing slip entry
A focused form with two main sections: Cân vào (weigh-in) and Cân ra (weigh-out). Each has time, weight (large mono input), and an optional photo of the scale display. Net weight is computed and shown prominently between them. A primary "Hoàn tất phiếu cân" button at the bottom.

### 5. Plot registry — list + map toggle
A toggle between table view and map view. Map uses a neutral basemap (e.g. CARTO Positron), plot boundaries as filled polygons colored by deforestation-risk status, click to open plot detail in a right-side panel.

### 6. Suppliers — primary with secondaries
Detail screen showing supplier identification at the top, then a section "Nhà cung cấp phụ" (secondary suppliers) as an inline list with quick-add row.

### 7. Reports / CSV export
A builder with filter inputs at the top (plant scoped automatically; date range, status, supplier, material). Below, a preview table of matching rows with a count and a "Tải CSV" (download CSV) primary button.

---

## What "done" looks like visually

When the first screens are designed, they should:

- Feel like the same family as Linear, Vercel dashboard, or Notion's database views — not like a consumer SaaS landing page, and not like a Material Design admin template.
- Read as Vietnamese-native — all labels, all states, all empty messages.
- Survive being looked at for six hours straight without fatigue.
- Make the active plant unambiguous at all times (the switcher is always visible and styled distinctly).
- Show data, not chrome. The chrome (borders, headers, sidebars) is hairline; the data is the foreground.

---

## Reference moodboard

Pull visual inspiration from:
- **Linear** (linear.app) — for spacing, density, the sidebar pattern, table styling.
- **Vercel dashboard** (vercel.com/dashboard screenshots) — for the calm neutral palette, the way data sits on the page.
- **Notion database views** — for the table interactions and inline editing patterns.
- **Stripe dashboard** — for status badges, filter chips, and form clarity.

Avoid drawing visual inspiration from: consumer SaaS marketing pages, dashboard templates on Dribbble, anything described as "playful" or "delightful."
