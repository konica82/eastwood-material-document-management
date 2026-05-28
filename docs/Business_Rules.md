# Business Rules — Hồ sơ nguyên liệu Web App

Plain-English specification of the calculated values and derived fields the web app must implement. Use alongside the PRD and Design Brief.

---

## How to read this document

These are **business rules**, not column mappings. Each rule describes a value the system computes — what triggers it, what inputs it uses, what the result represents, and where it surfaces in the UI. The implementation is the engineer's call; the rule is the contract.

The original AppSheet expressions are included at the end of each rule as a reference, only for cases where the engineer wants to sanity-check semantics against the legacy app. They are not the spec — the prose is.

**About the rest of the AppSheet formulas:** The legacy app has ~1,900 columns and ~140 formula-bearing columns. Almost all of them are AppSheet's workarounds for things Sheets can't do natively (joins, computed values, UI layout, audit fields). The web app gets those for free from React rendering, API joins, and middleware. **The 13 rules below are the only ones that carry real business logic.** Everything else can be ignored.

---

## Operational rules

### 1. Per-day cargo sequence number

**What it is:** Every cargo record gets a sequence number that resets daily.

**When it's set:** Once, on cargo creation. It does not change afterward.

**Scope:** Unique within a single `(plant_id, date)` pair. Two cargos created on the same day at the same plant get sequential numbers; the same day at a different plant has its own sequence starting from 1.

**Rule:** The next number is the count of cargos already created today at this plant, plus one. Store it on the row — do not recompute on read, or the number would shift if earlier records were ever deleted.

**Where it appears:** Shown next to the plate number in the cargo list and detail header, as a small operational identifier ("today's truck #3 at NMQM").

> AppSheet reference: `=IF(ISBLANK([stt_tai]), COUNT(SELECT(DanhSachXeHang[Id], DATE([created_date]) = TODAY())) + 1, [stt_tai])` — note this currently does not scope by plant, which is a latent bug in the legacy app worth fixing in the web version.

---

### 2. Wait duration before first weigh-in

**What it is:** How long a truck waited from arrival (cargo creation) until it began weighing.

**When it's computed:** On the write that records the weigh-in time. Null until weigh-in happens.

**Rule:** `weigh_in_time - created_at`, expressed as a duration. Store it on the cargo row so reports can aggregate it without recomputing.

**Where it appears:** Operational metrics in the dashboard and the cargo detail; useful for spotting bottlenecks at the gate or weighbridge.

> AppSheet reference: `=if(isnotblank([dlc_ngay_can_vao]), [dlc_ngay_can_vao] - [created_date], "")`

---

### 3. Total weighing duration

**What it is:** How long the full weighing process took, from weigh-in to weigh-out.

**When it's computed:** On the write that records the weigh-out time.

**Rule:** `weigh_out_time - weigh_in_time`. Store on the cargo row.

**Where it appears:** Cargo detail (Cân hàng tab) and weighbridge throughput reports.

> AppSheet reference: `=[dlc_ngay_can_ra] - [dlc_ngay_can_vao]`

---

## Driver rules

### 4. Driver — completed-delivery count

**What it is:** How many completed deliveries a driver has made.

**Scope:** Across all plants the requesting user can access. A user with access to NMQM and NMXH sees a count that spans both; a user with access to only NMQM sees only their plant's count.

**Rule:** Count of cargos linked to this driver where the cargo has reached the *Hoàn thành* (completed) status. Compute as an aggregate query when the driver record is read. Cache the result; invalidate when a cargo for this driver transitions to or from completed.

**Where it appears:** Driver list (sortable column) and driver detail header.

**Note:** The legacy app has two columns with identical logic (`so_lan_cho_hang` and `so_lan_giao_hang_hoan_thanh`). The web app exposes this once.

> AppSheet reference: `=count([Related DanhSachXeHangHoanThanhs])`

---

### 5. CCCD number parsed from QR scan string

**What it is:** A driver's national ID number, extracted from the raw string returned by a QR scan.

**When it's parsed:** On write, server-side, when a new scan string arrives on the driver record.

**Rule:** The QR scan returns a pipe-delimited string of CCCD fields. The CCCD number itself is the first segment (split by `|`, take index 1). Parse on the backend and store as a normal field.

**Note for this phase:** Driver records are created by the separate gate AppSheet app, so the web app will usually see this field already populated. This rule exists for the edit path and for any future case where the web app handles a scan.

> AppSheet reference: `=index(split([cccd_qrcode_scan], "|"), 1)`

---

## Traceability rules

### 6. Plot — total delivered tonnage

**What it is:** The cumulative tonnage of material delivered from a given forest plot, used for plot-level reporting and EUDR due-diligence summaries.

**Scope:** Calculated across all cargos referencing this plot, regardless of which plant they were delivered to.

**Rule:** Sum the cargo net weight (`trong_luong_hang`, in kilograms) for all *completed* cargos with this plot as their source. Convert to tonnes by dividing by 1000. Surface to one decimal place.

**Implementation:** Aggregate query at read time, cached and invalidated when any cargo from this plot is created, completed, or its weight is edited.

**Where it appears:** Plot detail (Thông tin tab) and plot-level reports.

> AppSheet reference: `=SUM([Related DanhSachXeHangs][trong_luong_hang]) / 1000.0`

---

## Dashboard rules

The home dashboard for the active plant shows six headline metrics. They are not stored values; they're computed on demand from a single dashboard endpoint, scoped to the active plant.

### 7. Cargo waiting count

Count of cargos with status `Chờ lượt` (waiting) at the active plant.

> AppSheet reference: `=COUNT(DanhSachXeHang_ChoLuot[id])`

### 8. Cargos registered today

Count of cargos with `created_date` falling on today (active plant's local date) at the active plant.

> AppSheet reference: `=Count(filter("DanhSachXeHang", [created_date_only_vc] = today()))`

### 9. Cargos completed today (with vehicle-type breakdown)

Count of cargos that reached *Hoàn thành* today, with a breakdown by vehicle type: truck (*Xe tải*), tractor (*Máy cày*), trailer (*Đầu kéo*).

**Implementation note:** The legacy app composes a display string like *"12 (8 truck, 3 tractor, 1 trailer)"*. The web app should return the structured object — `{total: 12, byVehicleType: {truck: 8, tractor: 3, trailer: 1}}` — and let the UI format it. This keeps the API clean and the formatting testable.

> AppSheet reference: composes the string in the column formula; web app should not.

### 10. Incomplete dossier count

Count of cargos at the active plant where the HSLS dossier is not yet marked complete (`hsls_hoan_thanh = false`).

> AppSheet reference: `=Count(filter("DanhSachXeHang_HoanThanh", [hsls_hoan_thanh] = FALSE))`

### 11. Completed dossier count

Count of cargos at the active plant where the HSLS dossier is marked complete (`hsls_hoan_thanh = true`).

> AppSheet reference: `=Count(filter("DanhSachXeHang_HoanThanh", [hsls_hoan_thanh] = TRUE))`

### 12. Cargo without weighing slip

Count of completed cargos at the active plant where the weighing slip reference is empty. Surfaces operational gaps for managers to chase up.

> AppSheet reference: `=count(filter("DanhSachXeHang_HoanThanh", isblank([so_phieu_can])))`

---

## A note on what's *not* in this document

This covers the calculated/derived values in the AppSheet column formulas. Two other categories of business logic are out of scope here and need their own treatment:

**Validation rules** (the AppSheet `Valid_If` and `Required_If` expressions, roughly 54 and 24 of them respectively). These govern form behaviour and the HSLS completion gate. They cannot be reliably extracted from the documentation export and need to be pulled directly from the AppSheet editor before form-related modules are built.

**Bots and Processes.** The AppSheet automations — activity log writer, transaction-ledger syncer, completion-time stamper, distance-to-factory calculator — encode workflow logic that isn't in the column formulas. They need a separate audit.

Treat this document as one of three required references for faithful behaviour:

- This — calculated values (done)
- Validation rules audit (pending; needs an AppSheet editor session)
- Bots and Processes audit (pending; needs an AppSheet editor session)

---

## Engineering shape

All 13 rules fit comfortably into a single backend module — call it `derivations` or `computed-fields` — alongside the repository interfaces. Each rule is a pure function with explicit inputs and a unit test. Total surface is small: perhaps 300 lines of TypeScript across the rules and their tests.

The rules split naturally into two groups by where they live:

- **Stored derivations** (rules 1, 2, 3, 5): values written to a row on create or update. The backend writes them; the UI reads them like any other field.
- **Query-time aggregations** (rules 4, 6, 7–12): values computed by aggregating across rows. Implemented as functions invoked when the relevant entity or dashboard is requested. Cached with sensible invalidation.

There is no need for any data-model concept called a "virtual column" or "computed column" in the web app. Each rule is just a function.
