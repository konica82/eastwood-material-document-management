/**
 * Google Sheets adapter — TaiXe (Drivers) sheet.
 *
 * Read + update only. Driver creation belongs to the gate AppSheet app.
 *
 * Sheet: TaiXe
 * Columns: A=id, B=ten, C=cccd, D=so_dien_thoai, E=so_xe, F=nha_may,
 *   G=gplx, H=hang_gplx, I=han_gplx, J=khu_vuc, K=ngay_vao,
 *   L=trang_thai_tai_xe, M=trips30, N=kg30, O=totalTrips,
 *   P=created_at, Q=updated_at
 */

import type { Driver, DriverStatus, LicenseClass } from "../../../types/index";
import type { DriverRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRange, cell, numCell, strOrNull, queueUpdate } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0,
  TEN: 1,
  CCCD: 2,
  SO_DIEN_THOAI: 3,
  SO_XE: 4,
  NHA_MAY: 5,
  GPLX: 6,
  HANG_GPLX: 7,
  HAN_GPLX: 8,
  KHU_VUC: 9,
  NGAY_VAO: 10,
  TRANG_THAI: 11,
  TRIPS30: 12,
  KG30: 13,
  TOTAL_TRIPS: 14,
  CREATED_AT: 15,
  UPDATED_AT: 16,
} as const;

const ROW_LEN = 17;
const SHEET = "TaiXe";
const RANGE = `${SHEET}!A2:Q`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToDriver(row: string[]): Driver {
  return {
    id: cell(row, COL.ID),
    ten: cell(row, COL.TEN),
    cccd: cell(row, COL.CCCD),
    so_dien_thoai: cell(row, COL.SO_DIEN_THOAI),
    so_xe: cell(row, COL.SO_XE),
    nha_may: cell(row, COL.NHA_MAY),
    completedDeliveries: numCell(row, COL.TOTAL_TRIPS),
    gplx: strOrNull(row, COL.GPLX) ?? undefined,
    hang_gplx: (strOrNull(row, COL.HANG_GPLX) as LicenseClass | null) ?? undefined,
    han_gplx: strOrNull(row, COL.HAN_GPLX) ?? undefined,
    khu_vuc: strOrNull(row, COL.KHU_VUC) ?? undefined,
    ngay_vao: strOrNull(row, COL.NGAY_VAO) ?? undefined,
    trang_thai_tai_xe: (strOrNull(row, COL.TRANG_THAI) as DriverStatus | null) ?? undefined,
    trips30: numCell(row, COL.TRIPS30),
    kg30: numCell(row, COL.KG30),
    totalTrips: numCell(row, COL.TOTAL_TRIPS),
    created_at: cell(row, COL.CREATED_AT),
    updated_at: cell(row, COL.UPDATED_AT),
  };
}

export function driverToRow(d: Driver): string[] {
  const row: (string | number | null | undefined)[] = new Array(ROW_LEN).fill("");
  row[COL.ID] = d.id;
  row[COL.TEN] = d.ten;
  row[COL.CCCD] = d.cccd;
  row[COL.SO_DIEN_THOAI] = d.so_dien_thoai;
  row[COL.SO_XE] = d.so_xe;
  row[COL.NHA_MAY] = d.nha_may;
  row[COL.GPLX] = d.gplx ?? "";
  row[COL.HANG_GPLX] = d.hang_gplx ?? "";
  row[COL.HAN_GPLX] = d.han_gplx ?? "";
  row[COL.KHU_VUC] = d.khu_vuc ?? "";
  row[COL.NGAY_VAO] = d.ngay_vao ?? "";
  row[COL.TRANG_THAI] = d.trang_thai_tai_xe ?? "";
  row[COL.TRIPS30] = d.trips30 ?? 0;
  row[COL.KG30] = d.kg30 ?? 0;
  row[COL.TOTAL_TRIPS] = d.totalTrips ?? 0;
  row[COL.CREATED_AT] = d.created_at;
  row[COL.UPDATED_AT] = d.updated_at;
  return row.map((v) => (v === null || v === undefined ? "" : String(v)));
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makeDriverRepository(plantId: string): DriverRepository {
  async function getAllDrivers(): Promise<Driver[]> {
    const key = listCacheKey("driver", plantId, "all");
    const cached = cache.get<Driver[]>(key);
    if (cached) return cached;

    const rows = await readRange(plantId, RANGE);
    const drivers = rows
      .filter((r) => r[COL.ID] && r[COL.NHA_MAY] === plantId)
      .map(rowToDriver);

    cache.set(key, drivers, TTL.REFERENCE);
    return drivers;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<Driver[]> {
      const all = await getAllDrivers();
      if (!query?.search) return all;
      const q = query.search.toLowerCase();
      return all.filter(
        (d) =>
          d.ten.toLowerCase().includes(q) ||
          d.so_xe.toLowerCase().includes(q) ||
          d.cccd.includes(q),
      );
    },

    async get(_plantId: string, id: string): Promise<Driver | null> {
      const key = cacheKey("driver", plantId, id);
      const cached = cache.get<Driver>(key);
      if (cached) return cached;

      const all = await getAllDrivers();
      const found = all.find((d) => d.id === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, id: string, patch: Partial<Driver>): Promise<Driver> {
      cache.invalidate(`driver:${plantId}:*`);
      const rows = await readRange(plantId, RANGE);
      const idx = rows.findIndex((r) => r[COL.ID] === id);
      if (idx === -1) throw new Error(`Driver ${id} not found`);

      const existing = rowToDriver(rows[idx]);
      const updated: Driver = {
        ...existing,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdate(plantId, `${SHEET}!A${idx + 2}:Q${idx + 2}`, [driverToRow(updated)]);
      cache.invalidate(`driver:${plantId}:*`);
      return updated;
    },

    async findByPlate(_plantId: string, so_xe: string): Promise<Driver | null> {
      const all = await getAllDrivers();
      return all.find((d) => d.so_xe === so_xe) ?? null;
    },
  };
}
