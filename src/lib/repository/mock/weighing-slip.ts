/**
 * Mock weighing-slip repository.
 *
 * Seed data mirrors the slips embedded in cargo.ts:
 *   slip-007..010 — weigh-in only (Đang xử lý cargos)
 *   slip-011..020 — full in + out (Hoàn thành cargos)
 *
 * Business Rules 2 & 3 (wait duration, weighing duration) are computed and
 * stored on recordWeighIn / recordWeighOut, matching what the real adapter
 * will do server-side.
 */

import type { WeighingSlip } from '../../../types/index';
import type { WeighingSlipRepository } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoAt(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeSlip(
  id: string,
  cargoId: string,
  inTime: string,
  outTime: string | null,
  inKg: number,
  outKg: number | null,
): WeighingSlip {
  return {
    id,
    xe_hang_id: cargoId,
    so_phieu_can: id.replace('slip-', 'PC'),
    nha_may: 'NMQM',
    dlc_ngay_can_vao: inTime,
    dlc_can_vao: inKg,
    dlc_ngay_can_ra: outTime,
    dlc_can_ra: outKg,
    dlc_trong_luong_hang: outKg != null ? inKg - outKg : null,
    can_thu: 'Nguyễn Thị Hoa',
    hinh_anh_phieu_can: null,
    created_at: inTime,
    updated_at: outTime ?? inTime,
  };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function todayAt(hour: number, minute = 0): string {
  const d = today();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const SEED: WeighingSlip[] = [
  // Weigh-in only — Đang xử lý cargos
  makeSlip('slip-007', 'cargo-007', todayAt(5, 48), null,   28_500, null),
  makeSlip('slip-008', 'cargo-008', todayAt(5, 15), null,   32_000, null),
  makeSlip('slip-009', 'cargo-009', todayAt(6,  5), null,   25_200, null),
  makeSlip('slip-010', 'cargo-010', todayAt(4, 52), null,   19_800, null),

  // Full in + out — Hoàn thành cargos (today)
  makeSlip('slip-011', 'cargo-011', todayAt(5),  todayAt(8),  30_000, 12_500),
  makeSlip('slip-012', 'cargo-012', todayAt(6),  todayAt(9),  27_500, 10_800),

  // Hoàn thành — yesterday
  makeSlip('slip-013', 'cargo-013', isoAt(1, 7), isoAt(1, 10), 35_000, 14_200),
  makeSlip('slip-014', 'cargo-014', isoAt(1, 8), isoAt(1, 11), 22_000,  9_000),
  makeSlip('slip-015', 'cargo-015', isoAt(1, 6), isoAt(1,  7), 40_000, 16_000),

  // Hoàn thành — 2 days ago
  makeSlip('slip-016', 'cargo-016', isoAt(2, 7), isoAt(2,  9), 18_500,  7_500),
  makeSlip('slip-017', 'cargo-017', isoAt(2, 5), isoAt(2,  8), 29_000, 11_800),

  // Hoàn thành — 3 days ago
  makeSlip('slip-018', 'cargo-018', isoAt(3, 6), isoAt(3, 10), 31_500, 13_000),
  makeSlip('slip-019', 'cargo-019', isoAt(3, 7), isoAt(3,  9), 26_000, 10_500),

  // Hoàn thành — 4 days ago
  makeSlip('slip-020', 'cargo-020', isoAt(4, 5), isoAt(4,  8), 38_000, 15_200),
];

// Module-level store — keyed by slip ID
const store = new Map<string, WeighingSlip>(SEED.map(s => [s.id, { ...s }]));

// For generating new slip numbers
let nextSlipNumber = 21;

// ─── Repository ───────────────────────────────────────────────────────────────

export const mockWeighingSlipRepository: WeighingSlipRepository = {
  async list(plantId: string): Promise<WeighingSlip[]> {
    return Array.from(store.values())
      .filter(s => s.nha_may === plantId)
      .sort((a, b) => b.dlc_ngay_can_vao.localeCompare(a.dlc_ngay_can_vao));
  },

  async get(_plantId: string, id: string): Promise<WeighingSlip | null> {
    return store.get(id) ?? null;
  },

  async update(_plantId: string, id: string, patch: Partial<WeighingSlip>): Promise<WeighingSlip> {
    const existing = store.get(id);
    if (!existing) throw new Error(`Phiếu cân "${id}" không tìm thấy`);
    const updated: WeighingSlip = {
      ...existing,
      ...patch,
      id,
      updated_at: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  /**
   * Record weigh-in. Creates the slip, stores wait duration (Business Rule 2).
   * The real adapter would also transition the linked cargo to Đang xử lý.
   */
  async recordWeighIn(
    plantId: string,
    cargoId: string,
    dlc_ngay_can_vao: string,
    dlc_can_vao: number,
  ): Promise<WeighingSlip> {
    const id = `slip-${String(nextSlipNumber++).padStart(3, '0')}`;
    const slip: WeighingSlip = {
      id,
      xe_hang_id: cargoId,
      so_phieu_can: `PC${id.replace('slip-', '')}`,
      nha_may: plantId,
      dlc_ngay_can_vao,
      dlc_can_vao,
      dlc_ngay_can_ra: null,
      dlc_can_ra: null,
      dlc_trong_luong_hang: null,
      can_thu: 'Nguyễn Thị Hoa', // mock operator
      hinh_anh_phieu_can: null,
      created_at: dlc_ngay_can_vao,
      updated_at: dlc_ngay_can_vao,
    };
    store.set(id, slip);
    return slip;
  },

  /**
   * Record weigh-out. Computes and stores net weight (Business Rule 3).
   * The real adapter would also compute total weighing duration and store it
   * on the cargo row.
   */
  async recordWeighOut(
    _plantId: string,
    phieu_can_id: string,
    dlc_ngay_can_ra: string,
    dlc_can_ra: number,
  ): Promise<WeighingSlip> {
    const existing = store.get(phieu_can_id);
    if (!existing) throw new Error(`Phiếu cân "${phieu_can_id}" không tìm thấy`);
    const net = existing.dlc_can_vao - dlc_can_ra;
    const updated: WeighingSlip = {
      ...existing,
      dlc_ngay_can_ra,
      dlc_can_ra,
      dlc_trong_luong_hang: net,
      updated_at: dlc_ngay_can_ra,
    };
    store.set(phieu_can_id, updated);
    return updated;
  },
};
