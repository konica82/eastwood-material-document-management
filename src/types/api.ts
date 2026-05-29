/**
 * API contract types — request shapes, response envelopes, and query helpers.
 *
 * These are the only types that cross the network boundary. Domain types
 * (src/types/index.ts) describe the data model; these types describe how
 * the UI asks for and receives that data.
 */

// ─── Queries ──────────────────────────────────────────────────────────────────

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Arbitrary key-value filters; the repository layer interprets these. */
  filters?: Record<string, string | number | boolean | null>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** ISO date string (YYYY-MM-DD) — inclusive lower bound on created_at. */
  dateFrom?: string;
  /** ISO date string (YYYY-MM-DD) — inclusive upper bound on created_at. */
  dateTo?: string;
}

// ─── Plant scoping ────────────────────────────────────────────────────────────

/**
 * Every request that touches plant-scoped data must carry a plantId.
 * The server validates that the authenticated user has access to that plant.
 */
export interface PlantScopedRequest {
  plantId: string;
}

// ─── Response envelope ────────────────────────────────────────────────────────

/**
 * Wraps every API response. Components destructure `data`; they never
 * inspect raw fetch results directly.
 *
 * `loading` is managed by TanStack Query and only meaningful when this type
 * is used as local component state (e.g. a mutation in flight).
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export interface ApiError {
  code: string;    // machine-readable, e.g. "RATE_LIMITED", "NOT_FOUND"
  message: string; // Vietnamese-localised message safe to show the user
  retryable: boolean;
}

/** Paginated list wrapper returned by list endpoints. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ─── Mutation request shapes ──────────────────────────────────────────────────

export interface UpdateCargoStatusRequest extends PlantScopedRequest {
  cargoId: string;
  status: import("./index").CargoStatus;
  /** Required when status is "Hủy lượt". */
  ly_do_huy?: string;
}

export interface RecordWeighInRequest extends PlantScopedRequest {
  cargoId: string;
  dlc_ngay_can_vao: string; // ISO 8601
  dlc_can_vao: number;      // kg
}

export interface RecordWeighOutRequest extends PlantScopedRequest {
  cargoId: string;
  phieu_can_id: string;
  dlc_ngay_can_ra: string;  // ISO 8601
  dlc_can_ra: number;       // kg
}

export interface CompleteDossierRequest extends PlantScopedRequest {
  cargoId: string;
  /** Backend validates all required HSLS fields before accepting. */
  xac_nhan: true;
}
