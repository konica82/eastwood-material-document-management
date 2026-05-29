/**
 * Google Sheets adapter — NhaCungCap (primary) and NhaCungCapPhu (secondary).
 *
 * Primary sheet: NhaCungCap
 *   A=id, B=ten, C=hinh_thuc, D=loai_hinh, E=cccd_mst, F=so_dien_thoai,
 *   G=nguoi_dai_dien, H=dia_chi, I=nha_may, J=chung_chi, K=created_at, L=updated_at
 *
 * Secondary sheet: NhaCungCapPhu
 *   A=id, B=ten, C=hinh_thuc, D=cccd_mst, E=so_dien_thoai, F=co_phan_phan_tram,
 *   G=lo_rung, H=ngay_tham_gia, I=nha_cung_cap_chinh_id
 */

import type { Supplier, SecondarySupplier, EntityType, LoaiHinhCongTy } from "../../../types/index";
import type { SupplierRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRange, cell, numOrNull, strOrNull, queueUpdate } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";

// ─── Column indices — primary ─────────────────────────────────────────────────

const P = {
  ID: 0, TEN: 1, HINH_THUC: 2, LOAI_HINH: 3, CCCD_MST: 4,
  SO_DIEN_THOAI: 5, NGUOI_DAI_DIEN: 6, DIA_CHI: 7, NHA_MAY: 8,
  CHUNG_CHI: 9, CREATED_AT: 10, UPDATED_AT: 11,
} as const;

const P_LEN = 12;
const PRIMARY_SHEET = "NhaCungCap";
const PRIMARY_RANGE = `${PRIMARY_SHEET}!A2:L`;

// ─── Column indices — secondary ───────────────────────────────────────────────

const S = {
  ID: 0, TEN: 1, HINH_THUC: 2, CCCD_MST: 3, SO_DIEN_THOAI: 4,
  CO_PHAN: 5, LO_RUNG: 6, NGAY_THAM_GIA: 7, CHINH_ID: 8,
} as const;

const S_LEN = 9;
const SECONDARY_SHEET = "NhaCungCapPhu";
const SECONDARY_RANGE = `${SECONDARY_SHEET}!A2:I`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToSupplier(row: string[]): Supplier {
  return {
    id: cell(row, P.ID),
    ten: cell(row, P.TEN),
    hinh_thuc: cell(row, P.HINH_THUC) as EntityType,
    loai_hinh: cell(row, P.LOAI_HINH) as LoaiHinhCongTy,
    cccd_mst: cell(row, P.CCCD_MST),
    so_dien_thoai: strOrNull(row, P.SO_DIEN_THOAI) ?? undefined,
    nguoi_dai_dien: strOrNull(row, P.NGUOI_DAI_DIEN) ?? undefined,
    dia_chi: cell(row, P.DIA_CHI),
    nha_may: cell(row, P.NHA_MAY),
    chung_chi: strOrNull(row, P.CHUNG_CHI) ?? undefined,
    created_at: cell(row, P.CREATED_AT),
    updated_at: cell(row, P.UPDATED_AT),
  };
}

export function supplierToRow(s: Supplier): string[] {
  const row = new Array<string>(P_LEN).fill("");
  row[P.ID] = s.id;
  row[P.TEN] = s.ten;
  row[P.HINH_THUC] = s.hinh_thuc;
  row[P.LOAI_HINH] = s.loai_hinh;
  row[P.CCCD_MST] = s.cccd_mst;
  row[P.SO_DIEN_THOAI] = s.so_dien_thoai ?? "";
  row[P.NGUOI_DAI_DIEN] = s.nguoi_dai_dien ?? "";
  row[P.DIA_CHI] = s.dia_chi;
  row[P.NHA_MAY] = s.nha_may;
  row[P.CHUNG_CHI] = s.chung_chi ?? "";
  row[P.CREATED_AT] = s.created_at;
  row[P.UPDATED_AT] = s.updated_at;
  return row;
}

export function rowToSecondary(row: string[]): SecondarySupplier {
  return {
    id: cell(row, S.ID),
    ten: cell(row, S.TEN),
    hinh_thuc: cell(row, S.HINH_THUC) as EntityType,
    cccd_mst: cell(row, S.CCCD_MST),
    so_dien_thoai: strOrNull(row, S.SO_DIEN_THOAI) ?? undefined,
    co_phan_phan_tram: numOrNull(row, S.CO_PHAN) ?? undefined,
    lo_rung: numOrNull(row, S.LO_RUNG) ?? undefined,
    ngay_tham_gia: strOrNull(row, S.NGAY_THAM_GIA) ?? undefined,
    nha_cung_cap_chinh_id: cell(row, S.CHINH_ID),
  };
}

export function secondaryToRow(s: SecondarySupplier): string[] {
  const row = new Array<string>(S_LEN).fill("");
  row[S.ID] = s.id;
  row[S.TEN] = s.ten;
  row[S.HINH_THUC] = s.hinh_thuc;
  row[S.CCCD_MST] = s.cccd_mst;
  row[S.SO_DIEN_THOAI] = s.so_dien_thoai ?? "";
  row[S.CO_PHAN] = s.co_phan_phan_tram != null ? String(s.co_phan_phan_tram) : "";
  row[S.LO_RUNG] = s.lo_rung != null ? String(s.lo_rung) : "";
  row[S.NGAY_THAM_GIA] = s.ngay_tham_gia ?? "";
  row[S.CHINH_ID] = s.nha_cung_cap_chinh_id;
  return row;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makeSupplierRepository(plantId: string): SupplierRepository {
  async function getAllPrimary(): Promise<Supplier[]> {
    const key = listCacheKey("supplier", plantId, "all");
    const cached = cache.get<Supplier[]>(key);
    if (cached) return cached;

    const rows = await readRange(plantId, PRIMARY_RANGE);
    const suppliers = rows
      .filter((r) => r[P.ID] && r[P.NHA_MAY] === plantId)
      .map(rowToSupplier);

    cache.set(key, suppliers, TTL.REFERENCE);
    return suppliers;
  }

  async function getAllSecondary(): Promise<SecondarySupplier[]> {
    const key = listCacheKey("secondary-supplier", plantId, "all");
    const cached = cache.get<SecondarySupplier[]>(key);
    if (cached) return cached;

    const rows = await readRange(plantId, SECONDARY_RANGE);
    const items = rows.filter((r) => r[S.ID]).map(rowToSecondary);

    cache.set(key, items, TTL.REFERENCE);
    return items;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<Supplier[]> {
      const all = await getAllPrimary();
      if (!query?.search) return all;
      const q = query.search.toLowerCase();
      return all.filter(
        (s) => s.ten.toLowerCase().includes(q) || s.cccd_mst.includes(q),
      );
    },

    async get(_plantId: string, id: string): Promise<Supplier | null> {
      const key = cacheKey("supplier", plantId, id);
      const cached = cache.get<Supplier>(key);
      if (cached) return cached;

      const all = await getAllPrimary();
      const found = all.find((s) => s.id === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, id: string, patch: Partial<Supplier>): Promise<Supplier> {
      cache.invalidate(`supplier:${plantId}:*`);
      const rows = await readRange(plantId, PRIMARY_RANGE);
      const idx = rows.findIndex((r) => r[P.ID] === id);
      if (idx === -1) throw new Error(`Supplier ${id} not found`);

      const updated: Supplier = {
        ...rowToSupplier(rows[idx]),
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdate(plantId, `${PRIMARY_SHEET}!A${idx + 2}:L${idx + 2}`, [supplierToRow(updated)]);
      cache.invalidate(`supplier:${plantId}:*`);
      return updated;
    },

    async listSecondary(_plantId: string, primarySupplierId: string): Promise<SecondarySupplier[]> {
      const all = await getAllSecondary();
      return all.filter((s) => s.nha_cung_cap_chinh_id === primarySupplierId);
    },

    async getSecondary(_plantId: string, id: string): Promise<SecondarySupplier | null> {
      const all = await getAllSecondary();
      return all.find((s) => s.id === id) ?? null;
    },

    async updateSecondary(_plantId: string, id: string, patch: Partial<SecondarySupplier>): Promise<SecondarySupplier> {
      cache.invalidate(`secondary-supplier:${plantId}:*`);
      const rows = await readRange(plantId, SECONDARY_RANGE);
      const idx = rows.findIndex((r) => r[S.ID] === id);
      if (idx === -1) throw new Error(`SecondarySupplier ${id} not found`);

      const updated: SecondarySupplier = { ...rowToSecondary(rows[idx]), ...patch };
      await queueUpdate(plantId, `${SECONDARY_SHEET}!A${idx + 2}:I${idx + 2}`, [secondaryToRow(updated)]);
      cache.invalidate(`secondary-supplier:${plantId}:*`);
      return updated;
    },
  };
}
