# Handoff: Cài đặt (Settings) Screen

## Overview
The system configuration screen of **Hồ sơ nguyên liệu** — a raw-material traceability app for forestry/timber processing plants. This is an **admin-only area** where plant managers configure the Google Sheets data sources backing each plant's data, trigger manual syncs, and will eventually manage users, alerts, and audit logs.

The screen is a two-column layout: a sticky left sub-nav listing the five settings sections, and a right content panel showing the active section. Only the **Nguồn dữ liệu** (Data Sources) section is fully implemented in V1 — the remaining four sections render a placeholder "Sắp triển khai" state.

All UI copy is in **Vietnamese** — keep it verbatim.

---

## About the Design Files
The files in `reference/` are **design references created as an in-browser React prototype** (TSX compiled with Babel standalone). They are *not* production code to copy directly — they use inline styles, CSS custom properties, and a small hand-rolled component kit specific to the prototype.

Your task is to **recreate this screen in our real codebase** using our existing environment (React + TypeScript `.tsx`), our component library, design-token system, and conventions. Treat the prototype as the source of truth for **layout, behavior, copy, and exact visual values** — then express it with our own primitives. If a described primitive doesn't exist in our codebase yet, build it to match the spec below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate pixel-faithfully, mapping the raw values below onto our token system where equivalents exist.

---

## Screenshots
In `screenshots/`:
- **`01-settings-sources.png`** — the full settings screen: page header, left sub-nav (with error badge on "Nguồn dữ liệu"), and the Data Sources content panel showing the status banner, plant tabs, and the NMXH tab selected.
- **`02-settings-error-state.png`** — NMQM tab selected: the tab badge shows `1` error count; the source rows below will show the "Hồ sơ rừng" row in the error state (red background, error message).
- **`03-settings-source-rows.png`** — scrolled view showing individual `SourceRow` components with URL input, Tab/Range sub-fields, and action buttons.

---

## Screen Layout

### Page dimensions & chrome
The screen lives inside the standard app shell: collapsible left sidebar (240px expanded / 56px collapsed) + sticky top header (56px). The settings content uses `padding: 24px; max-width: 1440px; margin: 0 auto`.

### Page header
Vertical stack, `margin-bottom: 20px`:
- Eyebrow (13px, `--text-2`): `Cài đặt`
- H1 (22px / weight 500 / `--text-1`, `margin: 4px 0 0`, `line-height: 1.3`): `Cấu hình hệ thống`
- Sub-line (`margin-top: 6px`, flex row, `gap: 8px`, 12px, `--text-3`): `shield-check` icon (12px) + `Khu vực dành cho quản trị viên · các thay đổi áp dụng ngay khi lưu`

### Two-column grid
`display: grid; grid-template-columns: 220px 1fr; gap: 24px; align-items: start`

---

## Left: Sub-navigation
`display: flex; flex-direction: column; gap: 2px; position: sticky; top: 72px`

Five nav items (the `72px` top accounts for the 56px header + 16px breathing room):

| id | Label | Icon |
|----|-------|------|
| `sources` | `Nguồn dữ liệu` | `database` |
| `sync` | `Đồng bộ` | `refresh-ccw` |
| `users` | `Người dùng & vai trò` | `users` |
| `alerts` | `Cảnh báo & thông báo` | `bell` |
| `audit` | `Nhật ký phiên` | `history` |

### `SettingsNavItem` anatomy
`<button>`, flex row, `gap: 10px`, `padding: 8px 12px`, `border-radius: 6px`, `font-size: 13px`, `transition: background 150ms ease-out`.

**States:**
- **Inactive idle:** `background: transparent`, `color: --text-1`, icon `color: --text-2`, `font-weight: 400`, `border-left: 2px solid transparent`
- **Inactive hover:** `background: --surface-tint`
- **Active:** `background: --accent-tint`, `color: --accent`, icon `color: --accent`, `font-weight: 500`, `border-left: 2px solid --accent`

**Error badge** (trailing, right-aligned): shown only when `warn > 0`. Small pill, `font-size: 10px`, `font-weight: 500`, `padding: 1px 6px`, `border-radius: 999px`, `background: --danger-bg`, `color: --danger-text`, `.mono` class. In V1 this only appears on `sources` when any plant has a source in `status: 'error'`.

---

## Right: Content panel

### Section: Nguồn dữ liệu (Data Sources)
`display: flex; flex-direction: column; gap: 16px; max-width: 920px`

#### Sub-header
- H2 `Nguồn dữ liệu` (18px / weight 500 / `--text-1`, `margin: 0`)
- Description paragraph (13px, `--text-2`, `margin: 4px 0 0`, `max-width: 680px`): `Mỗi nhà máy có một bộ Google Sheets riêng cho từng loại dữ liệu. Riêng ` + `danh sách người dùng` (`color: --text-1`) + ` là một trang tính dùng chung cho cả ba nhà máy.`

#### Status banner (`Card`, `padding: 14px`)
Flex row, `gap: 16px`, `flex-wrap`.

**Left cluster** (flex row, `gap: 10px`):
- Icon chip: `width: 32px; height: 32px; border-radius: 8px`. When `errorCount > 0`: `background: --danger-bg`, `color: --danger-text`, icon `alert-triangle` (16px). When clean: `background: --success-bg`, `color: --success-text`, icon `check` (16px).
- Text column:
  - Primary (13px / weight 500 / `--text-1`): `{N} nguồn dữ liệu đang gặp lỗi` or `Tất cả nguồn đang hoạt động`
  - Secondary (`margin-top: 2px`, 12px, `--text-2`): `Đồng bộ tự động mỗi ` + `15` (mono) + ` phút · áp dụng cho 3 nhà máy`

**Right:** `flex: 1` spacer + `[Đồng bộ tất cả ngay]` secondary button, icon `refresh-ccw`.

- **`syncAll` action:** sets all sources' `lastSync` to `new Date()` and `status: 'ok'` (only for rows that have a `url`), updates shared users too. Fires toast `Đã đồng bộ tất cả nguồn dữ liệu.` (success).

#### Plant tabs card (`Card`, `padding: 0`)
Header: `Tabs` component (no padding inside card — the tab bar sits flush against the card top). Three tab items from `PLANTS`:
- `NMXH` → `Nhà máy Xuân Hòa`
- `NMQM` → `Nhà máy Quy Mỹ`
- `NMCT` → `Nhà máy Cẩm Thượng`

Each tab shows a trailing count badge (same style as `Tabs` in `ui.tsx`) when that plant has `>0` error sources — the count is the number of errored sources for that plant. Use `--text-3` color, `--surface-tint` background.

Below the tab bar (`padding: 16px; display: flex; flex-direction: column; gap: 12px`):
- Role info row (flex, `gap: 8px`, 12px, `--text-2`): `info` icon (12px, `--text-3`) + `Vai trò của bạn tại nhà máy này:` + `Badge` (tone `info`) showing the current plant's `role`.
- One `SourceRow` per dataset key in order: `cargo`, `plots`, `suppliers`, `materials`, `drivers`.

#### Shared users section
Below the plant card, a separate section (no card wrapper at the top level):

**Header row** (`margin-bottom: 8px`): H3 `Dùng chung cho cả ba nhà máy` (14px / weight 500 / `--text-1`, `margin: 0`) + `SHARED` pill (`font-size: 11px`, `padding: 2px 7px`, `border-radius: 999px`, `background: --surface-tint`, `border: 1px solid --border`, `color: --text-2`, `.mono`).

**Description** (13px, `--text-3`, `margin: 0 0 12px`): `Một bảng người dùng chung quản lý quyền truy cập vào toàn bộ hệ thống.`

**`Card` (`padding: 16px`)** containing a single `SourceRow` for the shared users sheet (no outer border/container on the row itself — `noContainer` prop).

---

## `SourceRow` Component

The core unit of the settings screen. One row per Google Sheets data source.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [icon]  Dataset name (14px/500)          [SourceStatus badge]          │
│          Dataset description (12px/text-3)                              │
│                                                                          │
│  [link icon]  [URL text input ─────────────────────────]  [⧉] [⎘] [Kiểm tra] │
│                                                                          │
│  Tab: [input 160px]   Khoảng ô: [input 110px]   flex-1   [Đồng bộ ngay] [⋯] │
│                                                                          │
│  (error banner if status === 'error')                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| `datasetKey` | `string` | Key into `DATASET_META` (or `'users'` for shared) |
| `source` | `DataSource` | Current source config + status |
| `dirty` | `boolean` | Has an unsaved local change |
| `testing` | `boolean` | Connection test in flight |
| `onChange(patch)` | `fn` | Merge patch into source state |
| `onTest()` | `fn` | Fire connection test |
| `onSync()` | `fn` | Fire immediate sync |
| `meta` | `object?` | Override `DATASET_META[key]` (for shared users row) |
| `noContainer` | `boolean?` | Omit the border/bg wrapper (used when row is inside its own `Card`) |

### Row 1 — header
Flex row, `gap: 12px`, `margin-bottom: 10px`.

- **Icon chip:** `width: 30px; height: 30px; border-radius: 7px; background: --surface-tint; border: 1px solid --border; color: --text-2`. Icon from `DATASET_META[key].icon`, size 15px.
- **Text column** (`flex: 1; min-width: 0`):
  - Name: 14px / weight 500 / `--text-1`
  - Description: 12px / `--text-3`, `margin-top: 2px`
- **`SourceStatus`** (right-aligned): see below.

### Row 2 — URL input
Flex row, `gap: 8px`.

- **`TextInput`** (`flex: 1`, `mono`, `leftIcon: 'link'`, placeholder `https://docs.google.com/spreadsheets/d/.../edit`). `onChange` → `onChange({ url: v })`.
- **`IconButton`** icon `external-link`, label `Mở trong tab mới`. Click → `window.open(source.url, '_blank')` (no-op if URL empty).
- **`IconButton`** icon `copy`, label `Sao chép URL`. Click → `navigator.clipboard.writeText(source.url)`.
- **`Button`** size `md`, variant `secondary`, icon `plug-zap`, `loading={testing}`. Label `Kiểm tra`. Click → `onTest()`.

### Row 3 — sub-fields
Flex row, `gap: 10px`, `margin-top: 10px`.

- **`SubField` "Tab":** label 11px `--text-3` above a `TextInput` (`width: 160px`, mono). `onChange` → `onChange({ tab: v })`.
- **`SubField` "Khoảng ô":** same pattern, `width: 110px`. `onChange` → `onChange({ range: v })`.
- **Spacer** (`flex: 1`).
- **`Button`** size `md`, variant `ghost`, icon `refresh-ccw`. Label `Đồng bộ ngay`. Click → `onSync()`.
- **`⋯` button** (`more-horizontal` icon): `width: 36px; height: 36px; border-radius: 8px; border: 1px solid --border; background: transparent; color: --text-2`. Toggles a local `showAdvanced` boolean. (Advanced panel not yet spec'd for V1 — the button exists as a placeholder for future options.)

### Row 4 — error banner (conditional)
Only rendered when `source.status === 'error' && source.error`. `margin-top: 10px`, `padding: 8px 10px`, `border-radius: 6px`, `background: --danger-bg`, `color: --danger-text`, 12px, flex `gap: 8px`. Icon `alert-circle` (12px) + error message string.

### Container wrapper (when `noContainer` is false)
`border: 1px solid --border; border-radius: 10px; padding: 14px`.
Background: when `source.status === 'error'` → `color-mix(in srgb, var(--danger-bg) 60%, transparent)`; otherwise `--card-bg`.

---

## `SourceStatus` Component

Shown in the top-right of each `SourceRow` header.

| Condition | Renders |
|-----------|---------|
| `dirty === true` | `Badge` tone `info` → `Chưa lưu` |
| `status === 'empty'` | `Badge` tone `neutral` → `Chưa cấu hình` |
| `status === 'error'` | `Badge` tone `danger` dot → `Lỗi đồng bộ` |
| `status === 'ok'` | `Badge` tone `success` dot → `Đồng bộ` + mono `fmtAgo(lastSync)` (11px, `--text-3`, `gap: 8px`) |

---

## `SubField` Component
A simple label-above-input wrapper:
```tsx
<label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
  {children}
</label>
```

---

## Section: Placeholder (all other sections)
When `section !== 'sources'`, render `SectionPlaceholder`:
- H2 from `SETTINGS_SECTIONS[section].label` (18px / weight 500 / `--text-1`, `margin: 0 0 4px`)
- Description (13px, `--text-2`, `margin: 0 0 16px`): `Phần này sẽ kế thừa cấu trúc tương tự Nguồn dữ liệu.`
- `Card` with `padding: 40px`, centered flex column, `gap: 12px`:
  - Icon from `SETTINGS_SECTIONS[section].icon`, size 40, strokeWidth 1.25, `--text-3`
  - Text 14px, `--text-2`: `Sắp triển khai.`
- Max-width `920px` on the outer wrapper.

---

## Data Shapes

```ts
type SourceStatus = 'ok' | 'error' | 'empty';

interface DataSource {
  url: string;           // Google Sheets URL (empty string when not configured)
  tab: string;           // Sheet tab name (e.g. 'PhieuCan')
  range: string;         // Cell range (e.g. 'A2:AC')
  lastSync: Date | null; // Timestamp of last successful sync (null if never)
  status: SourceStatus;
  error?: string | null; // Human-readable error message when status === 'error'
}

type DatasetKey = 'cargo' | 'plots' | 'suppliers' | 'materials' | 'drivers';

// Per-plant source map
type PlantSources = Record<DatasetKey, DataSource>;

// Top-level sources state
type SourcesState = {
  NMXH: PlantSources;
  NMQM: PlantSources;
  NMCT: PlantSources;
};

// Metadata for each dataset type
interface DatasetMeta {
  name: string;   // Display name
  icon: string;   // Lucide icon name
  desc: string;   // Short description
}

const DATASET_META: Record<DatasetKey | 'users', DatasetMeta> = {
  cargo:     { name: 'Xe hàng & phiếu cân',  icon: 'scale',       desc: 'Lượt cân, ảnh đồng hồ, dữ liệu giám sát' },
  plots:     { name: 'Hồ sơ rừng',           icon: 'map',         desc: 'Lô rừng, ranh giới, mức rủi ro' },
  suppliers: { name: 'Nhà cung cấp',         icon: 'building-2',  desc: 'Nhà cung cấp chính và phụ' },
  materials: { name: 'Nguyên liệu',          icon: 'package',     desc: 'Danh mục loại nguyên liệu' },
  drivers:   { name: 'Tài xế',               icon: 'user-round',  desc: 'Hồ sơ tài xế và phương tiện' },
  users:     { name: 'Danh sách người dùng', icon: 'users',       desc: 'Tài khoản, email, vai trò ở từng nhà máy' },
};
```

---

## Default / Seed Data

The prototype initialises `DEFAULT_SOURCES` with realistic mock Google Sheets URLs (generated by a deterministic `gid()` hash on a seed string) so the UI is never empty on first load.

**NMXH** — all 5 datasets `status: 'ok'`. `cargo` synced 3 min ago, others 11 min ago.

**NMQM** — `cargo` ok (6 min), `plots` **error** (`lastSync` 72 min ago, `error: 'Không thể đọc trang tính: kiểm tra quyền chia sẻ'`), `suppliers`/`materials` ok (14 min), `drivers` **empty** (no URL, `lastSync: null`).

**NMCT** — all 5 datasets `status: 'ok'`, synced 2–9 min ago.

**Shared users** — `status: 'ok'`, synced 5 min ago.

The `errorCount` derived value (used for the sub-nav badge and status banner headline) counts all sources across all plants where `status === 'error'`. With the seed data, this starts at **1** (NMQM plots).

---

## Interactions & Behaviour

### Filtering / navigation
Clicking a `SettingsNavItem` sets `section` state. Only `sources` renders real content; others get the placeholder.

### Plant tab switching
Clicking a plant tab sets `plantId`, which re-renders the source rows for that plant's data. The role badge updates to reflect `PLANTS.find(p => p.id === plantId).role`.

### Editing a source field
Any change to a URL, tab, or range input calls `onChange(patch)` → `updatePlantSource(plantId, dataset, patch)` → merges the patch and adds `${plantId}.${dataset}` to the `dirty` Set. The `SourceStatus` for that row immediately flips to `Badge tone="info"` → `Chưa lưu`.

Shared users edits call `updateShared(patch)` and add `'shared.users'` to dirty.

> **Note:** In V1 the prototype has no "Save" action per row — dirty state is purely visual feedback. In production, wire a "Lưu" button (or auto-save on blur) that persists the change and clears the dirty flag.

### Connection test (`Kiểm tra`)
Sets `testing` to the current source key. After **1200ms** simulated delay, clears `testing` and fires toast: `Kết nối thành công · {key}` (success). In production replace with a real connectivity probe.

### Per-source sync (`Đồng bộ ngay`)
- Plant source: calls `syncOne(plantId, dataset)` → sets `lastSync: new Date()`, `status: 'ok'`, `error: null`. Fires toast `Đã đồng bộ {datasetName} · {plantId}.` (success).
- Shared users: calls `updateShared({ lastSync: new Date(), status: 'ok' })`. No separate toast in V1.

### Sync all (`Đồng bộ tất cả ngay`)
Iterates all plants and all dataset keys. For any source that has a non-empty URL: sets `lastSync: new Date()`, `status: 'ok'`, `error: null`. Updates shared users too. Fires toast `Đã đồng bộ tất cả nguồn dữ liệu.` (success).

### External link / copy
- `external-link` button: `window.open(source.url, '_blank')` — no-op if URL is empty.
- `copy` button: `navigator.clipboard.writeText(source.url)`.

### `⋯` (more-horizontal) button
Toggles local `showAdvanced` boolean per row. The advanced panel is not spec'd in V1 — the button is a forward-compatible placeholder.

---

## State Management
Local `ScreenSettings` component state only (no global store):

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `section` | `string` | `'sources'` | Active sub-nav section |
| `plantId` | `string` | `'NMXH'` | Active plant tab |
| `sources` | `SourcesState` | `DEFAULT_SOURCES` | All per-plant source configs |
| `shared` | `DataSource` | `DEFAULT_SHARED_USERS` | Shared users source config |
| `dirty` | `Set<string>` | `new Set()` | Keys of unsaved edits (`'NMXH.cargo'`, `'shared.users'`, etc.) |
| `testing` | `string \| null` | `null` | Source key currently under connection test |

**Derived (`useMemo`):**
- `errorCount`: count of all sources across all plants with `status === 'error'`.

---

## `fmtAgo` Helper
Converts a `Date` (or `null`) to a Vietnamese relative-time string:

```ts
function fmtAgo(d: Date | null): string {
  if (!d) return 'Chưa đồng bộ';
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1)  return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ ${mins % 60} phút trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
```

---

## Design Tokens
Full token set defined as CSS custom properties in `reference/app-shell.html`. Key tokens used on this screen:

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAFAFA` | Page background |
| `--surface` | `#FFFFFF` | Cards, header/footer |
| `--surface-tint` | `#F9FAFB` | Icon chips, hover, SHARED pill bg |
| `--border` | `#E5E7EB` | All hairlines and row separators |
| `--border-strong` | `#D1D5DB` | Secondary button hover border |
| `--text-1` | `#0F172A` | Primary text |
| `--text-2` | `#475569` | Secondary text |
| `--text-3` | `#94A3B8` | Tertiary / hints / labels |
| `--accent` | `#1E40AF` | Active nav item, info badge, accent |
| `--accent-tint` | `rgba(30,64,175,0.06)` | Active nav item background |
| `--accent-ring` | `rgba(30,64,175,0.30)` | Focused input ring |
| `--success` / `-bg` / `-text` | `#16A34A` / `#DCFCE7` / `#166534` | Sync ok state |
| `--danger` / `-bg` / `-text` | `#DC2626` / `#FEE2E2` / `#991B1B` | Error state, error badge |
| `--card-bg` | `var(--surface)` | Card background |
| `--card-border` | `1px solid var(--border)` | Card border shorthand |

Density tokens (all in px, tweakable): `--btn-h-sm: 28` · `--btn-h: 36` · `--btn-h-lg: 40` · `--chip-h: 32`.

**Radii:** controls 6–8px; cards 12px; source row wrapper 10px; icon chips 7px; pills 999px.

**Typography:** **Inter** 400/500 for UI chrome; **JetBrains Mono** 400/500 (class `.mono`, `font-variant-ligatures: none`) for URLs, cell ranges, tab names, the SHARED pill, and the `fmtAgo` timestamp in `SourceStatus`. Base 14px / line-height 1.5.

A full **dark theme** is defined under `html[data-theme="dark"]` in `app-shell.html` — carry the same token names across to our theming system.

---

## Assets
- **Icons:** [Lucide](https://lucide.dev) `0.469.0`. Used on this screen: `database`, `refresh-ccw`, `users`, `bell`, `history`, `shield-check`, `alert-triangle`, `check`, `info`, `scale`, `map`, `building-2`, `package`, `user-round`, `link`, `external-link`, `copy`, `plug-zap`, `more-horizontal`. Map these to our icon set.
- **Fonts:** Inter + JetBrains Mono (Google Fonts in the prototype).
- No raster images or avatars on this screen.

---

## Files
In `reference/`:
- **`screen-settings.tsx`** — the screen itself: `ScreenSettings`, `SettingsNavItem`, `DataSourcesSection`, `SourceRow`, `SourceStatus`, `SubField`, `SectionPlaceholder`, plus all mock data (`DEFAULT_SOURCES`, `DEFAULT_SHARED_USERS`, `DATASET_META`, `SETTINGS_SECTIONS`, `fmtAgo`, `gid`, `sheetUrl`). **Primary reference.**
- **`ui.tsx`** — shared atoms: `Icon`, `Badge`, `Button`, `IconButton`, `TextInput`, `Card`, `Tabs`. Match these APIs/looks with our equivalents.
- **`data.tsx`** — shared constants used here: `PLANTS` (plant list with `id`, `name`, `role`).
- **`shell.tsx`** — the app shell (sidebar + header). Not modified by settings screen but useful to understand the `onToast` prop contract.
- **`app-shell.html`** — source of truth for all CSS custom properties (design tokens), global resets, font imports, and the dark-theme token overrides.

### Notes for implementation
- The prototype shares components via the global scope; in our codebase, import them properly instead.
- Replace all inline-style objects + CSS-var reads with our styling approach (CSS modules / styled / Tailwind / token props — whatever the repo uses).
- Keep Vietnamese copy exactly as written. Keep `.mono` on URLs, ranges, tab names, the `fmtAgo` string, and the SHARED pill.
- The `gid()` / `sheetUrl()` seed functions exist only to generate plausible-looking demo URLs — replace with real URLs from the database in production.
- `testing` is keyed by a string like `'NMXH.cargo'` or `'shared.users'` so only one row shows a spinner at a time. In production, you may want to allow concurrent tests.
- The `dirty` Set tracks unsaved edits purely for UI feedback in V1. In production, persist changes on Save/blur and clear the dirty flag on success.
- Dark-theme token overrides are defined under `html[data-theme="dark"]` in `app-shell.html` — carry the same token names across to our theming system.
