/**
 * Google Sheets adapter — PhieuCan (WeighingSlip) + DuLieuCan sheets.
 *
 * PhieuCan is the slip header; DuLieuCan holds the individual weigh readings.
 * For Phase 1 simplicity both are collapsed into the WeighingSlip entity.
 *
 * PhieuCan columns:
 *   A=id, B=xe_hang_id, C=so_phieu_can, D=nha_may, E=dlc_ngay_can_vao,
 *   F=dlc_can_vao, G=dlc_ngay_can_ra, H=dlc_can_ra, I=dlc_trong_luong_hang,
 *   J=can_thu, K=hinh_anh_phieu_can, L=created_at, M=updated_at
 */

import type { WeighingSlip } from "../../../types/index";
import type { WeighingSlipRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRange, cell, numOrNull, strOrNull, queueUpdate, appendRows } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";
import { randomUUID } from "crypto";

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0, XE_HANG_ID: 1, SO_PHIEU_CAN: 2, NHA_MAY: 3,
  DLC_NGAY_CAN_VAO: 4, DLC_CAN_VAO: 5,
  DLC_NGAY_CAN_RA: 6, DLC_CAN_RA: 7, DLC_TRONG_LUONG_HANG: 8,
  CAN_THU: 9, HINH_ANH: 10, CREATED_AT: 11, UPDATED_AT: 12,
} as const;

const COL_LEN = 13;
const SHEET_BASE = "PhieuCan";
const sheet = (plantId: string) => `${SHEET_BASE}_${plantId}`;
const range = (plantId: string) => `${sheet(plantId)}!A2:M`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToSlip(row: string[]): WeighingSlip {
  return {
    id: cell(row, COL.ID),
    xe_hang_id: cell(row, COL.XE_HANG_ID),
    so_phieu_can: cell(row, COL.SO_PHIEU_CAN),
    nha_may: cell(row, COL.NHA_MAY),
    dlc_ngay_can_vao: cell(row, COL.DLC_NGAY_CAN_VAO),
    dlc_can_vao: numOrNull(row, COL.DLC_CAN_VAO) ?? 0,
    dlc_ngay_can_ra: strOrNull(row, COL.DLC_NGAY_CAN_RA),
    dlc_can_ra: numOrNull(row, COL.DLC_CAN_RA),
    dlc_trong_luong_hang: numOrNull(row, COL.DLC_TRONG_LUONG_HANG),
    can_thu: strOrNull(row, COL.CAN_THU),
    hinh_anh_phieu_can: strOrNull(row, COL.HINH_ANH),
    created_at: cell(row, COL.CREATED_AT),
    updated_at: cell(row, COL.UPDATED_AT),
  };
}

export function slipToRow(s: WeighingSlip): string[] {
  const row = new Array<string>(COL_LEN).fill("");
  row[COL.ID] = s.id;
  row[COL.XE_HANG_ID] = s.xe_hang_id;
  row[COL.SO_PHIEU_CAN] = s.so_phieu_can;
  row[COL.NHA_MAY] = s.nha_may;
  row[COL.DLC_NGAY_CAN_VAO] = s.dlc_ngay_can_vao;
  row[COL.DLC_CAN_VAO] = String(s.dlc_can_vao);
  row[COL.DLC_NGAY_CAN_RA] = s.dlc_ngay_can_ra ?? "";
  row[COL.DLC_CAN_RA] = s.dlc_can_ra != null ? String(s.dlc_can_ra) : "";
  row[COL.DLC_TRONG_LUONG_HANG] = s.dlc_trong_luong_hang != null ? String(s.dlc_trong_luong_hang) : "";
  row[COL.CAN_THU] = s.can_thu ?? "";
  row[COL.HINH_ANH] = s.hinh_anh_phieu_can ?? "";
  row[COL.CREATED_AT] = s.created_at;
  row[COL.UPDATED_AT] = s.updated_at;
  return row;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makeWeighingSlipRepository(plantId: string): WeighingSlipRepository {
  async function getAllSlips(): Promise<WeighingSlip[]> {
    const key = listCacheKey("weighing-slip", plantId, "all");
    const cached = cache.get<WeighingSlip[]>(key);
    if (cached) return cached;

    const rows = await readRange(plantId, range(plantId));
    const slips = rows
      .filter((r) => r[COL.ID] && r[COL.NHA_MAY] === plantId)
      .map(rowToSlip);

    cache.set(key, slips, TTL.CARGO_LIST);
    return slips;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<WeighingSlip[]> {
      const all = await getAllSlips();
      if (!query?.filters?.xe_hang_id) return all;
      return all.filter((s) => s.xe_hang_id === query.filters!.xe_hang_id);
    },

    async get(_plantId: string, id: string): Promise<WeighingSlip | null> {
      const key = cacheKey("weighing-slip", plantId, id);
      const cached = cache.get<WeighingSlip>(key);
      if (cached) return cached;

      const all = await getAllSlips();
      const found = all.find((s) => s.id === id) ?? null;
      if (found) cache.set(key, found, TTL.CARGO_DETAIL);
      return found;
    },

    async update(_plantId: string, id: string, patch: Partial<WeighingSlip>): Promise<WeighingSlip> {
      cache.invalidate(`weighing-slip:${plantId}:*`);
      const rows = await readRange(plantId, range(plantId));
      const idx = rows.findIndex((r) => r[COL.ID] === id);
      if (idx === -1) throw new Error(`WeighingSlip ${id} not found`);

      const updated: WeighingSlip = {
        ...rowToSlip(rows[idx]),
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdate(plantId, `${sheet(plantId)}!A${idx + 2}:M${idx + 2}`, [slipToRow(updated)]);
      cache.invalidate(`weighing-slip:${plantId}:*`);
      return updated;
    },

    async recordWeighIn(
      _plantId: string,
      cargoId: string,
      dlc_ngay_can_vao: string,
      dlc_can_vao: number,
    ): Promise<WeighingSlip> {
      const now = new Date().toISOString();
      const id = randomUUID();
      const slipNumber = `PC${Date.now()}`;

      const slip: WeighingSlip = {
        id,
        xe_hang_id: cargoId,
        so_phieu_can: slipNumber,
        nha_may: plantId,
        dlc_ngay_can_vao,
        dlc_can_vao,
        dlc_ngay_can_ra: null,
        dlc_can_ra: null,
        dlc_trong_luong_hang: null,
        can_thu: null,
        hinh_anh_phieu_can: null,
        created_at: now,
        updated_at: now,
      };

      await appendRows(plantId, `${sheet(plantId)}!A:M`, [slipToRow(slip)]);
      cache.invalidate(`weighing-slip:${plantId}:*`);
      return slip;
    },

    async recordWeighOut(
      _plantId: string,
      phieu_can_id: string,
      dlc_ngay_can_ra: string,
      dlc_can_ra: number,
    ): Promise<WeighingSlip> {
      const rows = await readRange(plantId, range(plantId));
      const idx = rows.findIndex((r) => r[COL.ID] === phieu_can_id);
      if (idx === -1) throw new Error(`WeighingSlip ${phieu_can_id} not found`);

      const existing = rowToSlip(rows[idx]);
      const net = existing.dlc_can_vao - dlc_can_ra;
      const updated: WeighingSlip = {
        ...existing,
        dlc_ngay_can_ra,
        dlc_can_ra,
        dlc_trong_luong_hang: net,
        updated_at: new Date().toISOString(),
      };

      await queueUpdate(plantId, `${sheet(plantId)}!A${idx + 2}:M${idx + 2}`, [slipToRow(updated)]);
      cache.invalidate(`weighing-slip:${plantId}:*`);
      return updated;
    },
  };
}
