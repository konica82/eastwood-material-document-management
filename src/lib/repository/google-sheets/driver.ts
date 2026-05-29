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
// DriverStatus and LicenseClass kept for type compatibility in rowToDriver
import type { DriverRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRangeById, cell, strOrNull } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";
import { TAI_XE_SHEETS_ID } from "../../plants/config";

// Column layout matches actual AppSheet TaiXe sheet (A=0 … M=12):
//   A=id, B=cccd_qrcode_scan, C=ten, D=cccd, E=bang_lai_xe,
//   F=so_dien_thoai, G=nha_may, H=hinh_cccd, I=hinh_bang_lai_xe,
//   J=created_by, K=created_date, L=updated_date, M=updated_by
const COL = {
  ID: 0,
  CCCD_QR: 1,
  TEN: 2,
  CCCD: 3,
  BANG_LAI_XE: 4,
  SO_DIEN_THOAI: 5,
  NHA_MAY: 6,
  CREATED_AT: 10,
  UPDATED_AT: 11,
} as const;

const SHEET = "TaiXe";
const RANGE = `${SHEET}!A2:M`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToDriver(row: string[]): Driver {
  return {
    id: cell(row, COL.ID),
    ten: cell(row, COL.TEN),
    cccd: cell(row, COL.CCCD),
    so_dien_thoai: cell(row, COL.SO_DIEN_THOAI),
    nha_may: cell(row, COL.NHA_MAY),
    created_at: cell(row, COL.CREATED_AT),
    updated_at: cell(row, COL.UPDATED_AT),
    // Fields not in AppSheet schema
    so_xe: "",
    gplx: strOrNull(row, COL.BANG_LAI_XE) ?? undefined,
    hang_gplx: undefined,
    han_gplx: undefined,
    khu_vuc: undefined,
    ngay_vao: undefined,
    trang_thai_tai_xe: undefined,
    trips30: 0,
    kg30: 0,
    totalTrips: 0,
    completedDeliveries: 0,
  };
}


// ─── Repository ───────────────────────────────────────────────────────────────

// Drivers are shared — plant-neutral cache namespace
const CACHE_NS = "driver:shared";

export function makeDriverRepository(_plantId: string): DriverRepository {
  async function getAllDrivers(): Promise<Driver[]> {
    const key = `${CACHE_NS}:list`;
    const cached = cache.get<Driver[]>(key);
    if (cached) return cached;

    const rows = await readRangeById(TAI_XE_SHEETS_ID, RANGE);
    const drivers = rows.filter((r) => r[COL.ID]).map(rowToDriver);

    cache.set(key, drivers, TTL.REFERENCE);
    return drivers;
  }

  return {
    async list(plantId: string, query?: ListQuery): Promise<Driver[]> {
      let all = await getAllDrivers();
      // Filter to this plant's drivers
      all = all.filter((d) => !d.nha_may || d.nha_may === plantId);
      if (!query?.search) return all;
      const q = query.search.toLowerCase();
      return all.filter(
        (d) => d.ten.toLowerCase().includes(q) || d.cccd.includes(q),
      );
    },

    async get(_plantId: string, id: string): Promise<Driver | null> {
      const key = `${CACHE_NS}:${id}`;
      const cached = cache.get<Driver>(key);
      if (cached) return cached;

      const all = await getAllDrivers();
      const found = all.find((d) => d.id === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, _id: string, _patch: Partial<Driver>): Promise<Driver> {
      throw new Error("Driver updates are managed by AppSheet");
    },

    async findByPlate(_plantId: string, so_xe: string): Promise<Driver | null> {
      const all = await getAllDrivers();
      return all.find((d) => d.so_xe === so_xe) ?? null;
    },
  };
}
