/**
 * Mock plot registry repository.
 *
 * Forest plots at NMQM — each with owners, polygon boundary coordinates,
 * and supporting documents. These represent the EUDR traceability layer.
 *
 * Business Rule 6 (ActualQuantityDelivered) is pre-baked here as a static
 * value; the real adapter will aggregate cargo net weights from completed
 * deliveries referencing each plot.
 */

import type {
  PlotRegistry,
  PlotOwner,
  PolygonCoordinate,
  PlotDocument,
  DeforestationRiskStatus,
} from '../../../types/index';
import type { PlotRepository } from '../types';

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function iso(daysAgo: number, hour = 8): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Seed: Owners ────────────────────────────────────────────────────────────

const OWNERS: PlotOwner[] = [
  // Plot PLT-001
  { id: 'own-001', plot_id: 'PLT-001', ten: 'Nguyễn Văn Tâm',  cccd: '049083004217', vai_tro: 'Chủ rừng', ty_le: 60 },
  { id: 'own-002', plot_id: 'PLT-001', ten: 'Nguyễn Thị Mai',  cccd: '049090006531', vai_tro: 'Chủ gỗ',   ty_le: 40 },
  // Plot PLT-002
  { id: 'own-003', plot_id: 'PLT-002', ten: 'Trần Văn Mạnh',   cccd: '049084001033', vai_tro: 'Chủ rừng', ty_le: 100 },
  // Plot PLT-003
  { id: 'own-004', plot_id: 'PLT-003', ten: 'Lê Thị Hoa',      cccd: '049088012490', vai_tro: 'Chủ rừng', ty_le: 50 },
  { id: 'own-005', plot_id: 'PLT-003', ten: 'Lê Văn Nam',       cccd: '049085018744', vai_tro: 'Chủ gỗ',   ty_le: 50 },
  // Plot PLT-004
  { id: 'own-006', plot_id: 'PLT-004', ten: 'Phạm Quốc Đạt',   cccd: '049082007751', vai_tro: 'Chủ rừng', ty_le: 100 },
  // Plot PLT-005
  { id: 'own-007', plot_id: 'PLT-005', ten: 'Hoàng Văn Bình',  cccd: '049089004288', vai_tro: 'Chủ rừng', ty_le: 70 },
  { id: 'own-008', plot_id: 'PLT-005', ten: 'Hoàng Thị Linh',  cccd: '049091009923', vai_tro: 'Chủ gỗ',   ty_le: 30 },
  // Plot PLT-006
  { id: 'own-009', plot_id: 'PLT-006', ten: 'Lê Văn Trường',   cccd: '059087005321', vai_tro: 'Chủ rừng', ty_le: 100 },
];

// ─── Seed: Polygon coordinates ────────────────────────────────────────────────
// Simple rectangles — good enough for dev; real coordinates come from the Sheets adapter.

const POLYGONS: PolygonCoordinate[] = [
  // PLT-001 — Quảng Trị region
  { id: 'poly-001-1', plot_id: 'PLT-001', lat: 16.7812, lng: 106.9124, thu_tu: 1 },
  { id: 'poly-001-2', plot_id: 'PLT-001', lat: 16.7891, lng: 106.9124, thu_tu: 2 },
  { id: 'poly-001-3', plot_id: 'PLT-001', lat: 16.7891, lng: 106.9243, thu_tu: 3 },
  { id: 'poly-001-4', plot_id: 'PLT-001', lat: 16.7812, lng: 106.9243, thu_tu: 4 },
  // PLT-002
  { id: 'poly-002-1', plot_id: 'PLT-002', lat: 16.6534, lng: 107.0811, thu_tu: 1 },
  { id: 'poly-002-2', plot_id: 'PLT-002', lat: 16.6612, lng: 107.0811, thu_tu: 2 },
  { id: 'poly-002-3', plot_id: 'PLT-002', lat: 16.6612, lng: 107.0944, thu_tu: 3 },
  { id: 'poly-002-4', plot_id: 'PLT-002', lat: 16.6534, lng: 107.0944, thu_tu: 4 },
  // PLT-003
  { id: 'poly-003-1', plot_id: 'PLT-003', lat: 16.5221, lng: 107.1338, thu_tu: 1 },
  { id: 'poly-003-2', plot_id: 'PLT-003', lat: 16.5289, lng: 107.1338, thu_tu: 2 },
  { id: 'poly-003-3', plot_id: 'PLT-003', lat: 16.5289, lng: 107.1430, thu_tu: 3 },
  { id: 'poly-003-4', plot_id: 'PLT-003', lat: 16.5221, lng: 107.1430, thu_tu: 4 },
];

// ─── Seed: Documents ──────────────────────────────────────────────────────────

const DOCUMENTS: PlotDocument[] = [
  {
    id: 'doc-001', plot_id: 'PLT-001',
    ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất',
    loai: 'Giấy CNQSDĐ',
    drive_url: 'https://drive.google.com/file/mock-001',
    uploaded_at: iso(30), uploaded_by: 'mock-user-1',
  },
  {
    id: 'doc-002', plot_id: 'PLT-001',
    ten_tai_lieu: 'Bản đồ lô rừng',
    loai: 'Bản đồ',
    drive_url: 'https://drive.google.com/file/mock-002',
    uploaded_at: iso(28), uploaded_by: 'mock-user-1',
  },
  {
    id: 'doc-003', plot_id: 'PLT-002',
    ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất',
    loai: 'Giấy CNQSDĐ',
    drive_url: 'https://drive.google.com/file/mock-003',
    uploaded_at: iso(45), uploaded_by: 'mock-user-1',
  },
  {
    id: 'doc-004', plot_id: 'PLT-003',
    ten_tai_lieu: 'Chứng chỉ FSC',
    loai: 'Chứng chỉ rừng',
    drive_url: 'https://drive.google.com/file/mock-004',
    uploaded_at: iso(10), uploaded_by: 'mock-user-1',
  },
];

// ─── Seed: Plots ──────────────────────────────────────────────────────────────

interface PlotSeed {
  PlotID: string;
  LandTitle: string;
  AreaHa: number;
  TreeSpecies: string;
  DeforestationRiskStatus: DeforestationRiskStatus;
  ActualQuantityDelivered: number; // tonnes — Business Rule 6
  lat: number;
  lng: number;
  createdDaysAgo: number;
}

const SEED_PLOTS: PlotSeed[] = [
  {
    PlotID: 'PLT-001', LandTitle: 'GCNQSDĐ-QT-2018-0041',
    AreaHa: 12.5, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 84.2,
    lat: 16.7851, lng: 106.9184, createdDaysAgo: 400,
  },
  {
    PlotID: 'PLT-002', LandTitle: 'GCNQSDĐ-QT-2019-0188',
    AreaHa: 8.3, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 41.7,
    lat: 16.6573, lng: 107.0878, createdDaysAgo: 320,
  },
  {
    PlotID: 'PLT-003', LandTitle: 'GCNQSDĐ-TT-2020-0027',
    AreaHa: 21.0, TreeSpecies: 'Bạch đàn',
    DeforestationRiskStatus: 'Trung bình', ActualQuantityDelivered: 152.5,
    lat: 16.5255, lng: 107.1384, createdDaysAgo: 280,
  },
  {
    PlotID: 'PLT-004', LandTitle: 'GCNQSDĐ-QN-2017-0334',
    AreaHa: 6.8, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 29.0,
    lat: 15.9876, lng: 108.1432, createdDaysAgo: 500,
  },
  {
    PlotID: 'PLT-005', LandTitle: 'GCNQSDĐ-QT-2021-0099',
    AreaHa: 15.2, TreeSpecies: 'Cao su',
    DeforestationRiskStatus: 'Trung bình', ActualQuantityDelivered: 73.3,
    lat: 16.8234, lng: 106.7891, createdDaysAgo: 200,
  },
  {
    PlotID: 'PLT-006', LandTitle: 'GCNQSDĐ-GL-2016-0012',
    AreaHa: 33.7, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Cao', ActualQuantityDelivered: 0,
    lat: 13.9812, lng: 108.0023, createdDaysAgo: 600,
  },
];

const SEED: PlotRegistry[] = SEED_PLOTS.map(p => ({
  PlotID: p.PlotID,
  LandTitle: p.LandTitle,
  AreaHa: p.AreaHa,
  TreeSpecies: p.TreeSpecies,
  DeforestationRiskStatus: p.DeforestationRiskStatus,
  ActualQuantityDelivered: p.ActualQuantityDelivered,
  nha_may: 'NMQM',
  lat: p.lat,
  lng: p.lng,
  created_at: iso(p.createdDaysAgo),
  updated_at: iso(Math.floor(p.createdDaysAgo / 3)),
  // owners / polygon / documents populated only on getWithDetails
}));

// Module-level store
const store = new Map<string, PlotRegistry>(SEED.map(p => [p.PlotID, { ...p }]));

// ─── Repository ───────────────────────────────────────────────────────────────

export const mockPlotRepository: PlotRepository = {
  async list(plantId: string): Promise<PlotRegistry[]> {
    return Array.from(store.values()).filter(p => p.nha_may === plantId);
  },

  async get(_plantId: string, id: string): Promise<PlotRegistry | null> {
    return store.get(id) ?? null;
  },

  async update(_plantId: string, id: string, patch: Partial<PlotRegistry>): Promise<PlotRegistry> {
    const existing = store.get(id);
    if (!existing) throw new Error(`Lô rừng "${id}" không tìm thấy`);
    const updated: PlotRegistry = {
      ...existing,
      ...patch,
      PlotID: id,
      updated_at: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  /** Returns the plot with owners, polygon coordinates, and documents populated. */
  async getWithDetails(_plantId: string, plotId: string): Promise<PlotRegistry | null> {
    const base = store.get(plotId);
    if (!base) return null;
    return {
      ...base,
      owners: OWNERS.filter(o => o.plot_id === plotId),
      polygon: POLYGONS.filter(p => p.plot_id === plotId),
      documents: DOCUMENTS.filter(d => d.plot_id === plotId),
    };
  },
};
