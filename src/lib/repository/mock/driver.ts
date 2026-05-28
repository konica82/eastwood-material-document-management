/**
 * Mock driver repository.
 *
 * Driver creation belongs to the gate AppSheet app — this repo exposes only
 * list / get / update / findByPlate. The seed matches the inline stubs in
 * cargo.ts so joined driver objects are consistent.
 *
 * Business Rule 4: completedDeliveries is a query-time aggregate. Here it is
 * pre-baked into seed data; the real adapter will count cargo rows.
 */

import type { Driver } from '../../../types/index';
import type { DriverRepository } from '../types';

// ─── Seed data ────────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 8): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const SEED: Driver[] = [
  {
    id: 'drv-01',
    ten: 'Nguyễn Văn An',
    cccd: '079123456789',
    cccd_qrcode_scan: '079123456789|Nguyễn Văn An|19850312|Nam|Đà Nẵng|20230101',
    so_dien_thoai: '0901 234 567',
    so_xe: '51A-123.45',
    nha_may: 'NMQM',
    completedDeliveries: 42,
    created_at: daysAgo(90),
    updated_at: daysAgo(10),
  },
  {
    id: 'drv-02',
    ten: 'Trần Thị Bình',
    cccd: '079234567890',
    cccd_qrcode_scan: '079234567890|Trần Thị Bình|19900715|Nữ|Quảng Nam|20230601',
    so_dien_thoai: '0912 345 678',
    so_xe: '51B-234.56',
    nha_may: 'NMQM',
    completedDeliveries: 28,
    created_at: daysAgo(80),
    updated_at: daysAgo(5),
  },
  {
    id: 'drv-03',
    ten: 'Lê Văn Cường',
    cccd: '079345678901',
    cccd_qrcode_scan: '079345678901|Lê Văn Cường|19780920|Nam|Thừa Thiên Huế|20220115',
    so_dien_thoai: '0923 456 789',
    so_xe: '51C-345.67',
    nha_may: 'NMQM',
    completedDeliveries: 67,
    created_at: daysAgo(120),
    updated_at: daysAgo(2),
  },
  {
    id: 'drv-04',
    ten: 'Phạm Văn Dũng',
    cccd: '079456789012',
    cccd_qrcode_scan: '079456789012|Phạm Văn Dũng|19920204|Nam|Quảng Trị|20230801',
    so_dien_thoai: '0934 567 890',
    so_xe: '60A-456.78',
    nha_may: 'NMQM',
    completedDeliveries: 15,
    created_at: daysAgo(60),
    updated_at: daysAgo(7),
  },
  {
    id: 'drv-05',
    ten: 'Hoàng Thị Lan',
    cccd: '079567890123',
    cccd_qrcode_scan: '079567890123|Hoàng Thị Lan|19881130|Nữ|Nghệ An|20221210',
    so_dien_thoai: '0945 678 901',
    so_xe: '60B-567.89',
    nha_may: 'NMQM',
    completedDeliveries: 33,
    created_at: daysAgo(100),
    updated_at: daysAgo(3),
  },
  {
    id: 'drv-06',
    ten: 'Vũ Văn Minh',
    cccd: '079678901234',
    cccd_qrcode_scan: '079678901234|Vũ Văn Minh|19830605|Nam|Bình Định|20230301',
    so_dien_thoai: '0956 789 012',
    so_xe: '51D-678.90',
    nha_may: 'NMQM',
    completedDeliveries: 51,
    created_at: daysAgo(75),
    updated_at: daysAgo(1),
  },
  // NMXH plant drivers
  {
    id: 'drv-07',
    ten: 'Đoàn Văn Hải',
    cccd: '001085003341',
    cccd_qrcode_scan: '001085003341|Đoàn Văn Hải|19850510|Nam|Hà Nội|20220820',
    so_dien_thoai: '0967 890 123',
    so_xe: '29A-100.01',
    nha_may: 'NMXH',
    completedDeliveries: 19,
    created_at: daysAgo(45),
    updated_at: daysAgo(4),
  },
  {
    id: 'drv-08',
    ten: 'Bùi Thị Thu',
    cccd: '031090007812',
    cccd_qrcode_scan: '031090007812|Bùi Thị Thu|19900222|Nữ|Hải Phòng|20230411',
    so_dien_thoai: '0978 901 234',
    so_xe: '15A-200.02',
    nha_may: 'NMXH',
    completedDeliveries: 8,
    created_at: daysAgo(30),
    updated_at: daysAgo(6),
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
