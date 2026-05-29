# Handoff: Tài xế (Drivers) Screen

## Overview
A driver-management screen for an industrial material-intake system ("Hồ sơ nguyên liệu" — a raw-material traceability app for forestry/timber plants). Operators use it to manage the drivers who deliver cargo to the plant: view their license (GPLX) compliance, linked vehicles, delivery activity, and account status. The screen is a dense data table with summary stat tiles and a slide-over detail drawer.

All UI copy is in **Vietnamese** — keep it verbatim.

## About the Design Files
The files in `reference/` are **design references created as an in-browser React prototype** (TSX compiled with Babel standalone). They are *not* production code to copy directly — they use inline styles, CSS custom properties, and a small hand-rolled component kit specific to the prototype.

Your task is to **recreate this screen in our real codebase** using our existing environment (React + TypeScript `.tsx`), our component library, design-token system, and conventions. Treat the prototype as the source of truth for **layout, behavior, copy, and exact visual values** — then express it with our own primitives (our Button, Badge, Table, Drawer, etc.). If a described primitive doesn't exist in our codebase yet, build it to match the spec below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate pixel-faithfully, mapping the raw values below onto our token system where equivalents exist.

---

## Screenshots
In `screenshots/`:
- **`01-drivers-list.png`** — the full list view: header, the four stat tiles, filter chips, and the table (note the color-coded "Còn N ngày" / "Đã hết hạn" expiry warnings).
- **`02-driver-drawer.png`** — the detail drawer open over the list, showing the identity header, the 3-up stat block, and the "Giấy tờ & bằng lái" section (with the red expiry highlight) plus the footer actions. The lower drawer sections — **Phương tiện thường dùng** and **Chuyến gần đây** — are below the fold here; see their full specs under *Driver detail drawer* below.

## Screens / Views

### 1. Drivers list (main view)
- **Purpose:** Browse, search, filter, and sort all drivers; spot license-expiry and account-status problems at a glance; open any driver for detail.
- **Page padding:** `24px` all around.
- **Vertical structure (top → bottom), each block separated by `16px`:**
  1. **Page header** (flex row, `space-between`, `flex-wrap`):
     - Left: eyebrow label `Tài xế` (13px, `--text-2`) above H1 `Danh sách tài xế` (22px / weight 500 / `--text-1`, `4px` top margin).
     - Right: button group, `gap: 8px` — `[Xuất Excel]` (secondary, icon `download`) and `[Thêm tài xế]` (primary, icon `user-plus`).
  2. **Stat tiles row** — flex row, `gap: 12px`, `flex-wrap`. Four equal tiles (`flex: 1`). See **Stat tile** component. The tiles double as filters and stay in sync with the chip row.
  3. **Main card** (`--card-bg`, `--card-border`, radius 12, `padding: 0`) containing:
     - **Toolbar** (flex row, `gap: 8px`, `padding: 12px 16px`, bottom border `1px solid --border`, `flex-wrap`): five filter chips, then a spacer (`flex: 1`), then a search input (`width: 280px`, left icon `search`, placeholder `Tìm tên, CCCD, GPLX, biển số…`).
     - **Table** (scroll container `overflow: auto; max-height: calc(100vh - 380px)`).
     - **Footer bar** (`padding: 10px 16px`, top border): left `Hiển thị N trên M tài xế` (numbers in mono, `--text-1`); right hint with `info` icon + `Nhấp vào một dòng để xem hồ sơ tài xế` (12px, `--text-2/3`).

#### Table columns (left → right)
| # | Header | Width | Align | Sortable | Content |
|---|--------|-------|-------|----------|---------|
| 1 | `Tài xế` | flex | left | yes (`name`) | Avatar (34px circle, initials) + name (weight 500) over `{cccd} · {base}` (11px mono, `--text-3`) |
| 2 | `GPLX` | 150 | left | no | Class badge + license number (12px mono, `--text-2`) |
| 3 | `Hạn GPLX` | 140 | left | yes (`expiry`) | Expiry date (12px mono) + colored "Còn N ngày" / "Đã hết hạn" sub-line |
| 4 | `Điện thoại` | 130 | left | no | Phone (12px mono, `--text-2`) |
| 5 | `Phương tiện` | 150 | left | no | First plate (12px mono) + `+N` overflow pill if more than one |
| 6 | `Chuyến 30N` | 90 | right | yes (`trips30`) | Integer (mono) — deliveries in last 30 days |
| 7 | `KL tịnh 30N` | 120 | right | yes (`kg30`) | Net tonnage `N t` (mono; value ÷ 1000, rounded, `vi-VN` locale) |
| 8 | `Trạng thái` | 150 | left | no | Status badge with dot |

- **Header cells (`Th`):** sticky top, `background: --th-bg`, 12px / weight 500 / `--text-2`, padding `var(--th-pad-y) var(--cell-pad-x)`, bottom border. Sortable headers show a chevron (`chevrons-up-down` idle, `chevron-up`/`chevron-down` active) and toggle asc/desc.
- **Body cells (`Td`):** padding `var(--cell-pad-y) var(--cell-pad-x)`, bottom border `1px solid --border`, font `var(--cell-fs)` (13px), vertical-align middle.
- **Row:** `cursor: pointer`; hover background `--surface-tint` (transition `background 100ms ease-out`); click opens the detail drawer for that driver.
- **Empty state:** when no rows match, a centered block spanning all columns — icon `user-round` (40px, strokeWidth 1.25, `--text-3`), message `Không có tài xế nào khớp với bộ lọc.`, and a secondary `Xóa bộ lọc` button that resets filter to `all` and clears search.

### 2. Driver detail drawer (slide-over)
Opens from the right when a row is clicked. **Not a route** — an overlay over the list.

- **Backdrop:** `position: fixed; inset: 0; background: rgba(15,23,42,0.32); z-index: 150;` fade-in 150ms. Click backdrop = close.
- **Panel:** `position: fixed; top/right/bottom: 0; width: min(460px, 92vw); z-index: 151; background: --bg; border-left: 1px solid --border; box-shadow: -8px 0 28px rgba(15,23,42,0.10);` slide-in from right 200ms (`translateX(100%) → 0`). **Esc closes.**
- **Layout:** flex column — sticky header, scrollable body (`flex: 1; overflow: auto; padding: 20px; gap: 20px`), sticky footer.

**Drawer header** (`padding: 16px 20px`, bottom border, `background: --surface`):
- Row: avatar (48px) + name (17px / weight 500) over CCCD (12px mono, `--text-3`) over status badge (`8px` top margin). Far right: `x` icon-button (close).
- Below: 3-up stat grid (`gap: 8px`) — `Chuyến 30N`, `KL tịnh 30N` (`Nt`), `Tổng chuyến`. Each is a tinted tile (`--surface-tint`, border, radius 8, `padding 8px 10px`): label 11px `--text-3` over value 17px mono weight 500.

**Drawer body** — three sections, each a `DrawerSection` (header row = icon + title 13px weight 500, optional right-aligned action):
1. **`Giấy tờ & bằng lái`** (icon `id-card`) — key/value rows (`DrawerRow`: 120px label column / value, `9px` vertical padding, divider between):
   - `Giấy phép lái xe` → license number (mono)
   - `Hạng` → class badge + human description (`--text-2`)
   - `Hạn GPLX` → expiry date + colored remaining-days line
   - `Số CCCD` → mono
   - `Điện thoại` → mono
   - `Khu vực / Ngày vào` → `{base} · {joined date}` (date mono), last row no divider
2. **`Phương tiện thường dùng`** (icon `truck`, action = `{N} xe` count) — vertical list of vehicle cards (`--surface`, border, radius 8, `padding 10px 12px`): left = 28px tile w/ `truck` icon + plate (mono, weight 500); right = material name (`--text-2`).
3. **`Chuyến gần đây`** (icon `history`, action = count) — up to 6 most-recent trips (sorted by `createdAt` desc). Each row: left = `{material} · {plate}` over `{id} · {datetime}` (11px `--text-3`); right = net weight `N kg` (mono) over a cargo status badge. If none: dashed-border empty note `Chưa có chuyến nào trong kỳ.`

**Drawer footer** (`padding: 12px 20px`, top border, `background: --surface`, `gap: 8px`):
- `[Sửa hồ sơ]` (secondary, icon `pencil`, `flex: 1`) → toast `Mở biểu mẫu chỉnh sửa hồ sơ tài xế.` (info).
- If status `suspended`: `[Mở khóa]` (primary, icon `unlock`) → toast `Đã mở khóa tài xế {name}.` (success). Otherwise `[Tạm khóa]` (secondary, icon `ban`) → toast `Đã tạm khóa tài xế {name}.` (warning).

---

## Components

### Stat tile (`DriverStatTile`)
Clickable filter card. `flex: 1`, `--card-bg`, radius 10, `padding: 14px 16px`, left-aligned.
- **Top row:** 26px rounded-7 icon chip (tinted with the tile's tone color at ~12% alpha; accent uses `--accent-tint`) + label (12px, `--text-2`).
- **Value row** (`10px` top margin, baseline-aligned, `gap 8px`): value 24px mono weight 500 `--text-1` + optional sub (12px `--text-3`).
- **Active state** (this tile's filter is selected): border becomes the tone color + `box-shadow: 0 0 0 1px <tone>` (a 2px ring effect). **Hover** (inactive): background `--surface-tint`.
- The four tiles: `Tổng tài xế` (tone accent, icon `users`, sub `{tonnage} tấn · 30N`), `Đang hoạt động` (success, `circle-check`), `GPLX sắp hết hạn` (warning, `clock-alert`, sub `≤ 90 ngày`), `Tạm khóa / chờ duyệt` (danger, `user-x`).

### Driver avatar (`DriverAvatar`)
Circle with the person's initials (first + last name letter). Background/foreground are a **deterministic** pick from a 5-color palette, hashed from the name so each driver gets a stable color. Sizes: 34px in table (12px text), 48px in drawer (15px text). Weight 600, `letter-spacing 0.02em`.
- Palette (bg @10% alpha / fg): accent `--accent`; green `#16A34A`; amber `#D97706`; violet `#7C3AED`; cyan `#0891B2`.

### Class badge (`ClassBadge`)
Small mono pill for license class. `height 20px`, `padding 0 7px`, radius 5, `--surface-tint` bg, `1px --border`, 11px weight 500 `--text-1`. Values: `B2`, `C`, `E`, `FC`.
- Class → description map (`CLASS_INFO`): `B2 = Xe tải < 3,5 tấn`, `C = Xe tải ≥ 3,5 tấn`, `E = Xe khách > 30 chỗ`, `FC = Xe tải kéo rơ-moóc`.

### Expiry cell (`ExpiryCell`)
Date line (12px mono) + optional colored remaining-days line. Color logic vs. a reference "today":
- `days < 0` → `--danger-text`, label `Đã hết hạn`
- `0 ≤ days ≤ 30` → `--danger-text`, label `Còn {days} ngày`
- `31 ≤ days ≤ 90` → `--warning-text`, label `Còn {days} ngày`
- `> 90` → `--text-2`, **no** sub-line
- **Note:** the prototype computes `days` against a fixed `TODAY_REF = 2026-05-28` so the demo data stays stable. In production, use the real current date.

### Filter chip (shared `FilterChip` from `ui.tsx`)
Pill, `height var(--chip-h)` (32px), `padding 0 12px`, radius 999. Inactive: transparent bg, `1px --border`, `--text-1`; hover `--surface-tint`. Active: `--accent-tint` bg, `1px --accent` border, `--accent` text, weight 500. Optional leading tone dot and a trailing count pill. The five chips mirror the four stat-tile filters plus a `Chờ duyệt` (pending) chip: `Tất cả`, `Hoạt động` (success), `Sắp hết hạn` (warning), `Tạm khóa` (danger), `Chờ duyệt`.

### Status badge (shared `Badge`)
Pill `padding 4px 9px`, radius 999, 11px weight 500, with a 6px leading dot. Tones map to `--{tone}-bg` / `--{tone}-text` / `--{tone}` dot.
- Driver status map (`DRIVER_STATUS`): `active → success "Đang hoạt động"`, `expiring → warning "GPLX sắp hết hạn"`, `suspended → danger "Tạm khóa"`, `pending → neutral "Chờ duyệt hồ sơ"`.
- Trips inside the drawer use the **cargo** status map (`STATUS` in `data.tsx`): `waiting → warning "Chờ lượt"`, `inProgress → info "Đang xử lý"`, `completed → success "Hoàn thành"`, `cancelled → danger "Hủy lượt"`.

---

## Interactions & Behavior
- **Filtering:** stat tiles AND chips set the same `filter` state (`all | active | expiring | suspended | pending`). The "expiring" filter matches `status === 'expiring'` OR license within 90 days. Selecting any filter highlights both the matching tile and chip.
- **Search (`q`):** case-insensitive substring match across name, CCCD, GPLX number, phone (whitespace-stripped), and any plate. Combined (AND) with the active filter.
- **Sorting:** click a sortable header to set sort column; click again to flip asc/desc. `Hạn GPLX` sorts by computed days-to-expiry, not string. Default sort: `name` ascending.
- **Row click:** opens the detail drawer for that driver.
- **Drawer dismissal:** Esc key, backdrop click, or the `x` button.
- **Footer actions & lock/unlock:** fire toasts (the prototype doesn't mutate data). In production, wire these to the real mutation + edit form.
- **Transitions:** row hover `100ms`; tiles/chips/inputs `150ms`; backdrop fade `150ms`; drawer slide `200ms`. Respect `prefers-reduced-motion` (the shell already reduces all durations to ~0 under that query).

## State Management
Local component state (no global store needed for this screen):
- `filter: 'all'` — active filter key.
- `q: ''` — search query.
- `sortBy: { col: 'name', dir: 'asc' }` — active sort.
- `hoverRow: string | null` — CCCD of hovered row (drives hover bg).
- `openDriver: Driver | null` — the driver shown in the drawer (null = closed).
- Derived via `useMemo`: `counts` (per-status totals), `totalKg`, and `filtered` (filter + search + sort applied). Recompute `filtered` when `filter`, `q`, or `sortBy` change.
- **Data dependency:** trips are derived by matching `CARGO` rows to the driver's name; net weight = `grossKg - tareKg` for completed trips. In production, replace this client-side join with a real driver→deliveries query.

### Data shapes
```ts
type DriverStatus = 'active' | 'expiring' | 'suspended' | 'pending';
type LicenseClass = 'B2' | 'C' | 'E' | 'FC';

interface Driver {
  name: string;
  cccd: string;          // 12-digit national ID (used as row key)
  phone: string;
  gplx: string;          // driver's-license number
  cls: LicenseClass;
  expiry: Date;          // license expiry
  base: string;          // home province/region
  joined: Date;
  status: DriverStatus;
  // derived:
  trips: Cargo[];        // matched delivery rows
  trips30: number;       // deliveries in last 30 days
  kg30: number;          // net kg in last 30 days
  totalTrips: number;
  plates: string[];      // distinct vehicle plates
  materials: string[];   // distinct materials hauled
  lastTrip: Cargo | null;
  expDays: number;       // days until expiry (vs. reference today)
}
```
(See `Cargo` in `reference/data.tsx`.)

## Design Tokens
Defined as CSS custom properties in the shell (`reference/app-shell.html`, `:root`). Light theme:

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAFAFA` | page background / drawer panel |
| `--surface` | `#FFFFFF` | cards, drawer header/footer |
| `--surface-tint` | `#F9FAFB` | table header, hover, tinted tiles |
| `--border` | `#E5E7EB` | hairlines, cell borders |
| `--border-strong` | `#D1D5DB` | hover border on secondary controls |
| `--text-1` | `#0F172A` | primary text |
| `--text-2` | `#475569` | secondary text |
| `--text-3` | `#94A3B8` | tertiary / hints |
| `--accent` | `#1E40AF` | primary actions, active state |
| `--accent-hover` | `#1D4ED8` | primary hover |
| `--accent-tint` | `rgba(30,64,175,0.06)` | active chip/tile bg |
| `--success` / `-bg` / `-text` | `#16A34A` / `#DCFCE7` / `#166534` | active status |
| `--warning` / `-bg` / `-text` | `#D97706` / `#FEF3C7` / `#92400E` | expiry-soon |
| `--danger` / `-bg` / `-text` | `#DC2626` / `#FEE2E2` / `#991B1B` | suspended / expired |
| `--info-bg` / `--info-text` | `#DBEAFE` / `#1E40AF` | info badges |

Density/shape tokens (tweakable): `--btn-h-sm 28` · `--btn-h 36` · `--btn-h-lg 40` · `--chip-h 32` · `--cell-pad-y 12` · `--cell-pad-x 14` · `--th-pad-y 10` · `--cell-fs 13` (px). A full **dark theme** is defined under `html[data-theme="dark"]` — carry the same token names across to our theming system.

**Radii:** controls/cards 8px; large cards 12px; class badge 5px; chips/badges 999px; avatars 50%.
**Typography:** UI font **Inter** (weights 400/500; 500 is the "bold" used for emphasis — there is no 600/700 in chrome). Numeric/code/IDs use **JetBrains Mono** (class `.mono`, weights 400/500, `font-variant-ligatures: none`). Base 14px / line-height 1.5. Sizes used: H1 22, tile value 24, drawer name 17, drawer stat 17, body 13–14, mono detail 11–12.

## Assets
- **Icons:** [Lucide](https://lucide.dev) (prototype pins `lucide@0.469.0`). Names used on this screen: `download, user-plus, users, circle-check, clock-alert, user-x, search, user-round, info, id-card, truck, history, pencil, unlock, ban, x` (+ sort chevrons `chevrons-up-down / chevron-up / chevron-down`). Map these to our icon set.
- **Fonts:** Inter + JetBrains Mono (Google Fonts in the prototype).
- No raster images or logos on this screen. Avatars are generated from initials — no uploaded photos.

## Files
In `reference/`:
- **`screen-drivers.tsx`** — the screen itself: dataset builder (`DRIVER_BASE` → `DRIVERS_FULL`), `ScreenDrivers`, `DriverDrawer`, and the helper components (`DriverStatTile`, `DriverAvatar`, `ClassBadge`, `ExpiryCell`, `DrawerStat/Section/Row`). **Primary reference.**
- **`ui.tsx`** — shared atoms used here: `Icon`, `Badge`, `StatusBadge`, `Button`, `IconButton`, `TextInput`, `Card`, `FilterChip`. Match these APIs/looks with our equivalents.
- **`screen-cargo.tsx`** — defines `Th`, `Td`, and `EmptyState`, which the drivers table reuses. (Also the closest existing table pattern to model ours on.)
- **`data.tsx`** — mock data + the `Cargo` shape, `STATUS` map, and `fmtDate` / `fmtDateTime` helpers.
- **`app-shell.html`** — the host page: all design tokens (`:root` + dark theme), font imports, global resets, scrollbar + reduced-motion styles. Source of truth for the token values above.

### Notes for implementation
- The prototype shares components across files via the global scope; in our codebase, import them properly instead.
- Replace all inline-style objects + CSS-var reads with our styling approach (CSS modules / styled / Tailwind / token props — whatever the repo uses).
- Keep Vietnamese copy exactly. Keep mono vs. sans distinction (mono for IDs, plates, phones, dates, weights).
- `kg30` is displayed in **tonnes** (rounded, `vi-VN` thousands separators); keep the raw value in kg internally.
