/**
 * Mock driver repository.
 *
 * Driver creation belongs to the gate AppSheet app — this repo exposes only
 * list / get / update / findByPlate. The seed matches the design-handoff
 * dataset (design_handoff_drivers) so the Tài xế screen has realistic data.
 *
 * Business Rule 4: completedDeliveries is a query-time aggregate. Here it is
 * pre-baked into seed data; the real adapter will count cargo rows.
 *
 * The optional gate-app fields (gplx, hang_gplx, han_gplx, khu_vuc, ngay_vao,
 * trang_thai_tai_xe, trips30, kg30, totalTrips, all_plates) are populated in
 * the seed so the Tài xế module has full fidelity without an API round-trip.
 */

import type { Driver } from '../../../types/index';
import type { DriverRepository } from '../types';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Driver[] = [
  // ── NMXH plant ─────────────────────────────────────────────────────────────
  {
    id: 'drv-01',
    ten: 'Nguyễn Văn Tâm',
    cccd: '049083004217',
    so_dien_thoai: '0905 218 447',
    so_xe: '75A-218.47',
    nha_may: 'NMXH',
    completedDeliveries: 312,
    created_at: '2022-03-14T08:00:00.000Z',
    updated_at: '2026-05-20T08:00:00.000Z',
    gplx: '790112034881',
    hang_gplx: 'FC',
    han_gplx: '2026-07-12',
    khu_vuc: 'Quảng Trị',
    ngay_vao: '2022-03-14',
    trang_thai_tai_xe: 'active',
    trips30: 14,
    kg30: 87400,
    totalTrips: 312,
    all_plates: ['75A-218.47'],
  },
  {
    id: 'drv-02',
    ten: 'Trần Quốc Bảo',
    cccd: '049084001033',
    so_dien_thoai: '0913 770 052',
    so_xe: '92C-100.52',
    nha_may: 'NMXH',
    completedDeliveries: 178,
    created_at: '2021-11-02T08:00:00.000Z',
    updated_at: '2026-05-25T08:00:00.000Z',
    gplx: '790118220194',
    hang_gplx: 'C',
    han_gplx: '2026-06-09',
    khu_vuc: 'Quảng Nam',
    ngay_vao: '2021-11-02',
    trang_thai_tai_xe: 'active',
    trips30: 9,
    kg30: 54200,
    totalTrips: 178,
    all_plates: ['92C-100.52', '92C-200.18'],
  },
  {
    id: 'drv-03',
    ten: 'Lê Hoàng Phúc',
    cccd: '049088012490',
    so_dien_thoai: '0987 411 309',
    so_xe: '43A-411.30',
    nha_may: 'NMXH',
    completedDeliveries: 95,
    created_at: '2023-01-19T08:00:00.000Z',
    updated_at: '2026-05-22T08:00:00.000Z',
    gplx: '790120771630',
    hang_gplx: 'FC',
    han_gplx: '2026-06-02',
    khu_vuc: 'Đà Nẵng',
    ngay_vao: '2023-01-19',
    trang_thai_tai_xe: 'expiring',
    trips30: 6,
    kg30: 41300,
    totalTrips: 95,
    all_plates: ['43A-411.30'],
  },
  {
    id: 'drv-04',
    ten: 'Phạm Đình Sơn',
    cccd: '049082007751',
    so_dien_thoai: '0935 882 117',
    so_xe: '81A-882.11',
    nha_may: 'NMXH',
    completedDeliveries: 497,
    created_at: '2020-08-30T08:00:00.000Z',
    updated_at: '2026-05-27T08:00:00.000Z',
    gplx: '790115003442',
    hang_gplx: 'C',
    han_gplx: '2027-02-28',
    khu_vuc: 'Gia Lai',
    ngay_vao: '2020-08-30',
    trang_thai_tai_xe: 'active',
    trips30: 18,
    kg30: 109600,
    totalTrips: 497,
    all_plates: ['81A-882.11', '81A-003.44'],
  },
  {
    id: 'drv-05',
    ten: 'Hoàng Minh Đức',
    cccd: '049089004288',
    so_dien_thoai: '0901 663 270',
    so_xe: '92C-663.27',
    nha_may: 'NMXH',
    completedDeliveries: 268,
    created_at: '2023-09-05T08:00:00.000Z',
    updated_at: '2026-05-28T08:00:00.000Z',
    gplx: '790121448900',
    hang_gplx: 'E',
    han_gplx: '2026-05-31',
    khu_vuc: 'Quảng Nam',
    ngay_vao: '2023-09-04',
    trang_thai_tai_xe: 'expiring',
    trips30: 2,
    kg30: 16000,
    totalTrips: 268,
    all_plates: ['92C-663.27'],
  },
  {
    id: 'drv-06',
    ten: 'Võ Thanh Hùng',
    cccd: '064085001244',
    so_dien_thoai: '0972 504 188',
    so_xe: '81C-504.18',
    nha_may: 'NMXH',
    completedDeliveries: 553,
    created_at: '2019-04-22T08:00:00.000Z',
    updated_at: '2026-05-26T08:00:00.000Z',
    gplx: '640112770013',
    hang_gplx: 'FC',
    han_gplx: '2026-12-20',
    khu_vuc: 'Gia Lai',
    ngay_vao: '2019-04-22',
    trang_thai_tai_xe: 'active',
    trips30: 21,
    kg30: 138500,
    totalTrips: 553,
    all_plates: ['81C-504.18', '81C-770.01'],
  },

  // ── NMQM plant ─────────────────────────────────────────────────────────────
  {
    id: 'drv-07',
    ten: 'Đặng Văn Lộc',
    cccd: '064088000922',
    so_dien_thoai: '0944 117 836',
    so_xe: '47A-117.83',
    nha_may: 'NMQM',
    completedDeliveries: 41,
    created_at: '2024-02-08T08:00:00.000Z',
    updated_at: '2026-01-10T08:00:00.000Z',
    gplx: '640119002255',
    hang_gplx: 'C',
    han_gplx: '2025-11-15',
    khu_vuc: 'Khánh Hòa',
    ngay_vao: '2024-02-08',
    trang_thai_tai_xe: 'suspended',
    trips30: 0,
    kg30: 0,
    totalTrips: 41,
    all_plates: ['47A-117.83'],
  },
  {
    id: 'drv-08',
    ten: 'Bùi Quang Huy',
    cccd: '064084003781',
    so_dien_thoai: '0918 209 644',
    so_xe: '82D-209.64',
    nha_may: 'NMQM',
    completedDeliveries: 389,
    created_at: '2021-06-17T08:00:00.000Z',
    updated_at: '2026-05-27T08:00:00.000Z',
    gplx: '640114668120',
    hang_gplx: 'FC',
    han_gplx: '2027-08-01',
    khu_vuc: 'Gia Lai',
    ngay_vao: '2021-06-17',
    trang_thai_tai_xe: 'active',
    trips30: 16,
    kg30: 96800,
    totalTrips: 389,
    all_plates: ['82D-209.64', '82D-668.12'],
  },
  {
    id: 'drv-09',
    ten: 'Ngô Đức Trí',
    cccd: '049081002455',
    so_dien_thoai: '0903 558 901',
    so_xe: '92B-558.90',
    nha_may: 'NMQM',
    completedDeliveries: 224,
    created_at: '2022-10-11T08:00:00.000Z',
    updated_at: '2026-05-24T08:00:00.000Z',
    gplx: '790110224578',
    hang_gplx: 'B2',
    han_gplx: '2026-09-22',
    khu_vuc: 'Quảng Nam',
    ngay_vao: '2022-10-11',
    trang_thai_tai_xe: 'active',
    trips30: 11,
    kg30: 66100,
    totalTrips: 224,
    all_plates: ['92B-558.90'],
  },
  {
    id: 'drv-10',
    ten: 'Phan Văn Nam',
    cccd: '049087001023',
    so_dien_thoai: '0966 340 712',
    so_xe: '43C-340.71',
    nha_may: 'NMQM',
    completedDeliveries: 12,
    created_at: '2024-05-20T08:00:00.000Z',
    updated_at: '2026-05-15T08:00:00.000Z',
    gplx: '790122990147',
    hang_gplx: 'C',
    han_gplx: '2026-06-18',
    khu_vuc: 'Đà Nẵng',
    ngay_vao: '2024-05-20',
    trang_thai_tai_xe: 'pending',
    trips30: 3,
    kg30: 18200,
    totalTrips: 12,
    all_plates: ['43C-340.71'],
  },
  {
    id: 'drv-11',
    ten: 'Đỗ Hữu Thắng',
    cccd: '049085001980',
    so_dien_thoai: '0978 661 205',
    so_xe: '75B-661.20',
    nha_may: 'NMQM',
    completedDeliveries: 441,
    created_at: '2020-12-01T08:00:00.000Z',
    updated_at: '2026-05-28T08:00:00.000Z',
    gplx: '790116300988',
    hang_gplx: 'FC',
    han_gplx: '2027-04-09',
    khu_vuc: 'Quảng Trị',
    ngay_vao: '2020-12-01',
    trang_thai_tai_xe: 'active',
    trips30: 19,
    kg30: 117400,
    totalTrips: 441,
    all_plates: ['75B-661.20', '75B-300.98'],
  },
  {
    id: 'drv-12',
    ten: 'Cao Bá Quát',
    cccd: '048084002115',
    so_dien_thoai: '0939 884 016',
    so_xe: '47B-884.01',
    nha_may: 'NMQM',
    completedDeliveries: 156,
    created_at: '2023-07-30T08:00:00.000Z',
    updated_at: '2026-05-23T08:00:00.000Z',
    gplx: '480113557742',
    hang_gplx: 'E',
    han_gplx: '2026-06-05',
    khu_vuc: 'Khánh Hòa',
    ngay_vao: '2023-07-30',
    trang_thai_tai_xe: 'expiring',
    trips30: 7,
    kg30: 43900,
    totalTrips: 156,
    all_plates: ['47B-884.01'],
  },
];

// Module-level store — persists across re-renders, resets on server restart.
const store = new Map<string, Driver>(SEED.map(d => [d.id, { ...d }]));

// ─── Repository ───────────────────────────────────────────────────────────────

export const mockDriverRepository: DriverRepository = {
  async list(plantId: string): Promise<Driver[]> {
    return Array.from(store.values()).filter(d => d.nha_may === plantId);
  },

  async get(_plantId: string, id: string): Promise<Driver | null> {
    return store.get(id) ?? null;
  },

  async update(_plantId: string, id: string, patch: Partial<Driver>): Promise<Driver> {
    const existing = store.get(id);
    if (!existing) throw new Error(`Tài xế "${id}" không tìm thấy`);
    const updated: Driver = { ...existing, ...patch, id, updated_at: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  async findByPlate(plantId: string, so_xe: string): Promise<Driver | null> {
    const normalised = so_xe.trim().toUpperCase();
    return (
      Array.from(store.values()).find(
        d => d.nha_may === plantId && d.so_xe.toUpperCase() === normalised,
      ) ?? null
    );
  },
};
