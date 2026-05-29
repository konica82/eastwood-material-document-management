# Claude Code Prompt — Phase 1: Google Sheets Integration

Paste this entire prompt into Claude Code to execute the Google Sheets adapter implementation.

---

## Context

You are working on **Hồ sơ nguyên liệu** — a Next.js (App Router) + TypeScript web app that replaces a Google AppSheet system managing raw-material cargo intake at Vietnamese factory sites (NMXH, NMQM, NMCT).

The project already has:
- A **repository pattern** at `src/lib/repository/` with a `mock/` adapter and a `types.ts` interface contract
- **Mock data** for all entities: `cargo`, `driver`, `material`, `plot`, `supplier`, `user`, `weighing-slip`, `activity-log`, `dashboard`
- A `plants` config mapping `plantId` → spreadsheet IDs, Drive folder IDs, display name, timezone
- Next.js Route Handlers for API endpoints
- TanStack Query on the client, Zod for validation

The goal of this task is to implement a **Google Sheets adapter** that satisfies the same repository interface as the mock, so the app can be switched from fake data to live data by changing an environment variable.

---

## Your Task

Implement the Google Sheets adapter at `src/lib/repository/google-sheets/`. When `REPOSITORY_ADAPTER=google-sheets` (or `USE_MOCK` is falsy), the app uses this adapter. The mock adapter remains untouched and must continue to work when `USE_MOCK=true`.

---

## Entities to implement

Implement the Sheets adapter for **all of the following entities**, in the order listed (dependencies first):

1. `user` — `Users` sheet, contains plant access and roles per user
2. `material` — `NguyenLieu` sheet, material catalog
3. `driver` — `TaiXe` sheet, read + edit only (no create)
4. `supplier` — `NhaCungCap` (primary) and `NhaCungCapPhu` (secondary) sheets
5. `plot` — `PlotRegistry`, `PlotOwners`, `PolygonCoordinates`, `PlotDocuments` sheets
6. `weighing-slip` — `PhieuCan` and `DuLieuCan` sheets
7. `cargo` — `DanhSachXeHang` sheet (~96 columns, the core entity — implement last)
8. `activity-log` — `ActivityLog` sheet, append-only
9. `dashboard` — aggregated reads across cargo and weighing-slip; no direct sheet

---

## Implementation requirements

### 1. Sheets client (`src/lib/sheets-client.ts`)

- Use the `googleapis` npm package (`google-auth-library` + `googleapis`)
- Authenticate via a **service account** using credentials from environment variables:
  ```
  GOOGLE_SERVICE_ACCOUNT_EMAIL
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   # may contain literal \n — handle the newline replacement
  ```
- Expose a typed `getSheetsClient()` singleton (lazy-init, module-level)
- Expose a `getDriveClient()` singleton for file operations (photos, documents)
- All errors from the Sheets API must be caught and re-thrown as typed `SheetsError` with the original status code attached, so the caller can distinguish 429 (rate limit) from 404 (not found) from 500

### 2. Plant config (`src/lib/plants/`)

The plants config must map each `plantId` to:
```ts
interface PlantConfig {
  plantId: string;           // e.g. "NMXH"
  displayName: string;
  spreadsheetId: string;     // from env: SHEETS_ID_NMXH, SHEETS_ID_NMQM, SHEETS_ID_NMCT
  driveFolderId: string;     // from env: DRIVE_FOLDER_NMXH, etc.
  timezone: string;          // "Asia/Ho_Chi_Minh"
  address: string;
}
```

Read spreadsheet IDs and folder IDs from environment variables, never hardcode them.

### 3. Repository interface

Each entity adapter must implement the interface already defined in `src/lib/repository/types.ts`. Do not change the interface — implement against it exactly. If the existing interface lacks a method you need, add the method to the interface AND update the mock to include a no-op stub for it.

The interface is:
```ts
interface Repository<T> {
  list(plantId: string, query?: ListQuery): Promise<T[]>;
  get(plantId: string, id: string): Promise<T | null>;
  update(plantId: string, id: string, patch: Partial<T>): Promise<T>;
  // create is only exposed for entities the web app owns
}
```

### 4. Row ↔ entity mapping

Each adapter file must contain:
- A `rowToEntity(row: string[])` function — maps a raw Sheets row (array of cell values) to the typed entity
- An `entityToRow(entity: T)` function — maps back for writes
- Column index constants at the top of the file (never use magic numbers)

Preserve the original column names from AppSheet (e.g. `DanhSachXeHang`, `NhaCungCap`) in the data layer. Never expose them in the UI — the UI uses Vietnamese display labels.

### 5. Caching (`src/lib/cache.ts`)

Implement a simple in-memory cache (for dev/single-instance) with the following API:
```ts
cache.get<T>(key: string): T | null
cache.set<T>(key: string, value: T, ttlSeconds: number): void
cache.invalidate(pattern: string): void   // glob-style, e.g. "cargo:NMXH:*"
```

Cache keys must be namespaced by `plantId`: `"{entity}:{plantId}:{id}"` for single records, `"{entity}:{plantId}:list:{queryHash}"` for lists.

TTLs:
- Reference data (materials, suppliers, plots, drivers): 5 minutes
- Cargo list: 30 seconds
- Cargo detail: 60 seconds
- Dashboard aggregates: 60 seconds
- User/auth data: 10 minutes

Leave a TODO comment where Redis would slot in: `// TODO: replace with Redis adapter for multi-instance`

### 6. Write batching + rate-limit handling

- Wrap all `sheets.spreadsheets.values.update` and `.append` calls in a write queue that batches operations within a 200 ms window before flushing
- On any 429 response, retry with exponential backoff: 1 s, 2 s, 4 s, max 3 retries
- After 3 retries, throw a `QuotaExceededError` — the API layer catches this and returns HTTP 503 to the client
- Log each retry attempt with the entity, operation, and retry count

### 7. Environment variables

Add all required environment variables to `.env.example` (never `.env`). Required vars:
```
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=

# Spreadsheet IDs (one per plant)
SHEETS_ID_NMXH=
SHEETS_ID_NMQM=
SHEETS_ID_NMCT=

# Drive folder IDs (one per plant)
DRIVE_FOLDER_NMXH=
DRIVE_FOLDER_NMQM=
DRIVE_FOLDER_NMCT=

# Adapter toggle
REPOSITORY_ADAPTER=mock   # set to "google-sheets" to use live data
```

### 8. Adapter factory (`src/lib/repository/index.ts`)

Update the repository factory to switch on `REPOSITORY_ADAPTER`:
```ts
export function getRepository(entity: EntityName): Repository<unknown> {
  const adapter = process.env.REPOSITORY_ADAPTER ?? 'mock';
  if (adapter === 'google-sheets') return googleSheetsAdapters[entity];
  return mockAdapters[entity];   // existing mock, unchanged
}
```

---

## Business rules to implement in the adapter layer

These computed values must be calculated server-side on write — do not leave them to the UI:

1. **Per-day cargo sequence number** — on cargo create: count existing cargos for `(plantId, today)` + 1. Scoped by plant. Store on the row; never recompute on read.
2. **Wait duration** — on weighing-slip create (weigh-in time recorded): `weigh_in_time - cargo.created_at`. Store on the cargo row.
3. **Total weighing duration** — on weigh-out recorded: `weigh_out_time - weigh_in_time`. Store on the cargo row.
4. **Net weight** — on weighing-slip update: `weight_in - weight_out`. Store on the slip row.
5. **Completion timestamp** — when cargo status transitions to `Hoàn thành`: stamp `completed_at = now()`. Store on the cargo row.
6. **Activity log entries** — append an activity-log row on every cargo create, update, status change, and delete. Fields: `entity_type`, `entity_id`, `plant_id`, `action`, `changed_by`, `changed_at`, `diff` (JSON of changed fields).

> Note: Distance-from-factory computation (rule 7 in Business_Rules.md) requires a maps API call — implement as a stub that logs a TODO for now.

---

## Drive integration (for photos and documents)

Implement `src/lib/drive-client.ts` with:
```ts
uploadFile(plantId: string, file: Buffer, filename: string, mimeType: string): Promise<{ fileId: string; webViewLink: string }>
getFileStream(fileId: string): Promise<ReadableStream>
deleteFile(fileId: string): Promise<void>
```

Files are uploaded to the plant-specific Drive folder (`driveFolderId` from the plant config). Return the `webViewLink` so the UI can open or thumbnail the file. Do not store file contents in Sheets — store only the Drive file ID and link.

---

## Testing

For each adapter, write a minimal integration test file at `src/lib/repository/google-sheets/__tests__/{entity}.test.ts` that:
- Mocks the `googleapis` client (do not make real API calls in tests)
- Tests `rowToEntity` and `entityToRow` round-trips for at least 3 representative rows per entity
- Tests that a 429 response triggers retry logic
- Tests that cache hits skip the Sheets API call

---

## File structure to produce

```
src/lib/
  sheets-client.ts          # Sheets + Drive API singletons
  drive-client.ts           # Drive upload/download/delete
  cache.ts                  # In-memory cache with TTL
  repository/
    types.ts                # Interface contract (update if needed)
    index.ts                # Factory — updated to switch on REPOSITORY_ADAPTER
    mock/                   # Unchanged
    google-sheets/
      index.ts              # Exports all entity adapters
      base.ts               # Shared helpers (read range, write range, batch queue)
      user.ts
      material.ts
      driver.ts
      supplier.ts
      plot.ts
      weighing-slip.ts
      cargo.ts              # Most complex — implement last
      activity-log.ts
      dashboard.ts
      __tests__/
        user.test.ts
        material.test.ts
        driver.test.ts
        supplier.test.ts
        plot.test.ts
        weighing-slip.test.ts
        cargo.test.ts
        activity-log.test.ts
```

---

## Constraints

- **No business logic in the adapter.** The adapter reads/writes rows and maps them to entities. Business rules (computed fields, status transitions) belong in a service layer above the adapter — create `src/lib/services/{entity}.service.ts` for any logic that isn't pure mapping.
- **No Sheets-specific code outside `src/lib/repository/google-sheets/` and `src/lib/sheets-client.ts`.** If a route handler needs to do something Sheets-specific, it's in the wrong place.
- **TypeScript strict mode.** No `any` types except in the raw row arrays before they are mapped to entities.
- **Do not modify the mock adapter.** It must continue to work unchanged.
- **Do not hardcode spreadsheet IDs, folder IDs, or credentials** anywhere in source code.
- **Do not install additional auth libraries** beyond `googleapis` (which includes `google-auth-library`).

---

## Install the required package first

```bash
npm install googleapis
npm install --save-dev @types/node
```

---

## Definition of done

- [ ] `REPOSITORY_ADAPTER=mock npm run dev` works exactly as before (mock data, no API calls)
- [ ] `REPOSITORY_ADAPTER=google-sheets npm run dev` with valid credentials and real spreadsheet IDs returns live data in every module
- [ ] All `rowToEntity` / `entityToRow` round-trip tests pass
- [ ] Retry logic test passes (mock 429 → retries → succeeds)
- [ ] Cache test passes (second call returns cached value without hitting API)
- [ ] `.env.example` is updated with all required variables
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] No hardcoded IDs or credentials anywhere in source

Start with `sheets-client.ts`, `cache.ts`, and the `base.ts` shared helpers, then implement entity adapters in dependency order. Implement `cargo.ts` last.
