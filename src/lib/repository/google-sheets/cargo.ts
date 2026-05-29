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

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0,
  NHA_MAY: 1,
  SO_XE: 2,
  LOAI_XE: 3,
  TRANG_THAI: 4,
  STT_TAI: 5,
  LY_DO_HUY: 6,
  HOAN_THANH_LUC: 7,
  TAI_XE_ID: 8,
  NGUYEN_LIEU_ID: 9,
  NHA_CUNG_CAP_ID: 10,
  NHA_CUNG_CAP_PHU_ID: 11,
  PLOT_ID: 12,
  KHOANG_CACH: 13,
  PHIEU_CAN_ID: 14,
  SO_PHIEU_CAN: 15,
  THOI_GIAN_CHO: 16,
  TONG_THOI_GIAN_CAN: 17,
  HSLS_HOAN_THANH: 18,
  GHI_CHU: 19,
  CREATED_AT: 20,
  CREATED_BY: 21,
  UPDATED_AT: 22,
  UPDATED_BY: 23,
} as const;

const COL_LEN = 24;
const SHEET = "DanhSachXeHang";
const RANGE = `${SHEET}!A2:X`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToCargo(row: string[]): Cargo {
  return {
    id: cell(row, COL.ID),
    nha_may: cell(row, COL.NHA_MAY),
    so_xe: cell(row, COL.SO_XE),
    loai_xe: (strOrNull(row, COL.LOAI_XE) as VehicleType | null),
    trang_thai: cell(row, COL.TRANG_THAI) as CargoStatus,
    stt_tai: numOrNull(row, COL.STT_TAI),
    ly_do_huy: strOrNull(row, COL.LY_DO_HUY),
    hoan_thanh_luc: strOrNull(row, COL.HOAN_THANH_LUC),
    tai_xe_id: cell(row, COL.TAI_XE_ID),
    tai_xe: null,
    nguyen_lieu_id: cell(row, COL.NGUYEN_LIEU_ID),
    nguyen_lieu: null,
    nha_cung_cap_id: cell(row, COL.NHA_CUNG_CAP_ID),
    nha_cung_cap: null,
    nha_cung_cap_phu_id: strOrNull(row, COL.NHA_CUNG_CAP_PHU_ID),
    nha_cung_cap_phu: null,
    plot_id: strOrNull(row, COL.PLOT_ID),
    plot: null,
    khoang_cach_nha_may: numOrNull(row, COL.KHOANG_CACH),
    phieu_can_id: strOrNull(row, COL.PHIEU_CAN_ID),
    phieu_can: null,
    so_phieu_can: strOrNull(row, COL.SO_PHIEU_CAN),
    thoi_gian_cho: numOrNull(row, COL.THOI_GIAN_CHO),
    tong_thoi_gian_can: numOrNull(row, COL.TONG_THOI_GIAN_CAN),
    hsls_hoan_thanh: boolCell(row, COL.HSLS_HOAN_THANH),
    ghi_chu: strOrNull(row, COL.GHI_CHU),
    created_at: cell(row, COL.CREATED_AT),
    created_by: cell(row, COL.CREATED_BY),
    updated_at: cell(row, COL.UPDATED_AT),
    updated_by: cell(row, COL.UPDATED_BY),
  };
}

export function cargoToRow(c: Cargo): string[] {
  const row = new Array<string>(COL_LEN).fill("");
  row[COL.ID] = c.id;
  row[COL.NHA_MAY] = c.nha_may;
  row[COL.SO_XE] = c.so_xe;
  row[COL.LOAI_XE] = c.loai_xe ?? "";
  row[COL.TRANG_THAI] = c.trang_thai;
  row[COL.STT_TAI] = c.stt_tai != null ? String(c.stt_tai) : "";
  row[COL.LY_DO_HUY] = c.ly_do_huy ?? "";
  row[COL.HOAN_THANH_LUC] = c.hoan_thanh_luc ?? "";
  row[COL.TAI_XE_ID] = c.tai_xe_id;
  row[COL.NGUYEN_LIEU_ID] = c.nguyen_lieu_id;
  row[COL.NHA_CUNG_CAP_ID] = c.nha_cung_cap_id;
  row[COL.NHA_CUNG_CAP_PHU_ID] = c.nha_cung_cap_phu_id ?? "";
  row[COL.PLOT_ID] = c.plot_id ?? "";
  row[COL.KHOANG_CACH] = c.khoang_cach_nha_may != null ? String(c.khoang_cach_nha_may) : "";
  row[COL.PHIEU_CAN_ID] = c.phieu_can_id ?? "";
  row[COL.SO_PHIEU_CAN] = c.so_phieu_can ?? "";
  row[COL.THOI_GIAN_CHO] = c.thoi_gian_cho != null ? String(c.thoi_gian_cho) : "";
  row[COL.TONG_THOI_GIAN_CAN] = c.tong_thoi_gian_can != null ? String(c.tong_thoi_gian_can) : "";
  row[COL.HSLS_HOAN_THANH] = c.hsls_hoan_thanh ? "TRUE" : "FALSE";
  row[COL.GHI_CHU] = c.ghi_chu ?? "";
  row[COL.CREATED_AT] = c.created_at;
  row[COL.CREATED_BY] = c.created_by;
  row[COL.UPDATED_AT] = c.updated_at;
  row[COL.UPDATED_BY] = c.updated_by;
  return row;
}

// ─── Business Rule 1: per-day sequence number ────────────────────────────────

async function nextDailySequence(plantId: string, today: string): Promise<number> {
  const rows = await readRange(plantId, RANGE);
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

    const rows = await readRange(plantId, RANGE);
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

      await appendRows(plantId, `${SHEET}!A:X`, [cargoToRow(cargo)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return cargo;
    },

    async update(_plantId: string, id: string, patch: Partial<Cargo>): Promise<Cargo> {
      cache.invalidate(`cargo:${plantId}:*`);
      const rows = await readRange(plantId, RANGE);
      const idx = rows.findIndex((r) => r[COL.ID] === id);
      if (idx === -1) throw new Error(`Cargo ${id} not found`);

      const updated: Cargo = {
        ...rowToCargo(rows[idx]),
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdate(plantId, `${SHEET}!A${idx + 2}:X${idx + 2}`, [cargoToRow(updated)]);
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
      const rows = await readRange(plantId, RANGE);
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

      await queueUpdate(plantId, `${SHEET}!A${idx + 2}:X${idx + 2}`, [cargoToRow(updated)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return updated;
    },

    async completeDossier(_plantId: string, cargoId: string): Promise<Cargo> {
      const rows = await readRange(plantId, RANGE);
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

      await queueUpdate(plantId, `${SHEET}!A${idx + 2}:X${idx + 2}`, [cargoToRow(updated)]);
      cache.invalidate(`cargo:${plantId}:*`);
      cache.invalidate(`dashboard:${plantId}:*`);
      return updated;
    },
  };
}
