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
import { readRangeById, cell, numOrNull, strOrNull } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";
import { NHA_CUNG_CAP_SHEETS_ID } from "../../plants/config";

// Column layout matches actual AppSheet NhaCungCap sheet (A=0 … P=15):
//   A=id, B=nhom_ncc, C=ten, D=hinh_thuc, E=ten_thuong_goi, F=cccd_mst,
//   G=dia_chi, H=nguoi_lien_he, I=so_dien_thoai, J=email,
//   K=nm_giao_hang, L=created_by, M=created_date, N=updated_date, O=updated_by, P=khai_bao_lam_san
const P = {
  ID: 0, NHOM_NCC: 1, TEN: 2, HINH_THUC: 3, TEN_THUONG_GOI: 4,
  CCCD_MST: 5, DIA_CHI: 6, NGUOI_LIEN_HE: 7, SO_DIEN_THOAI: 8,
  EMAIL: 9, NM_GIAO_HANG: 10, CREATED_BY: 11, CREATED_AT: 12, UPDATED_AT: 13,
} as const;

const P_LEN = 16;
const PRIMARY_SHEET = "NhaCungCap";
const PRIMARY_RANGE = `${PRIMARY_SHEET}!A2:P`;

// Column layout matches actual AppSheet NhaCungCapPhu sheet (A=0 … K=10):
//   A=id, B=ncc_chinh(FK→NhaCungCap.id), C=nhom_ncc, D=ten, E=hinh_thuc,
//   F=ten_thuong_goi, G=cccd_mst, H=dia_chi, I=nguoi_lien_he, J=so_dien_thoai, K=email
const S = {
  ID: 0, CHINH_ID: 1, NHOM: 2, TEN: 3, HINH_THUC: 4,
  TEN_THUONG_GOI: 5, CCCD_MST: 6, DIA_CHI: 7, NGUOI_LIEN_HE: 8,
  SO_DIEN_THOAI: 9, EMAIL: 10,
} as const;

const S_LEN = 11;
const SECONDARY_SHEET = "NhaCungCapPhu";
const SECONDARY_RANGE = `${SECONDARY_SHEET}!A2:K`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToSupplier(row: string[]): Supplier {
  return {
    id: cell(row, P.ID),
    ten: cell(row, P.TEN),
    hinh_thuc: cell(row, P.HINH_THUC) as EntityType,
    loai_hinh: cell(row, P.NHOM_NCC) as LoaiHinhCongTy,
    cccd_mst: cell(row, P.CCCD_MST),
    so_dien_thoai: strOrNull(row, P.SO_DIEN_THOAI) ?? undefined,
    nguoi_dai_dien: strOrNull(row, P.NGUOI_LIEN_HE) ?? undefined,
    dia_chi: cell(row, P.DIA_CHI),
    nha_may: cell(row, P.NM_GIAO_HANG),
    chung_chi: undefined,
    created_at: cell(row, P.CREATED_AT),
    updated_at: cell(row, P.UPDATED_AT),
  };
}

export function supplierToRow(s: Supplier): string[] {
  const row = new Array<string>(P_LEN).fill("");
  row[P.ID] = s.id;
  row[P.TEN] = s.ten;
  row[P.HINH_THUC] = s.hinh_thuc;
  row[P.CCCD_MST] = s.cccd_mst;
  row[P.SO_DIEN_THOAI] = s.so_dien_thoai ?? "";
  row[P.NGUOI_LIEN_HE] = s.nguoi_dai_dien ?? "";
  row[P.DIA_CHI] = s.dia_chi;
  row[P.CREATED_AT] = s.created_at;
  row[P.UPDATED_AT] = s.updated_at;
  return row;
}

export function rowToSecondary(row: string[]): SecondarySupplier {
  return {
    id: cell(row, S.ID),
    nha_cung_cap_chinh_id: cell(row, S.CHINH_ID),
    ten: cell(row, S.TEN),
    hinh_thuc: cell(row, S.HINH_THUC) as EntityType,
    cccd_mst: cell(row, S.CCCD_MST),
    so_dien_thoai: strOrNull(row, S.SO_DIEN_THOAI) ?? undefined,
    co_phan_phan_tram: undefined,
    lo_rung: undefined,
    ngay_tham_gia: undefined,
  };
}

export function secondaryToRow(s: SecondarySupplier): string[] {
  const row = new Array<string>(S_LEN).fill("");
  row[S.ID] = s.id;
  row[S.CHINH_ID] = s.nha_cung_cap_chinh_id;
  row[S.TEN] = s.ten;
  row[S.HINH_THUC] = s.hinh_thuc;
  row[S.CCCD_MST] = s.cccd_mst;
  row[S.SO_DIEN_THOAI] = s.so_dien_thoai ?? "";
  return row;
}

// ─── Repository ───────────────────────────────────────────────────────────────

// Suppliers are shared — plant-neutral cache namespace
const CACHE_NS = "supplier:shared";

export function makeSupplierRepository(_plantId: string): SupplierRepository {
  async function getAllPrimary(): Promise<Supplier[]> {
    const key = `${CACHE_NS}:list`;
    const cached = cache.get<Supplier[]>(key);
    if (cached) return cached;

    const rows = await readRangeById(NHA_CUNG_CAP_SHEETS_ID, PRIMARY_RANGE);
    const suppliers = rows.filter((r) => r[P.ID]).map(rowToSupplier);

    cache.set(key, suppliers, TTL.REFERENCE);
    return suppliers;
  }

  async function getAllSecondary(): Promise<SecondarySupplier[]> {
    const key = `${CACHE_NS}:secondary:list`;
    const cached = cache.get<SecondarySupplier[]>(key);
    if (cached) return cached;

    const rows = await readRangeById(NHA_CUNG_CAP_SHEETS_ID, SECONDARY_RANGE);
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
      const key = `${CACHE_NS}:${id}`;
      const cached = cache.get<Supplier>(key);
      if (cached) return cached;

      const all = await getAllPrimary();
      const found = all.find((s) => s.id === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, _id: string, _patch: Partial<Supplier>): Promise<Supplier> {
      throw new Error("Supplier updates are managed by AppSheet");
    },

    async listSecondary(_plantId: string, primarySupplierId: string): Promise<SecondarySupplier[]> {
      const all = await getAllSecondary();
      return all.filter((s) => s.nha_cung_cap_chinh_id === primarySupplierId);
    },

    async getSecondary(_plantId: string, id: string): Promise<SecondarySupplier | null> {
      const all = await getAllSecondary();
      return all.find((s) => s.id === id) ?? null;
    },

    async updateSecondary(_plantId: string, _id: string, _patch: Partial<SecondarySupplier>): Promise<SecondarySupplier> {
      throw new Error("Secondary supplier updates are managed by AppSheet");
    },
  };
}
