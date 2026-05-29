# Handoff: Trang chủ (Home Dashboard) Screen

## Overview
The main dashboard screen of **Hồ sơ nguyên liệu** — a raw-material traceability app for forestry/timber processing plants. The home screen gives plant managers and operators a combined analytics + operations overview: live queue counts, per-material tonnage breakdown, a 14-day stacked intake chart, top suppliers, activity feed, and a forest-plot risk summary.

All UI copy is in **Vietnamese** — keep it verbatim.

## About the Design Files
The files in `reference/` are **design references created as an in-browser React prototype** (TSX compiled with Babel standalone). They are *not* production code to copy directly. Your task is to **recreate this screen in our real codebase** using our existing stack (React + TypeScript `.tsx`), our component library, design-token system, and conventions. Use the prototype as the source of truth for **layout, behavior, copy, and exact visual values**, then express it with our own primitives.

## Fidelity
**High-fidelity.** Colors, typography, spacing, interactions, and copy are final. Recreate pixel-faithfully, mapping values onto our design-token system wherever equivalents exist.

---

## Screenshots
In `screenshots/`:
- **`01-home-full.png`** — full dashboard in the default 30-day period view.
- **`02-home-chart-hover.png`** — the stacked bar chart with hover tooltip active.

---

## Screen Layout

### Page dimensions & chrome
The screen sits inside a shell: a collapsible left sidebar (230px expanded / 52px collapsed) + a top header bar (56px). The content area fills the remaining viewport with an internal scroll. The home screen uses `padding: 24px; max-width: 1440px; margin: 0 auto` and is a vertical stack of sections separated by `12px` gaps.

### 1. Page header
Flex row, `align-items: flex-end`, `justify-content: space-between`, `margin-bottom: 20px`.

- **Left side:**
  - Eyebrow (13px, `--text-2`): today's date in `DD/MM/YYYY` format (mono) · plant name.
  - H1 (22px / weight 500 / `--text-1`, `margin: 4px 0 0`, `line-height: 1.3`): `Tổng quan hôm nay`.
- **Right side:** primary button `[+ Tạo phiếu cân]` (icon `plus`) → navigates to the weighing (`phiếu cân`) screen.

---

### 2. KPI strip
`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px`.
Four **MetricCard** components, left to right:

| # | Label | Value source | Tone | Delta | Sparkline |
|---|-------|-------------|------|-------|-----------|
| 1 | `Chờ lượt` | `DASH_STATS.waiting` (integer) | warning | `+8%` | `[3,4,3,5,6,5,7]` |
| 2 | `Đang xử lý` | `DASH_STATS.inProgress` | info | `-3%` | `[6,5,7,8,6,7,6]` |
| 3 | `Hoàn thành hôm nay` | `DASH_STATS.completed` | success | `+12%` | `[8,9,7,10,9,11,12]` |
| 4 | `KL tịnh hôm nay` | `netTodayKg / 1000` (1 dp, suffix `tấn`) | success | `+9%` | `[110,95,120,140,118,135,142]` |

#### MetricCard anatomy
Card `padding: 16px` with:
- Top row (flex `space-between`): label (13px `--text-2`) + optional tone dot (6×6px circle, `background: var(--{tone})`, `margin-top: 8px`).
- Value row (`margin-top: 6px`): value in **mono** (28px / weight 500 / `--text-1` / `line-height: 1.1`) + optional suffix (13px `--text-3`).
- Bottom row (`margin-top: 8px`, `font-size: 12px`, flex `space-between`): delta chip (left) + sparkline SVG (right).
- **Delta chip:** `display: inline-flex; align-items: center; gap: 3px`. Colors: positive = `--success` / trending-up icon; negative = `--danger` / trending-down; zero = `--text-3` / minus. Format: `+N%` / `-N%` followed by `vs hôm qua` (non-bold, `--text-3`).
- **Spark:** polyline SVG, `width: 64px; height: 20px`. stroke = `var(--accent)`, stroke-width 1.25, round caps/joins. Y-axis normalised to min-max of the values array, with 1px bottom margin.

---

### 3. Material accumulation card
Full-width card, `padding: 20px`, `margin-bottom: 12px`.

**Card header** (flex `space-between`, `margin-bottom: 16px`):
- Left: row with `package-2` icon (14px, `--accent`) + title `Sản lượng nguyên liệu nhập vào` (14px / weight 500). Below: headline number row:
  - **Big number** (mono, 32px / weight 500 / `--text-1`): total kg ÷ 1000, 1 dp.
  - Suffix `tấn` (14px `--text-2`).
  - Trend pill (padding `3px 10px`, radius 999, `--success-bg` / `--success-text`): `trending-up` icon (11px) + `+8.4%` (mono, 11px / weight 500).
  - Sub-line (12px `--text-3`, `margin-top: 4px`): `{count} lượt giao · {nMaterials} loại nguyên liệu · trung bình {avg} tấn/lượt` (avg = total/count in mono).
- Right: **period segmented control** (`padding: 2px`, `background: --surface-tint`, `border-radius: 8px`, `border: 1px solid --border`). Three buttons `7N` / `30N` / `90N` (mono, 12px), `height: 28px; padding: 0 12px; border-radius: 6px`. Active button: `background: --surface`, `--text-1`, weight 500, `box-shadow: 0 0 0 1px var(--border) inset`.

**Table header row** (6-column grid: `140px 1fr 110px 100px 90px 80px`, `gap: 16px`):
Columns: `Nguyên liệu` | `Tỷ trọng` | `Khối lượng` | `Lượt giao` | `Thay đổi` | `14N`.
11px `--text-3`, `padding: 8px 0`, bottom border `1px solid --border`.

**Table rows** — one per material, same 6-column grid, `padding: 12px 0`, bottom border, `font-size: 13px`:
1. **Nguyên liệu**: 8×8px rounded-2 colour swatch + material name (`--text-1`), clipped with ellipsis.
2. **Tỷ trọng**: horizontal bar (flex-1, height 8, radius 4, `--surface-tint` bg / `1px --border`) filled to `kg/max` % in the material's colour at `opacity: 0.85`, plus share % (12px mono `--text-2`, min-width 42, right-aligned) at the right.
3. **Khối lượng**: `{value}` mono weight 500 `--text-1` + ` tấn` in 11px `--text-3`.
4. **Lượt giao**: count mono + ` lượt` 11px `--text-3`.
5. **Thay đổi**: trending icon (11px) + `±N%` mono weight 500, coloured by sign (success / danger / text-3).
6. **14N**: sparkline `Spark` (width 72, height 22), stroke = material colour.

**Period switching** swaps the whole dataset (see *State* below).

#### Material colour palette
```
Keo lai    → var(--accent)   #1E40AF  
Cao su     → #059669  
Điều       → #D97706  
Tràm nước  → #0891B2  
Bạch đàn   → #7C3AED  
Mùn cưa    → #BE185D  
Dăm gỗ keo → #475569  
```

---

### 4. Two-column row: Daily intake chart + Top suppliers
`display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; margin-bottom: 12px`.

#### 4a. Daily intake chart (DailyIntakeCard)
Card `padding: 20px`.

**Card header** (flex `space-between`, `margin-bottom: 12px`):
- Left: `bar-chart-3` icon (14px `--accent`) + title `Sản lượng theo ngày · 14 ngày` (14px weight 500). Sub: `Phân tách theo loại nguyên liệu` (12px `--text-3`).
- Right: material legend (flex wrap, `gap: 12px`, `max-width: 280px`): for each material, 8×8px rounded-2 swatch + name (11px `--text-2`), inline-flex.

**SVG chart**: `viewBox="0 0 560 200"`, width 100%, height 200px, `preserveAspectRatio="none"`. Padding: `{ l:36, r:12, t:16, b:28 }`.
- **Y-axis gridlines** at 0%, 25%, 50%, 75%, 100% of max daily total: dashed `2 4` except baseline solid; labels right-anchored at left edge (mono, 10px, `--text-3`), format `Nt` (rounded).
- **Stacked bars**: one per day (14 bars). Bar group width = `innerW / 14`; bar is centred in group at 70% width (gap = 15% each side). Materials stacked bottom-up in MATERIAL_STATS_BASE_NAMES order. Each segment is a `<rect>` in its material colour, top segment gets `rx="2"`. Opacity: full when no hover or this bar is hovered; `0.4` for other bars.
- **X-axis labels** every 2 days (mono, 10px, `--text-3`): `DD/MM` centred under bar.
- **Hover hit area**: transparent `<rect>` spanning full bar-group width × inner height; onMouseEnter sets hover index.

**Tooltip** (when hover ≠ null): `position: absolute`, horizontally centred over the hovered bar group (computed as % of SVG width), `top: 0`, `transform: translateX(-50%)`. Background `--tooltip-bg` (`#0F172A`), color white, `padding: 8px 10px`, `border-radius: 6px`, 11px, `white-space: nowrap`, `z-index: 5`. Content:
- Date header: `DD/MM` mono (70% opacity).
- Per-material row: 6×6px swatch + material name (left) + tonnage `N.NNt` mono (right), `gap: 6px justify-content: space-between`.
- Divider + total row: `Tổng` + `N.NNt` mono, `gap: 12px`.

**Note on SVG responsive scaling**: the chart uses `preserveAspectRatio="none"` which stretches SVG coordinate space to the container. All computed positions (tooltip left %, gridline coords) are based on the fixed 560×200 viewBox.

#### 4b. Top suppliers (TopSuppliersCard)
Card title `Top nhà cung cấp` with right-action `30 ngày` (12px `--text-3`).
One row per supplier (up to 6), `padding: 10px 0`, bottom border except last. Row:
- Rank `1.`–`6.` (mono 11px `--text-3`, width 18, right-aligned, flex-shrink 0).
- Content (flex-1, min-width 0):
  - Top line: name (13px weight 500 `--text-1`, truncated) + tonnage `N tấn` (mono 12px weight 500 `--text-1`, suffix `tấn` in non-bold `--text-3`).
  - Bar (height 4, radius 2, `--surface-tint` bg, overflow hidden; fill `--accent`, opacity scales from 0.7 + position factor).
  - Under bar: count `· N lượt · N lô` (mono 11px `--text-3`).
- Below list: link button `Xem tất cả nhà cung cấp →` (12px `--accent`, centered, weight 500).

---

### 5. Two-column row: Activity feed + Plot risk
`display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px`.

#### 5a. Activity feed
Card title `Hoạt động gần đây`, right-action link `Xem tất cả →`.
Each activity item (flex row, `padding: 10px 0`, bottom border except last):
- **Icon chip** (24×24px, radius 6, `--surface-tint` bg, `--text-2` icon colour): icon mapped from activity kind — `completed→check`, `cancelled→x`, `waiting→clock`, else `arrow-right`.
- **Text column** (flex-1): primary text (13px `--text-1`) + meta (12px `--text-2`).
- **Timestamp** (mono 11px `--text-3`, no-wrap): `HH:MM`.

#### 5b. Plot risk summary (PlotRiskSummary)
Card title `Hồ sơ rừng`, right-action `Mở danh sách →` (links to plots screen).

**Headline**: total plot count (mono 28px weight 500 `--text-1`) + `lô rừng đăng ký` (13px `--text-2`). Right-aligned: total area (mono 12px `--text-3`): `N.N ha`.

**Stacked bar** (`height: 8px`, radius 4, `border: 1px solid --border`, flex row):
- `low` segment: `--success`, width `counts.low/total * 100%`.
- `medium`: `--warning`.
- `high`: `--danger`.

**Legend** (`margin-top: 12px`, flex column, `gap: 8px`). Each `RiskRow` (flex, `gap: 8px`, 12px):
- 8×8px rounded-2 swatch.
- Label `--text-1`.
- Right: `count/total` mono `--text-2` + `N%` mono 11px `--text-3` in a 36px right-aligned slot.

Labels: low → `Rủi ro thấp` / medium → `Rủi ro vừa` / high → `Rủi ro cao`.

**High-risk alert banner** (only when `counts.high > 0`): `margin-top: 12px`, `padding: 8px 10px`, radius 6, `--danger-bg`, `--danger-text`, 12px. Icon `alert-triangle` (13px) + `{high} lô cần xác minh trước lượt giao kế.`

---

## Interactions & Behaviour

| Trigger | Effect |
|---------|--------|
| Period toggle (7N / 30N / 90N) | Re-renders material accumulation table with `MATERIAL_STATS[period]` — totals, bars, share % all recalculate. Sparklines stay the same 14-value arrays. |
| Bar chart bar hover | Sets `hover` state (day index). Hovered bar stays full opacity; all others drop to `0.4`. Tooltip appears above that bar. |
| Chart `onMouseLeave` | Clears hover; all bars return to full opacity; tooltip unmounts. |
| `Tạo phiếu cân` button | `onNav('weighing')` |
| `Xem tất cả` (activity) | `onNav('cargo')` |
| `Xem tất cả nhà cung cấp` | `onNav('suppliers')` |
| `Mở danh sách` (plots) | `onNav('plots')` |
| Alert banner (high-risk plots) | Not interactive — informational only |

## State
- `period: '7d' | '30d' | '90d'` — default `'30d'`. Controls the material accumulation dataset.
- `hover: number | null` — index of the hovered bar in the daily chart. `null` = no hover.
- All other values are derived from the data at render time — no other mutable state.

## Data Shapes

```ts
// DASH_STATS
interface DashStats {
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

// MATERIAL_STATS[period] — array of 7 items
interface MaterialStat {
  name: string;
  kg: number;         // total kg in period
  count: number;      // delivery count in period
  delta: number;      // % change vs prior period (e.g. +12 means +12%)
  color: string;      // CSS var or hex
  spark: number[];    // 14 normalised values for sparkline (0–1 ish)
}

// DAILY_INTAKE_14D — array of 14 day objects
interface DayIntake {
  day: number;         // days ago (0 = today)
  date: Date;
  [materialName: string]: number; // kg per material
}

// TOP_SUPPLIERS — array of up to 6
interface SupplierSummary {
  name: string;        // full name
  short: string;       // abbreviated display name
  kg: number;          // net kg in 30 days
  count: number;       // delivery count
  plots: number;       // linked forest plots
}

// ACTIVITY — array of recent events
interface ActivityItem {
  kind: 'completed' | 'cancelled' | 'waiting' | string;
  text: string;        // primary Vietnamese description
  meta: string;        // secondary info (plate, supplier, etc.)
  t: Date;
}

// PLOTS — array
interface Plot {
  id: string;
  risk: 'low' | 'medium' | 'high';
  area: number;        // hectares
  // …other fields
}
```

Full mock implementations of all constants are in `reference/data.tsx`.

## Design Tokens
Defined as CSS custom properties in `reference/app-shell.html`. Full table in the Tài xế handoff — same token set applies here. Key values used on this screen:

| Token | Value |
|-------|-------|
| `--bg` | `#FAFAFA` |
| `--surface` | `#FFFFFF` |
| `--surface-tint` | `#F9FAFB` |
| `--border` | `#E5E7EB` |
| `--text-1` | `#0F172A` |
| `--text-2` | `#475569` |
| `--text-3` | `#94A3B8` |
| `--accent` | `#1E40AF` |
| `--success` / `-bg` / `-text` | `#16A34A` / `#DCFCE7` / `#166534` |
| `--warning` / `-bg` / `-text` | `#D97706` / `#FEF3C7` / `#92400E` |
| `--danger` / `-bg` / `-text` | `#DC2626` / `#FEE2E2` / `#991B1B` |
| `--tooltip-bg` | `#0F172A` |

Typography: **Inter** 400/500; **JetBrains Mono** 400/500 for all numbers, codes, dates. Base 14px / 1.5. The `.mono` CSS class applies the monospace font.

Density tokens: `--cell-pad-y: 12px` · `--cell-pad-x: 14px` · `--th-pad-y: 10px` · `--cell-fs: 13px`.

## Assets
- **Icons:** Lucide `0.469.0`. Used: `package-2`, `bar-chart-3`, `trending-up`, `trending-down`, `minus`, `plus`, `alert-triangle`, `arrow-right`, `check`, `x`, `clock`. Map to our icon set.
- **Fonts:** Inter + JetBrains Mono.
- **SVG chart:** hand-drawn inline SVG — implement with our charting library (Recharts, Victory, D3, etc.) while preserving the visual logic: stacked bars, normalised Y, 14-day X, colour-per-material, hover tooltip.

## Files
In `reference/`:
- **`screen-home.tsx`** — primary reference: all section components (`MetricCard`, `Spark`, `ScreenHome`, `MaterialAccumulationCard`, `DailyIntakeCard`, `TopSuppliersCard`, `PlotRiskSummary`, `RiskRow`, `ActivityFeed`). This is the only file Claude Code needs for the screen logic.
- **`data.tsx`** — all mock data constants used (`DASH_STATS`, `MATERIAL_STATS`, `MATERIAL_PALETTE`, `DAILY_INTAKE_14D`, `TOP_SUPPLIERS`, `ACTIVITY`, `PLOTS`, `CARGO`, plus helper functions `pad`, `fmtTime`, `fmtDateTime`).
- **`ui.tsx`** — shared atom components: `Icon`, `Badge`, `Button`, `Card`, `Tabs`, `FilterChip`. Cards on this screen are composed with the `Card` atom (`background: --card-bg; border: var(--card-border); border-radius: 12px`).
- **`app-shell.html`** — CSS custom properties (all design tokens), global resets, font imports, scrollbar + reduced-motion rules.

### Notes for implementation
- Replace all inline styles with our styling approach.
- The SVG chart should be replaced with our charting library — replicate the visual (stacked bars, colour legend, hover tooltip) not the raw SVG code.
- Keep Vietnamese copy verbatim. Keep mono font on all numbers.
- `netTodayKg` = sum of `(grossKg - tareKg)` for all completed CARGO rows with both weights — computed at render time. In production, derive from a real query.
- The activity feed items come from `ACTIVITY` in data.tsx — replace with a real API endpoint.
- Dark-theme token overrides are defined under `html[data-theme="dark"]` in `app-shell.html`.
