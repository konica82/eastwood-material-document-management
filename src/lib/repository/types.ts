/**
 * Repository interface contract for Hồ sơ nguyên liệu.
 *
 * Every data access goes through these interfaces. No Sheets API calls, no
 * fetch(), no SQL — ever — in components or pages. The adapters behind these
 * interfaces own that detail.
 *
 * Scoping rule: every method takes plantId as its first argument. The adapter
 * resolves plantId → spreadsheet ID and namespaces cache keys by plantId so
 * plants never see each other's data.
 */

import type {
  Cargo,
  CargoStatus,
  Driver,
  Material,
  Supplier,
  SecondarySupplier,
  WeighingSlip,
  PlotRegistry,
  ActivityLogEntry,
  DashboardMetrics,
  ActivityAction,
  User,
} from "../../types/index";
import type { ListQuery } from "../../types/api";

// ─── Base repository ──────────────────────────────────────────────────────────

/**
 * The minimum surface every entity repository must implement.
 * `create` is intentionally absent here — only entities the web app owns
 * expose it, via `CreatableRepository`.
 */
export interface Repository<T> {
  /**
   * List records for a plant. Always plant-scoped; query is optional filtering
   * on top. Returns an empty array (never throws) when there are no results.
   */
  list(plantId: string, query?: ListQuery): Promise<T[]>;

  /** Returns null when the record does not exist; never throws for a miss. */
  get(plantId: string, id: string): Promise<T | null>;

  /**
   * Partial update. The adapter merges `patch` onto the existing record,
   * sets `updated_at` / `updated_by` server-side, and returns the full
   * updated record.
   */
  update(plantId: string, id: string, patch: Partial<T>): Promise<T>;
}

/**
 * Extends the base for entities the web app is allowed to create.
 * (Driver creation stays in the gate AppSheet app — DriverRepository does
 * NOT extend this.)
 */
export interface CreatableRepository<T, TCreate> extends Repository<T> {
  /**
   * Create a new record. Server-set fields (id, created_at, created_by,
   * updated_at, updated_by, and any stored derivations) must NOT be in
   * TCreate — the adapter fills them.
   */
  create(plantId: string, data: TCreate): Promise<T>;
}

// ─── Create-input types ───────────────────────────────────────────────────────

/** Fields a caller must supply when creating a new cargo record. */
export type CreateCargoInput = Omit<
  Cargo,
  // Server-set on create:
  | "id"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  // Stored derivations written by the server (Business Rules 1–3):
  | "stt_tai"
  | "thoi_gian_cho"
  | "tong_thoi_gian_can"
  // Lifecycle fields that only exist after events fire:
  | "hoan_thanh_luc"
  | "so_phieu_can"
  // Joined objects — pass IDs, not resolved objects:
  | "tai_xe"
  | "nguyen_lieu"
  | "nha_cung_cap"
  | "nha_cung_cap_phu"
  | "plot"
  | "phieu_can"
  // Computed when plot is set:
  | "khoang_cach_nha_may"
>;

/** Fields required to append an activity-log entry. */
export type AppendActivityLogInput = Pick<
  ActivityLogEntry,
  "plant_id" | "entity_type" | "entity_id" | "action" | "description"
>;

// ─── Entity-specific repositories ────────────────────────────────────────────

export interface CargoRepository
  extends CreatableRepository<Cargo, CreateCargoInput> {
  /**
   * Transition a cargo to a new status. The adapter enforces the allowed
   * state machine (Chờ lượt → Đang xử lý → Hoàn thành; any → Hủy lượt)
   * and stamps completion time server-side when reaching Hoàn thành.
   */
  updateStatus(
    plantId: string,
    cargoId: string,
    status: CargoStatus,
    /** Required when status is "Hủy lượt". */
    ly_do_huy?: string,
  ): Promise<Cargo>;

  /**
   * Mark HSLS dossier as complete. The adapter validates all required fields
   * across the cargo record before accepting; returns a validation error
   * shape if any are missing.
   */
  completeDossier(plantId: string, cargoId: string): Promise<Cargo>;
}

export interface WeighingSlipRepository extends Repository<WeighingSlip> {
  /**
   * Record the first weigh (inbound). Computes and stores wait duration
   * (Business Rule 2) and transitions the linked cargo to Đang xử lý.
   */
  recordWeighIn(
    plantId: string,
    cargoId: string,
    dlc_ngay_can_vao: string, // ISO 8601
    dlc_can_vao: number,      // kg
  ): Promise<WeighingSlip>;

  /**
   * Record the second weigh (outbound). Computes and stores net weight and
   * total weighing duration (Business Rules 3).
   */
  recordWeighOut(
    plantId: string,
    phieu_can_id: string,
    dlc_ngay_can_ra: string, // ISO 8601
    dlc_can_ra: number,      // kg
  ): Promise<WeighingSlip>;
}

/** Drivers are read + editable by the web app; creation belongs to the gate app. */
export interface DriverRepository extends Repository<Driver> {
  /** Look up a driver by vehicle plate number across the accessible plants. */
  findByPlate(plantId: string, so_xe: string): Promise<Driver | null>;
}

export interface MaterialRepository extends Repository<Material> {}

export interface UserRepository {
  /**
   * Returns the currently-authenticated user with their plant access list.
   * Phase 1: backed by a mock; Step 6 wires in a real session/auth source.
   */
  getCurrentUser(): Promise<User>;
}

export interface SupplierRepository extends Repository<Supplier> {
  /** Find all secondary suppliers linked to a given primary supplier. */
  listSecondary(
    plantId: string,
    primarySupplierId: string,
  ): Promise<SecondarySupplier[]>;

  /** Look up a single secondary supplier by its own ID. */
  getSecondary(
    plantId: string,
    id: string,
  ): Promise<SecondarySupplier | null>;

  /**
   * Partial update for a secondary supplier. Same semantics as `update` —
   * adapter merges the patch, sets `updated_at` server-side, returns the
   * full updated record.
   */
  updateSecondary(
    plantId: string,
    id: string,
    patch: Partial<SecondarySupplier>,
  ): Promise<SecondarySupplier>;
}

export interface PlotRepository extends Repository<PlotRegistry> {
  /**
   * Return the polygon boundary and owner list for a single plot.
   * These are populated on the returned object's `polygon` and `owners` fields.
   */
  getWithDetails(plantId: string, plotId: string): Promise<PlotRegistry | null>;
}

/**
 * Append-only log — no update or delete.
 * Scoped to a plant but list() can cross-plant for admin views.
 */
export interface ActivityLogRepository {
  list(plantId: string, query?: ListQuery): Promise<ActivityLogEntry[]>;
  append(entry: AppendActivityLogInput): Promise<ActivityLogEntry>;
}

/**
 * The dashboard is not a CRUD entity; it has no list/get/update.
 * Its single method aggregates across the cargo table for the active plant.
 */
export interface DashboardRepository {
  getMetrics(plantId: string): Promise<DashboardMetrics>;
}
