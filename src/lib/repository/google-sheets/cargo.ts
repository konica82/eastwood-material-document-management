/**
 * Google Sheets adapter — DanhSachXeHang (Cargo). ~96 columns.
 *
 * Column layout (A=0 … AZ=51+):
 *   A=id, B=nha_may, C=so_xe, D=loai_xe, E=trang_thai, F=stt_tai,
 *   G=ly_do_huy, H=hoan_thanh_luc, I=tai_xe_id, J=nguyen_lieu_id,
 *   K=nha_cung_cap_id, L=nha_cung_cap_phu_id, M=plot_id,
 *   N=khoang_cach_nha_may, O=phieu_can_id, P=so_phieu_can,
 *   Q=thoi_gian_cho, R=tong_thoi_gian_can, S=hsls_hoan_thanh,
 *   T=ghi_chu, U=created_at, V=created_by, W=updated_at, X=updated_by
 *
 * Joined objects (tai_xe, nguyen_lieu, nha_cung_cap, etc.) are resolved
 * by the service layer — the adapter returns IDs only unless joins are
 * explicitly requested.
 */

import type { Cargo, CargoStatus, VehicleType } from "../../../types/index";
import type { CargoRepository, CreateCargoInput } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRange, cell, numOrNull, boolCell, strOrNull, queueUpdate, appendRows } from "./base";
import { cache, TTL, cacheKey, listCacheKey, hashQuery } from "../../cache";
import { randomUUID } from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse AppSheet dd/MM/yyyy HH:mm:ss or ISO yyyy-MM-dd HH:mm:ss into a Date. */
function parseAppSheetDate(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
  // Also handle ISO prefix like "2025-03-21 00:00:00"
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +iso[6]);
  return null;
}

// ─── Column indices ───────────────────────────────────────────────────────────

// Column layout matches actual AppSheet sheet (A=0 … Z=25):
//   A=id, B=nha_may, C=stt_tai, D=hinh_phieu_thong_tin, E=tai_xe_id,
//   F=loai_xe, G=so_xe, H=so_mooc, I=nguyen_lieu_id, J=loai_nguyen_lieu,
//   K=nha_cung_cap_id, L=nha_cung_cap_phu_id, M=chu_lam_san,
//   N=dia_chi_nguyen_lieu, O=tinh, P=huyen, Q=xa, R=khoang_cach_nha_may,
//   S=ten_chu_rung, T=trang_thai, U=phieu_can_id, V=xe_hang_hoan_thanh_date,
//   W=created_by, X=created_date, Y=updated_date, Z=updated_by
const COL = {
  ID: 0,
  NHA_MAY: 1,
  STT_TAI: 2,
  HINH_PHIEU_THONG_TIN: 3,
  TAI_XE_ID: 4,
  LOAI_XE: 5,
  SO_XE: 6,
  SO_MOOC: 7,
  NGUYEN_LIEU_ID: 8,
  LOAI_NGUYEN_LIEU: 9,
  NHA_CUNG_CAP_ID: 10,
  NHA_CUNG_CAP_PHU_ID: 11,
  CHU_LAM_SAN: 12,
  DIA_CHI_NGUYEN_LIEU: 13,
  TINH: 14,
  HUYEN: 15,
  XA: 16,
  KHOANG_CACH: 17,
  TEN_CHU_RUNG: 18,
  TRANG_THAI: 19,
  PHIEU_CAN_ID: 20,
  HOAN_THANH_LUC: 21,
  CREATED_BY: 22,
  CREATED_AT: 23,
  UPDATED_AT: 24,
  UPDATED_BY: 25,
} as const;

const COL_LEN = 26;
const SHEET_BASE = "DanhSachXeHang";
const sheet = (plantId: string) => `${SHEET_BASE}_${plantId}`;
const range = (plantId: string) => `${sheet(plantId)}!A2:Z`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToCargo(row: string[]): Cargo {
  return {
    id: cell(row, COL.ID),
    nha_may: cell(row, COL.NHA_MAY),
    stt_tai: numOrNull(row, COL.STT_TAI),
    hinh_phieu_thong_tin: strOrNull(row, COL.HINH_PHIEU_THONG_TIN),
    tai_xe_id: cell(row, COL.TAI_XE_ID),
    tai_xe: null,
    loai_xe: strOrNull(row, COL.LOAI_XE) as VehicleType | null,
    so_xe: cell(row, COL.SO_XE),
    so_mooc: strOrNull(row, COL.SO_MOOC),
    nguyen_lieu_id: cell(row, COL.NGUYEN_LIEU_ID),
    nguyen_lieu: null,
    loai_nguyen_lieu: strOrNull(row, COL.LOAI_NGUYEN_LIEU),
    nha_cung_cap_id: cell(row, COL.NHA_CUNG_CAP_ID),
    nha_cung_cap: null,
    nha_cung_cap_phu_id: strOrNull(row, COL.NHA_CUNG_CAP_PHU_ID),
    nha_cung_cap_phu: null,
    chu_lam_san: strOrNull(row, COL.CHU_LAM_SAN),
    dia_chi_nguyen_lieu: strOrNull(row, COL.DIA_CHI_NGUYEN_LIEU),
    tinh: strOrNull(row, COL.TINH),
    huyen: strOrNull(row, COL.HUYEN),
    xa: strOrNull(row, COL.XA),
    khoang_cach_nha_may: numOrNull(row, COL.KHOANG_CACH),
    ten_chu_rung: strOrNull(row, COL.TEN_CHU_RUNG),
    trang_thai: cell(row, COL.TRANG_THAI) as CargoStatus,
    phieu_can_id: strOrNull(row, COL.PHIEU_CAN_ID),
    phieu_can: null,
    hoan_thanh_luc: strOrNull(row, COL.HOAN_THANH_LUC),
    created_by: cell(row, COL.CREATED_BY),
    created_at: cell(row, COL.CREATED_AT),
    updated_at: cell(row, COL.UPDATED_AT),
    updated_by: cell(row, COL.UPDATED_BY),
    // Fields not yet in AppSheet schema — kept for UI compatibility
    plot_id: null,
    plot: null,
    ly_do_huy: null,
    so_phieu_can: null,
    thoi_gian_cho: null,
    tong_thoi_gian_can: null,
    hsls_hoan_thanh: false,
    ghi_chu: null,
  };
}

export function cargoToRow(c: Cargo): string[] {
  const row = new Array<string>(COL_LEN).fill("");
  row[COL.ID] = c.id;
  row[COL.NHA_MAY] = c.nha_may;
  row[COL.STT_TAI] = c.stt_tai != null ? String(c.stt_tai) : "";
  row[COL.HINH_PHIEU_THONG_TIN] = c.hinh_phieu_thong_tin ?? "";
  row[COL.TAI_XE_ID] = c.tai_xe_id;
  row[COL.LOAI_XE] = c.loai_xe ?? "";
  row[COL.SO_XE] = c.so_xe;
  row[COL.SO_MOOC] = c.so_mooc ?? "";
  row[COL.NGUYEN_LIEU_ID] = c.nguyen_lieu_id;
  row[COL.LOAI_NGUYEN_LIEU] = c.loai_nguyen_lieu ?? "";
  row[COL.NHA_CUNG_CAP_ID] = c.nha_cung_cap_id;
  row[COL.NHA_CUNG_CAP_PHU_ID] = c.nha_cung_cap_phu_id ?? "";
  row[COL.CHU_LAM_SAN] = c.chu_lam_san ?? "";
  row[COL.DIA_CHI_NGUYEN_LIEU] = c.dia_chi_nguyen_lieu ?? "";
  row[COL.TINH] = c.tinh ?? "";
  row[COL.HUYEN] = c.huyen ?? "";
  row[COL.XA] = c.xa ?? "";
  row[COL.KHOANG_CACH] = c.khoang_cach_nha_may != null ? String(c.khoang_cach_nha_may) : "";
  row[COL.TEN_CHU_RUNG] = c.ten_chu_rung ?? "";
  row[COL.TRANG_THAI] = c.trang_thai;
  row[COL.PHIEU_CAN_ID] = c.phieu_can_id ?? "";
  row[COL.HOAN_THANH_LUC] = c.hoan_thanh_luc ?? "";
  row[COL.CREATED_BY] = c.created_by;
  row[COL.CREATED_AT] = c.created_at;
  row[COL.UPDATED_AT] = c.updated_at;
  row[COL.UPDATED_BY] = c.updated_by;
  return row;
}

// ─── Business Rule 1: per-day sequence number ────────────────────────────────

async function nextDailySequence(plantId: string, today: string): Promise<number> {
  const rows = await readRange(plantId, range(plantId));
  const todayCount = rows.filter(
    (r) =>
      r[COL.NHA_MAY] === plantId &&
      r[COL.CREATED_AT]?.startsWith(today),
  ).length;
  return todayCount + 1;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makeCargoRepository(plantId: string): CargoRepository {
  async function getAllCargos(): Promise<Cargo[]> {
    const key = listCacheKey("cargo", plantId, "all");
    const cached = cache.get<Cargo[]>(key);
    if (cached) return cached;

    const rows = await readRange(plantId, range(plantId));
    const cargos = rows
      .filter((r) => r[COL.ID] && r[COL.NHA_MAY] === plantId)
      .map(rowToCargo);

    cache.set(key, cargos, TTL.CARGO_LIST);
    return cargos;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<Cargo[]> {
      const queryKey = listCacheKey("cargo", plantId, hashQuery(query as Record<string, unknown>));
      const cachedList = cache.get<Cargo[]>(queryKey);
      if (cachedList) return cachedList;

      let all = await getAllCargos();

      if (query?.dateFrom || query?.dateTo) {
        const from = query.dateFrom ? parseAppSheetDate(query.dateFrom + " 00:00:00") : null;
        const to   = query.dateTo   ? parseAppSheetDate(query.dateTo   + " 23:59:59") : null;
        all = all.filter((c) => {
          const d = parseAppSheetDate(c.created_at);
          if (!d) return false;
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      }
      if (query?.filters?.trang_thai) {
        all = all.filter((c) => c.trang_thai === query.filters!.trang_thai);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        all = all.filter(
          (c) =>
            c.so_xe.toLowerCase().includes(q) ||
            c.tai_xe_id.toLowerCase().includes(q),
        );
      }
      if (query?.sortBy === "created_at") {
        all = [...all].sort((a, b) => {
          const dir = query.sortDir === "asc" ? 1 : -1;
          return a.created_at > b.created_at ? dir : -dir;
        });
      }

      cache.set(queryKey, all, TTL.CARGO_LIST);
      return all;
    },

    async get(_plantId: string, id: string): Promise<Cargo | null> {
      const key = cacheKey("cargo", plantId, id);
      const cached = cache.get<Cargo>(key);
      if (cached) return cached;

      const all = await getAllCargos();
      const found = all.find((c) => c.id === id) ?? null;
      if (found) cache.set(key, found, TTL.CARGO_DETAIL);
      return found;
    },

    async create(_plantId: string, input: CreateCargoInput): Promise<Cargo> {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const id = randomUUID();
      const stt_tai = await nextDailySequence(plantId, today);

      // TODO: compute khoang_cach_nha_may via Maps API when plot_id is set
      if (input.plot_id) {
        console.info(`[cargo] TODO: compute distance to plant for plot ${input.plot_id}`);
      }

      const cargo: Cargo = {
        ...input,
        id,
        nha_may: plantId,
        stt_tai,
        thoi_gian_cho: null,
        tong_thoi_gian_can: null,
        hoan_thanh_luc: null,
        so_phieu_can: null,
        tai_xe: null,
        nguyen_lieu: null,
        nha_cung_cap: null,
        nha_cung_cap_phu: null,
        khoang_cach_nha_may: null,
        plot: null,
        phieu_can: null,
        created_at: now,
        created_by: "system",
        updated_at: now,
        updated_by: "system",
      };

      await appendRows(plantId, `${sheet(plantId)}!A:Z`, [cargoToRow(cargo)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return cargo;
    },

    async update(_plantId: string, id: string, patch: Partial<Cargo>): Promise<Cargo> {
      cache.invalidate(`cargo:${plantId}:*`);
      const rows = await readRange(plantId, range(plantId));
      const idx = rows.findIndex((r) => r[COL.ID] === id);
      if (idx === -1) throw new Error(`Cargo ${id} not found`);

      const updated: Cargo = {
        ...rowToCargo(rows[idx]),
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdate(plantId, `${sheet(plantId)}!A${idx + 2}:Z${idx + 2}`, [cargoToRow(updated)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return updated;
    },

    async updateStatus(
      _plantId: string,
      cargoId: string,
      status: CargoStatus,
      ly_do_huy?: string,
    ): Promise<Cargo> {
      const rows = await readRange(plantId, range(plantId));
      const idx = rows.findIndex((r) => r[COL.ID] === cargoId);
      if (idx === -1) throw new Error(`Cargo ${cargoId} not found`);

      const existing = rowToCargo(rows[idx]);
      const now = new Date().toISOString();

      const updated: Cargo = {
        ...existing,
        trang_thai: status,
        ly_do_huy: status === "Hủy lượt" ? (ly_do_huy ?? null) : existing.ly_do_huy,
        // Business Rule 5: stamp completion time
        hoan_thanh_luc: status === "Hoàn thành" ? now : existing.hoan_thanh_luc,
        updated_at: now,
        updated_by: "system",
      };

      await queueUpdate(plantId, `${sheet(plantId)}!A${idx + 2}:Z${idx + 2}`, [cargoToRow(updated)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return updated;
    },

    async completeDossier(_plantId: string, cargoId: string): Promise<Cargo> {
      const rows = await readRange(plantId, range(plantId));
      const idx = rows.findIndex((r) => r[COL.ID] === cargoId);
      if (idx === -1) throw new Error(`Cargo ${cargoId} not found`);

      const existing = rowToCargo(rows[idx]);

      // Validate required fields before accepting
      const missing: string[] = [];
      if (!existing.tai_xe_id) missing.push("tai_xe_id");
      if (!existing.nguyen_lieu_id) missing.push("nguyen_lieu_id");
      if (!existing.nha_cung_cap_id) missing.push("nha_cung_cap_id");
      if (!existing.phieu_can_id) missing.push("phieu_can_id");
      if (missing.length > 0) {
        throw new Error(`Không thể hoàn thành hồ sơ — thiếu: ${missing.join(", ")}`);
      }

      const updated: Cargo = {
        ...existing,
        hsls_hoan_thanh: true,
        updated_at: new Date().toISOString(),
        updated_by: "system",
      };

      await queueUpdate(plantId, `${sheet(plantId)}!A${idx + 2}:Z${idx + 2}`, [cargoToRow(updated)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return updated;
    },
  };
}
