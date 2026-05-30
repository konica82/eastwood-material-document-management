/**
 * Core domain types for Hồ sơ nguyên liệu.
 *
 * Naming convention mirrors AppSheet column names so data-layer adapters
 * can map fields without translation tables. UI labels are always Vietnamese
 * phrases rendered at the component level — never stored here.
 *
 * Foreign-key pattern: every relationship exposes both the raw ID and the
 * optionally-populated object, e.g. `tai_xe_id: string` + `tai_xe: Driver | null`.
 * The repository layer controls whether joins are resolved; components never
 * fetch child records independently.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export type Role = "User" | "Manager" | "Admin";

/** Driver record status — set by the gate AppSheet app, readable/editable in web. */
export type DriverStatus = "active" | "expiring" | "suspended" | "pending";

/** GPLX (driver's licence) class — Vietnamese road-transport categories. */
export type LicenseClass = "B2" | "C" | "E" | "FC";

export type CargoStatus =
  | "Chờ lượt"      // waiting at gate
  | "Đang xử lý"   // weighing / in progress
  | "Hoàn thành"   // completed
  | "Hủy lượt";    // cancelled

export type VehicleType =
  | "Xe tải"   // truck
  | "Máy cày"  // tractor
  | "Đầu kéo"; // trailer

/** Supplier / driver entity type — determines which ID field is required. */
export type EntityType = "Công ty" | "Cá nhân";

/**
 * Legal form sub-type for company suppliers.
 * Drives the filter chips on the supplier list (HTX / CP / TNHH).
 * Individuals are always "Cá nhân".
 */
export type LoaiHinhCongTy = "HTX" | "CP" | "TNHH" | "Cá nhân";

export type DeforestationRiskStatus =
  | "Thấp"            // low
  | "Trung bình"      // medium
  | "Cao"             // high — triggers additional EUDR due-diligence
  | "Chưa đánh giá";  // not yet assessed

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string;          // e.g. "NMXH", "NMQM", "NMCT"
  name: string;        // full Vietnamese name
  displayName: string; // short name shown in the plant switcher
  timezone: string;    // IANA tz, e.g. "Asia/Ho_Chi_Minh"
  /** Maps sheet role (cargo, suppliers, etc.) → Sheets spreadsheet ID. */
  spreadsheetIds: Record<string, string>;
  /** Maps file-type role (photos, documents) → Drive folder ID. */
  driveFolderIds: Record<string, string>;
}

// ─── User & access ────────────────────────────────────────────────────────────

export interface PlantAccess {
  plantId: string;
  role: Role;
}

export interface User {
  id: string;
  email: string;
  name: string;
  /** Global fallback role; authoritative access is per-plant via `plants`. */
  role: Role;
  plants: PlantAccess[];
  defaultPlantId: string | null;
}

// ─── Driver (TaiXe) ───────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  ten: string;           // full name
  cccd: string;          // national ID (parsed from QR — Business Rule 5)
  cccd_qrcode_scan?: string; // raw QR string; parsed server-side on write
  so_dien_thoai: string; // phone number
  so_xe: string;         // vehicle plate number (monospace in UI)
  nha_may: string;       // plant ID this driver is registered at
  /** Completed-delivery count — Business Rule 4 (query-time aggregate). */
  completedDeliveries: number;
  created_at: string;    // ISO 8601
  updated_at: string;

  // ── Gate-app fields (populated by the security-gate AppSheet app) ────────────
  /** GPLX (driver's licence) number — monospace in UI. */
  gplx?: string;
  /** GPLX licence class — B2 / C / E / FC. */
  hang_gplx?: LicenseClass;
  /** GPLX expiry date — ISO 8601 date string (YYYY-MM-DD). */
  han_gplx?: string;
  /** Home province/region — displayed as part of driver identity. */
  khu_vuc?: string;
  /** Date the driver joined the fleet — ISO 8601 date string. */
  ngay_vao?: string;
  /** Operational status set by the gate app. */
  trang_thai_tai_xe?: DriverStatus;
  /** Deliveries in the last 30 days (query-time aggregate, pre-baked in mock). */
  trips30?: number;
  /** Net cargo weight in kg over the last 30 days (query-time aggregate). */
  kg30?: number;
  /** All-time total completed trips. */
  totalTrips?: number;
  /** All vehicle plates used (primary + any extras the gate app records). */
  all_plates?: string[];
}

// ─── Material (NguyenLieu) ────────────────────────────────────────────────────

export interface Material {
  id: string;
  ten: string;            // common Vietnamese name
  ten_khoa_hoc: string;  // scientific name
  image: string | null;  // Drive URL or null
}

// ─── Suppliers (NhaCungCap / NhaCungCapPhu) ───────────────────────────────────

export interface Supplier {
  id: string;
  ten: string;
  /** Determines which identifier is required: MST for company, CCCD for individual. */
  hinh_thuc: EntityType;
  /** Legal-form sub-type used for filter chips. */
  loai_hinh: LoaiHinhCongTy;
  /** Tax code (MST) for companies; national ID (CCCD) for individuals. */
  cccd_mst: string;
  so_dien_thoai?: string;
  /** Legal representative name (for companies). */
  nguoi_dai_dien?: string;
  dia_chi: string;       // address
  nha_may: string;       // plant ID
  /** Forest / timber certification label, e.g. "FSC-CoC". */
  chung_chi?: string;
  /** Populated only on detail views. */
  secondarySuppliers?: SecondarySupplier[];
  created_at: string;
  updated_at: string;
}

export interface SecondarySupplier {
  id: string;
  ten: string;
  hinh_thuc: EntityType;
  cccd_mst: string;
  so_dien_thoai?: string;
  /** Ownership share percentage (0–100) within the primary supplier. */
  co_phan_phan_tram?: number;
  /** Number of forest plots contributed by this member. */
  lo_rung?: number;
  /** Date this member joined the cooperative (ISO 8601). */
  ngay_tham_gia?: string;
  nha_cung_cap_chinh_id: string; // FK to primary Supplier
  /** Populated on detail views. */
  nha_cung_cap_chinh?: Supplier | null;
}

// ─── Weighing slip (PhieuCan) ─────────────────────────────────────────────────

export interface WeighingSlip {
  id: string;
  xe_hang_id: string;          // FK to Cargo
  so_phieu_can: string;        // slip number — unique per plant (monospace in UI)
  nha_may: string;             // plant ID

  // Weigh-in
  dlc_ngay_can_vao: string;    // ISO 8601 timestamp
  dlc_can_vao: number;         // gross weight in kg

  // Weigh-out
  dlc_ngay_can_ra: string | null;  // ISO 8601 or null until recorded
  dlc_can_ra: number | null;

  /** Net weight in kg — computed server-side on write (Business Rule 3). */
  dlc_trong_luong_hang: number | null;

  can_thu: string | null;      // scale operator name
  hinh_anh_phieu_can: string | null; // Drive URL for slip image

  created_at: string;
  updated_at: string;
}

// ─── Cargo (DanhSachXeHang) ───────────────────────────────────────────────────

/**
 * The central domain record. Every truck delivery from gate to completion.
 * ~96 columns in the AppSheet source; this captures all fields with business
 * logic or UI significance.
 */
export interface Cargo {
  id: string;
  nha_may: string;     // plant ID — every query must be scoped to this

  // ── Identification ──────────────────────────────────────────────────────────
  so_xe: string;       // vehicle plate number (monospace in UI)
  so_mooc: string | null;     // trailer plate number
  loai_xe: VehicleType | null;
  /** Per-day sequence number — Business Rule 1 (stored on create). */
  stt_tai: number | null;
  /** Info slip photo — AppSheet Drive path. */
  hinh_phieu_thong_tin: string | null;

  // ── Status & lifecycle ──────────────────────────────────────────────────────
  trang_thai: CargoStatus;
  /** Timestamp when status moved to Hoàn thành. */
  hoan_thanh_luc: string | null;
  /** Required when status is Hủy lượt. Not yet in AppSheet schema — null until added. */
  ly_do_huy: string | null;

  // ── Driver (FK + joined) ────────────────────────────────────────────────────
  tai_xe_id: string;
  tai_xe: Driver | null;

  // ── Material (FK + joined) ──────────────────────────────────────────────────
  nguyen_lieu_id: string;
  nguyen_lieu: Material | null;
  /** Denormalised material type label stored by AppSheet. */
  loai_nguyen_lieu: string | null;

  // ── Supplier chain (FK + joined) ────────────────────────────────────────────
  nha_cung_cap_id: string;
  nha_cung_cap: Supplier | null;
  nha_cung_cap_phu_id: string | null;
  nha_cung_cap_phu: SecondarySupplier | null;
  /** Forest product owner name. */
  chu_lam_san: string | null;

  // ── Source location ──────────────────────────────────────────────────────────
  dia_chi_nguyen_lieu: string | null;   // full address string
  tinh: string | null;                  // province
  huyen: string | null;                 // district
  xa: string | null;                    // commune
  ten_chu_rung: string | null;          // forest owner name

  // ── Source plot (FK + joined) ────────────────────────────────────────────────
  plot_id: string | null;
  plot: PlotRegistry | null;
  /** Distance to factory in km. */
  khoang_cach_nha_may: number | null;

  // ── Weighing (FK + joined) ───────────────────────────────────────────────────
  phieu_can_id: string | null;
  phieu_can: WeighingSlip | null;
  /** Denormalised slip number. Not yet in AppSheet schema — null until added. */
  so_phieu_can: string | null;

  // ── Timing derivations — not yet in AppSheet schema ─────────────────────────
  thoi_gian_cho: number | null;
  tong_thoi_gian_can: number | null;

  // ── HSLS / dossier completion — not yet in AppSheet schema ──────────────────
  hsls_hoan_thanh: boolean;

  // ── Miscellaneous ────────────────────────────────────────────────────────────
  ghi_chu: string | null;

  // ── Audit ────────────────────────────────────────────────────────────────────
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// ─── Plot registry (traceability / EUDR) ─────────────────────────────────────

export interface PlotRegistry {
  PlotID: string;
  LandTitle: string;          // land title / certificate number
  AreaHa: number;             // area in hectares
  TreeSpecies: string;        // primary species
  DeforestationRiskStatus: DeforestationRiskStatus;
  /** Cumulative delivered tonnage — Business Rule 6 (query-time aggregate, tonnes). */
  ActualQuantityDelivered: number;
  nha_may: string;            // plant ID
  lat: number | null;         // centroid latitude
  lng: number | null;         // centroid longitude

  // ── Location detail ──────────────────────────────────────────────────────────
  commune: string | null;     // Xã
  district: string | null;    // Huyện
  province: string | null;    // Tỉnh

  // ── Forest lifecycle ─────────────────────────────────────────────────────────
  planted_at: string | null;      // ISO date — when seedlings were planted
  harvest_plan: string | null;    // ISO date — planned harvest date
  rotation_years: number | null;  // full harvest cycle in years
  density_per_ha: number | null;  // trees per hectare at planting
  prev_harvests: number;          // number of completed prior harvests

  // ── Terrain ───────────────────────────────────────────────────────────────────
  elevation_m: number | null;     // metres above sea level
  slope_deg: number | null;       // slope in degrees
  soil_type: string | null;       // soil classification description

  // ── Certification ─────────────────────────────────────────────────────────────
  certificate: string | null;     // e.g. "FSC-CoC", "PEFC", "Không", "Chờ cấp"
  cert_id: string | null;         // certificate code

  /** AppSheet Drive image path — resolved via /api/drive-image proxy. */
  image: string | null;

  created_at: string;
  updated_at: string;
  /** Populated on detail view. */
  owners?: PlotOwner[];
  /** Populated on detail / map view. */
  polygon?: PolygonCoordinate[];
  /** Populated on detail view. */
  documents?: PlotDocument[];
}

export interface PlotOwner {
  id: string;             // PlotOwnerID
  plot_id: string;        // FK → PlotRegistry.PlotID
  owner_id: string;       // FK → NhaCungCapPhu.id
  vai_tro: string;        // OwnershipRole (e.g. "Primary", "Joint")
  ty_le: number | null;   // OwnershipShare 0–100 %
  hieu_luc_tu: string | null;  // EffectiveDate
  // Resolved from NhaCungCapPhu join:
  ten: string;            // owner name
  cccd: string;           // CCCD/MST (tax/national ID)
  so_dien_thoai: string | null;
}

export interface PolygonCoordinate {
  id: string;
  plot_id: string;
  lat: number;
  lng: number;
  thu_tu: number; // sequence order for rendering
}

export interface PlotDocument {
  id: string;
  plot_id: string;
  ten_tai_lieu: string;   // document name
  loai: string;           // type (e.g. "Giấy chứng nhận", "Bản đồ")
  drive_url: string;      // Google Drive file URL
  uploaded_at: string;
  uploaded_by: string;
}


// ─── Dashboard metrics (Business Rules 7–12) ──────────────────────────────────

/** Computed on demand by the dashboard endpoint, scoped to the active plant. */
export interface DashboardMetrics {
  /** Rule 7: cargos with status Chờ lượt. */
  cho_luot: number;
  /** Rule 8: cargos with created_date = today (plant local date). */
  dang_ky_hom_nay: number;
  /** Rule 9: cargos that reached Hoàn thành today. */
  hoan_thanh_hom_nay: {
    total: number;
    byVehicleType: Record<VehicleType, number>;
  };
  /** Rule 10: completed cargos where hsls_hoan_thanh = false. */
  ho_so_chua_xong: number;
  /** Rule 11: completed cargos where hsls_hoan_thanh = true. */
  ho_so_hoan_thanh: number;
  /** Rule 12: completed cargos with no weighing slip reference. */
  thieu_phieu_can: number;
}

// ─── Activity log ─────────────────────────────────────────────────────────────

export type ActivityAction =
  | "created"
  | "updated"
  | "status_changed"
  | "deleted";

export interface ActivityLogEntry {
  id: string;
  plant_id: string;
  entity_type: string;  // e.g. "cargo", "weighing_slip", "plot"
  entity_id: string;
  action: ActivityAction;
  description: string;  // human-readable Vietnamese summary
  created_by: string;   // user ID
  created_at: string;   // ISO 8601; always server-set
}
