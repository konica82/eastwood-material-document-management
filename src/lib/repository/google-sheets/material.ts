/**
 * Google Sheets adapter — NguyenLieu (Materials) sheet.
 *
 * Sheet: NguyenLieu
 * Columns: A=id, B=ten, C=ten_khoa_hoc, D=image
 */

import type { Material } from "../../../types/index";
import type { MaterialRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRangeById, cell, strOrNull, queueUpdateById } from "./base";
import { cache, TTL } from "../../cache";
import { NGUYEN_LIEU_SHEETS_ID } from "../../plants/config";

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0,
  TEN: 1,
  TEN_KHOA_HOC: 2,
  IMAGE: 3,
} as const;

const SHEET = "Sheet1";
const RANGE = `${SHEET}!A2:D`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToMaterial(row: string[]): Material {
  return {
    id: cell(row, COL.ID),
    ten: cell(row, COL.TEN),
    ten_khoa_hoc: cell(row, COL.TEN_KHOA_HOC),
    image: toImageUrl(strOrNull(row, COL.IMAGE)),
  };
}

export function materialToRow(m: Material): string[] {
  return [m.id, m.ten, m.ten_khoa_hoc, m.image ?? ""];
}

// ─── Repository ───────────────────────────────────────────────────────────────

/** Convert AppSheet relative path to our Drive image proxy URL. */
function toImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return `/api/drive-image?path=${encodeURIComponent(value)}`;
}

// Materials are shared across all plants — use a plant-neutral cache namespace.
const CACHE_NS = "material:shared";

export function makeMaterialRepository(_plantId: string): MaterialRepository {
  async function getAllMaterials(): Promise<Material[]> {
    const listKey = `${CACHE_NS}:list`;
    const cached = cache.get<Material[]>(listKey);
    if (cached) return cached;

    const rows = await readRangeById(NGUYEN_LIEU_SHEETS_ID, RANGE);
    const materials = rows
      .filter((r) => r[COL.ID])
      .map(rowToMaterial);

    cache.set(listKey, materials, TTL.REFERENCE);
    return materials;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<Material[]> {
      const all = await getAllMaterials();
      if (!query?.search) return all;
      const q = query.search.toLowerCase();
      return all.filter(
        (m) =>
          m.ten.toLowerCase().includes(q) ||
          m.ten_khoa_hoc.toLowerCase().includes(q),
      );
    },

    async get(_plantId: string, id: string): Promise<Material | null> {
      const key = `${CACHE_NS}:${id}`;
      const cached = cache.get<Material>(key);
      if (cached) return cached;

      const all = await getAllMaterials();
      const found = all.find((m) => m.id === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, id: string, patch: Partial<Material>): Promise<Material> {
      cache.invalidate(`${CACHE_NS}:*`);
      const all = await getAllMaterials();
      const idx = all.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error(`Material ${id} not found`);
      const updated = { ...all[idx], ...patch };
      await queueUpdateById(NGUYEN_LIEU_SHEETS_ID, `${SHEET}!A${idx + 2}:D${idx + 2}`, [materialToRow(updated)]);
      cache.invalidate(`${CACHE_NS}:*`);
      return updated;
    },
  };
}
