# Claude Code Prompt — Phase 1 Completion: API Routes, Auth & Activity Log Wiring

Paste this entire prompt into Claude Code. This is the follow-up to the Google Sheets adapter task. The adapter exists and is correct — this task wires it into the running application so pages use live data, auth is real, and the activity log fires on every write.

---

## What exists today

- `src/lib/repository/google-sheets/` — complete Sheets adapter for all entities
- `src/lib/repository/mock/` — complete mock adapter, still working
- `src/lib/repository/index.ts` — factory switching on `REPOSITORY_ADAPTER`
- All UI modules built and rendering with mock data
- `getCurrentUser()` returns the first row from the Users sheet as a placeholder (not real auth)
- Activity log adapter exists but nothing calls `append()` yet
- No `app/api/` route handlers exist — pages call the repository directly (client-side only, mock only)

---

## Your Task: 6 items, in priority order

Work through these in order. Each item has a clear definition of done.

---

## Item 1 — Next.js Route Handlers (the critical gap)

**Why this matters:** The Sheets adapter runs server-side only (it uses service account credentials that must never reach the browser). Currently, pages call `getRepository()` directly from the client, which works for mock data but will never work for Sheets. Route Handlers fix this: the page calls `/api/cargo`, the Route Handler calls `getServerRepository()` with the real adapter, data flows.

**What to build:**

Create Route Handlers at `src/app/api/` for every entity. Follow this exact structure for each:

```
src/app/api/
  cargo/
    route.ts          # GET /api/cargo  (list)
    [id]/
      route.ts        # GET /api/cargo/[id]  (detail)
                      # PATCH /api/cargo/[id]  (update)
  cargo/[id]/status/
    route.ts          # PATCH /api/cargo/[id]/status  (status transition only)
  weighing/
    route.ts          # GET /api/weighing
    [id]/
      route.ts        # GET /api/weighing/[id], PATCH /api/weighing/[id]
  drivers/
    route.ts          # GET /api/drivers
    [id]/
      route.ts        # GET /api/drivers/[id], PATCH /api/drivers/[id]
  suppliers/
    route.ts          # GET /api/suppliers
    [id]/
      route.ts        # GET /api/suppliers/[id], PATCH /api/suppliers/[id]
  materials/
    route.ts          # GET /api/materials
    [id]/
      route.ts        # GET /api/materials/[id], PATCH /api/materials/[id]
  plots/
    route.ts          # GET /api/plots
    [id]/
      route.ts        # GET /api/plots/[id], PATCH /api/plots/[id]
  dashboard/
    route.ts          # GET /api/dashboard
  activity-log/
    route.ts          # GET /api/activity-log
  photos/
    route.ts          # POST /api/photos  (upload to Drive)
    [id]/
      route.ts        # DELETE /api/photos/[id]
```

**Rules for every Route Handler:**

1. **Plant scoping** — read `plantId` from the `x-plant-id` request header. Validate it against the authenticated user's accessible plants. Return `403` if the user doesn't have access to that plant.

2. **Auth guard** — call `getCurrentUser(request)` at the top of every handler. Return `401` if no session. (Auth is a placeholder for now — see Item 2 — but the guard must be in place so adding real auth later is a one-line change.)

3. **Role guard** — enforce minimum role per operation:
   - `GET` → any authenticated user with plant access
   - `PATCH` on cargo, weighing, photos → `User` role or above
   - `PATCH` on suppliers, plots, materials, drivers → `Manager` role or above
   - `PATCH` on `/status` → follow the status transition rules (see PRD section 5.5)

4. **Zod validation** — parse every request body with a Zod schema before it reaches the repository. Return `400` with the validation error details if parsing fails. Keep the Zod schemas in `src/lib/schemas/{entity}.ts` — not inline in the route handler.

5. **Error mapping** — catch `QuotaExceededError` → `503`. Catch `SheetsError` with status 404 → `404`. All other errors → `500`. Return JSON `{ error: string, code: string }`.

6. **Response shape** — always return `{ data: T }` for success, `{ error: string, code: string }` for errors. Never return a bare array or bare object.

7. **`plantId` in every repo call** — every call to `getServerRepository()` must pass `plantId`. No exceptions.

**Updating the client pages:**

After creating the Route Handlers, update every page and component that currently calls `getRepository()` directly to call the API routes instead via TanStack Query. The pattern is:

```ts
// Before (mock only, client-side)
const repo = getRepository('cargo');
const cargo = await repo.list(plantId);

// After (works with any adapter, proper server boundary)
const { data } = useQuery({
  queryKey: ['cargo', plantId, filters],
  queryFn: () => fetch(`/api/cargo?plantId=${plantId}`).then(r => r.json()).then(r => r.data),
});
```

Update the TanStack Query calls across all modules. The query keys must include `plantId` so plant-switching triggers a fresh fetch.

**Definition of done — Item 1:**
- [ ] Every entity has GET + PATCH route handlers
- [ ] All client-side `getRepository()` calls are replaced with fetch calls to `/api/`
- [ ] Plant-switching triggers a refetch (plantId is in the query key)
- [ ] Role enforcement is in every PATCH handler
- [ ] `npm run type-check` passes

---

## Item 2 — Authentication (Google OAuth via NextAuth)

**What to build:**

Wire NextAuth.js with the Google provider. Users sign in with their existing Google accounts. On sign-in, look up the user's email in the `Users` sheet to get their plants and roles. If the email isn't found, put them in an "awaiting approval" state.

**Steps:**

1. Install: `npm install next-auth`

2. Create `src/app/api/auth/[...nextauth]/route.ts`:
```ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Attach the user's plants and roles from the Users sheet to the session
      const appUser = await getUserByEmail(session.user.email);
      session.user.plants = appUser?.plants ?? [];
      session.user.role = appUser?.role ?? null;
      session.user.appUserId = appUser?.id ?? null;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

3. Create `src/app/auth/signin/page.tsx` — a simple sign-in page with a "Sign in with Google" button. Match the app's design tokens.

4. Create `src/app/auth/error/page.tsx` — shows "Your account is awaiting approval" when `appUser` is null.

5. Create `src/middleware.ts` — protect all routes except `/auth/*`:
```ts
export { auth as middleware } from '@/app/api/auth/[...nextauth]/route';
export const config = { matcher: ['/((?!auth|_next/static|_next/image|favicon.ico).*)'] };
```

6. Replace the `getCurrentUser()` placeholder in all Route Handlers with:
```ts
import { auth } from '@/app/api/auth/[...nextauth]/route';
const session = await auth();
if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

7. Add to `.env.example`:
```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
NEXTAUTH_SECRET=        # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

8. Add a sign-out button to the user avatar menu in the header.

**Definition of done — Item 2:**
- [ ] Unauthenticated users are redirected to `/auth/signin`
- [ ] Signing in with a Google account in the Users sheet lands on the app with the correct plant list
- [ ] Signing in with an unknown email shows the "awaiting approval" page
- [ ] Session contains `plants`, `role`, and `appUserId`
- [ ] Sign-out clears the session and redirects to `/auth/signin`
- [ ] `npm run type-check` passes

---

## Item 3 — Activity Log Wiring

**What to build:**

The activity log adapter can append rows. Nothing calls it yet. Wire it into the cargo service so every significant action produces a log entry.

**Where to add calls** — in `src/lib/services/cargo.service.ts` (or wherever the cargo write logic lives), call `activityLogRepo.append()` after every successful:

| Trigger | `action` value | `diff` contents |
|---|---|---|
| Cargo created | `cargo.created` | Full new cargo object |
| Cargo updated | `cargo.updated` | `{ before: {changed fields only}, after: {changed fields only} }` |
| Status changed | `cargo.status_changed` | `{ from: oldStatus, to: newStatus }` |
| Cargo cancelled | `cargo.cancelled` | `{ reason: cancelReason }` |
| Weighing slip linked | `weighing.linked` | `{ slip_id, cargo_id }` |
| Completion confirmed | `cargo.completed` | `{ completed_at, confirmed_by }` |

**Log entry shape** (must match the `ActivityLog` sheet column layout):
```ts
interface ActivityLogEntry {
  id: string;           // generate with crypto.randomUUID()
  entity_type: string;  // e.g. "cargo"
  entity_id: string;
  plant_id: string;
  action: string;
  changed_by: string;   // session user's appUserId
  changed_at: string;   // ISO timestamp
  diff: string;         // JSON.stringify of the diff object
}
```

**Rules:**
- Log writes are fire-and-forget — do NOT await them in the request path. Use `void activityLogRepo.append(...)`. A failed log write must never fail the main operation.
- Log writes go through the same write-batch queue as other Sheets writes, so they don't add extra API calls.

**Definition of done — Item 3:**
- [ ] Creating a cargo produces a `cargo.created` log entry in the ActivityLog sheet
- [ ] Changing cargo status produces a `cargo.status_changed` entry
- [ ] A failed log write does not return an error to the client
- [ ] Log entries are visible in `/api/activity-log?plantId=NMXH`

---

## Item 4 — Vitest Setup + Run Existing Tests

**What to build:**

The test files exist at `src/lib/repository/google-sheets/__tests__/`. Set up Vitest so `npm test` runs them.

**Steps:**

1. Install: `npm install --save-dev vitest @vitest/coverage-v8 vite-tsconfig-paths`

2. Create `vitest.config.ts` at the project root:
```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/repository/mock/**', '**/*.d.ts'],
    },
  },
});
```

3. Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

4. Run `npm test`. Fix any failing tests — the most likely issues are:
   - Import path aliases not resolving (`@/lib/...`) — `vite-tsconfig-paths` handles this
   - `googleapis` mock not set up — add `vi.mock('googleapis')` at the top of each test file if missing
   - Environment variables not set in tests — add a `vitest.setup.ts` that sets the required env vars to dummy values

5. Create `vitest.setup.ts`:
```ts
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'test@test.iam.gserviceaccount.com';
process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\nMOCK\n-----END RSA PRIVATE KEY-----';
process.env.SHEETS_ID_NMXH = 'mock-sheet-id-nmxh';
process.env.SHEETS_ID_NMQM = 'mock-sheet-id-nmqm';
process.env.SHEETS_ID_NMCT = 'mock-sheet-id-nmct';
process.env.DRIVE_FOLDER_NMXH = 'mock-drive-nmxh';
process.env.DRIVE_FOLDER_NMQM = 'mock-drive-nmqm';
process.env.DRIVE_FOLDER_NMCT = 'mock-drive-nmct';
process.env.REPOSITORY_ADAPTER = 'google-sheets';
```

Reference it in `vitest.config.ts`: `setupFiles: ['./vitest.setup.ts']`

**Definition of done — Item 4:**
- [ ] `npm test` runs and exits with no errors
- [ ] All existing `__tests__` files pass
- [ ] `npm run test:coverage` produces a coverage report
- [ ] No test makes a real network call

---

## Item 5 — Business Rules 7–13 (Dashboard Aggregations)

**Context:** Business Rules 7–12 are the dashboard metrics. They are NOT stored values — they're computed on request from the cargo and weighing-slip data. They should be implemented as pure functions in `src/lib/services/dashboard.service.ts` and called from `GET /api/dashboard`.

Rules 7–12 from `docs/Business_Rules.md`:

| Rule | Metric | Computation |
|---|---|---|
| 7 | Cargo waiting count | `COUNT(cargo WHERE status = 'Chờ lượt' AND plant = plantId)` |
| 8 | Cargos registered today | `COUNT(cargo WHERE DATE(created_at) = today AND plant = plantId)` |
| 9 | Completed today by vehicle type | `COUNT + GROUP BY vehicle_type WHERE completed_date = today AND plant = plantId` |
| 10 | Incomplete dossier count | `COUNT(cargo WHERE hsls_hoan_thanh = false AND plant = plantId)` |
| 11 | Completed dossier count | `COUNT(cargo WHERE hsls_hoan_thanh = true AND plant = plantId)` |
| 12 | Cargos without weighing slip | `COUNT(cargo WHERE status = 'Hoàn thành' AND weighing_slip_id IS NULL AND plant = plantId)` |

**Also implement Rule 6** (Plot total delivered tonnage) in `src/lib/services/plot.service.ts`:
- `SUM(cargo.net_weight WHERE plot_id = plotId AND status = 'Hoàn thành') / 1000` → tonnes
- Called when a plot detail is fetched; cached 60 s; invalidated when any cargo for this plot is updated

**Implementation:**

1. Create `src/lib/services/dashboard.service.ts`:
```ts
export async function getDashboardMetrics(plantId: string): Promise<DashboardMetrics> {
  // Fetch cargo list for the plant (uses cache)
  // Run rules 7–12 as filter/reduce operations over the result
  // Return structured object — no string formatting here
}

interface DashboardMetrics {
  waitingCount: number;
  registeredToday: number;
  completedToday: { total: number; byVehicleType: { truck: number; tractor: number; trailer: number } };
  incompleteDossierCount: number;
  completedDossierCount: number;
  noWeighingSlipCount: number;
}
```

2. Use Vietnam local date (`Asia/Ho_Chi_Minh`) when comparing "today" — do not use UTC.

3. Wire into `GET /api/dashboard` route handler.

4. Add unit tests in `src/lib/services/__tests__/dashboard.service.test.ts` using mock cargo data. Test each metric independently.

**Definition of done — Item 5:**
- [ ] `GET /api/dashboard?plantId=NMXH` returns all 6 metrics
- [ ] "Today" comparisons use Vietnam local time
- [ ] Each metric has a unit test
- [ ] `npm test` still passes

---

## Item 6 — Column Mapping Verification Helper

**Context:** The Sheets adapter assumes column layouts (A=id, B=name, etc.). These need to be verified against the real spreadsheet before going live. Rather than doing this manually, build a CLI tool that does it automatically.

**What to build:**

Create `src/scripts/verify-column-mapping.ts` — a script that, when run with real credentials, reads the header row of each sheet and compares it against the column index constants defined in each adapter file.

```ts
// Usage: npx ts-node src/scripts/verify-column-mapping.ts --plant NMXH
// Output: a table showing each sheet, each expected column, and whether it matches

import { getSheetsClient } from '@/lib/sheets-client';
import { getPlantConfig } from '@/lib/plants';
import * as cargoColumns from '@/lib/repository/google-sheets/cargo';
// ... import all entity column constants

async function verifyPlant(plantId: string) {
  const plant = getPlantConfig(plantId);
  const sheets = getSheetsClient();
  
  const sheetsToVerify = [
    { name: 'DanhSachXeHang', columns: cargoColumns.COLUMNS },
    { name: 'PhieuCan', columns: weighingColumns.COLUMNS },
    { name: 'TaiXe', columns: driverColumns.COLUMNS },
    { name: 'NhaCungCap', columns: supplierColumns.COLUMNS },
    { name: 'NguyenLieu', columns: materialColumns.COLUMNS },
    { name: 'PlotRegistry', columns: plotColumns.COLUMNS },
    { name: 'Users', columns: userColumns.COLUMNS },
  ];

  for (const sheet of sheetsToVerify) {
    const headerRow = await sheets.spreadsheets.values.get({
      spreadsheetId: plant.spreadsheetId,
      range: `${sheet.name}!1:1`,
    });
    const actualHeaders = headerRow.data.values?.[0] ?? [];
    compareAndReport(sheet.name, sheet.columns, actualHeaders);
  }
}
```

The output should clearly show:
- ✅ Column name matches at the expected index
- ⚠️ Column found but at a different index (auto-correction needed)
- ❌ Column not found in the sheet at all (mapping gap)

Export a JSON report to `column-mapping-report.json` in the project root.

**Definition of done — Item 6:**
- [ ] Script runs with `npx ts-node src/scripts/verify-column-mapping.ts --plant NMXH`
- [ ] Produces a readable console table and a JSON report
- [ ] Does not require any code changes to run — just real credentials in `.env.local`

---

## Constraints (all carry over from the previous prompt)

- No business logic in adapters. Logic belongs in service files.
- No Sheets-specific code outside `src/lib/repository/google-sheets/` and `src/lib/sheets-client.ts`.
- TypeScript strict mode. No `any` except raw row arrays.
- Do not modify the mock adapter.
- Do not hardcode IDs or credentials.
- All route handlers return `{ data: T }` on success, `{ error, code }` on failure.

---

## Overall Definition of Done

- [ ] `REPOSITORY_ADAPTER=mock npm run dev` — app works exactly as before with mock data
- [ ] `REPOSITORY_ADAPTER=google-sheets npm run dev` with `.env.local` populated — app shows live Sheets data in all modules
- [ ] Plant-switching in the header refetches all data for the selected plant
- [ ] Signing in with Google works; unknown emails see "awaiting approval"
- [ ] Activity log rows appear in the ActivityLog sheet after cargo actions
- [ ] Dashboard shows live metrics from real cargo data
- [ ] `npm test` passes with no real network calls
- [ ] `npm run type-check` passes
- [ ] Column mapping verification script runs and produces a report

Tackle items in order 1 → 2 → 3 → 4 → 5 → 6. Items 1 and 2 are blocking — nothing works end-to-end until they're done.
