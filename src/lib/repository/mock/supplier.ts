import type { Supplier, SecondarySupplier } from '../../../types/index';
import type { SupplierRepository } from '../types';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PRIMARIES: Supplier[] = [
  {
    id: 'ncc-001',
    ten: 'Hợp tác xã Lâm nghiệp Bến Hải',
    hinh_thuc: 'Công ty',
    cccd_mst: '3300687412',
    so_dien_thoai: '0234 555 0148',
    dia_chi: 'Thôn Hiền Lương, xã Vĩnh Thành, huyện Vĩnh Linh, tỉnh Quảng Trị',
    nha_may: 'NMQM',
    created_at: '2023-04-18T07:00:00.000Z',
    updated_at: '2024-01-10T08:30:00.000Z',
  },
  {
    id: 'ncc-002',
    ten: 'Công ty TNHH Lâm sản Tây Nguyên',
    hinh_thuc: 'Công ty',
    cccd_mst: '5901234567',
    so_dien_thoai: '0262 388 4521',
    dia_chi: '12 Đường Hùng Vương, TP Pleiku, tỉnh Gia Lai',
    nha_may: 'NMQM',
    created_at: '2022-11-03T09:15:00.000Z',
    updated_at: '2023-12-05T14:20:00.000Z',
  },
  {
    id: 'ncc-003',
    ten: 'HTX Trồng rừng Cẩm Lệ',
    hinh_thuc: 'Công ty',
    cccd_mst: '0401889234',
    so_dien_thoai: '0236 219 7788',
    dia_chi: 'Xã Hòa Châu, huyện Hòa Vang, TP Đà Nẵng',
    nha_may: 'NMQM',
    created_at: '2023-08-22T10:00:00.000Z',
    updated_at: '2024-02-14T11:45:00.000Z',
  },
  {
    id: 'ncc-004',
    ten: 'Nguyễn Văn Hùng',
    hinh_thuc: 'Cá nhân',
    cccd_mst: '049083001122',
    so_dien_thoai: '0905 342 817',
    dia_chi: 'Thôn A Ngo, xã A Lưới, huyện A Lưới, tỉnh Thừa Thiên Huế',
    nha_may: 'NMQM',
    created_at: '2023-06-15T08:00:00.000Z',
    updated_at: '2023-09-20T16:30:00.000Z',
  },
  {
    id: 'ncc-005',
    ten: 'Công ty CP Nguyên liệu Phước Sơn',
    hinh_thuc: 'Công ty',
    cccd_mst: '4001567890',
    so_dien_thoai: '0255 391 6644',
    dia_chi: 'KCN Phước Nam, huyện Phước Sơn, tỉnh Quảng Nam',
    nha_may: 'NMQM',
    created_at: '2022-07-01T07:30:00.000Z',
    updated_at: '2024-01-28T09:10:00.000Z',
  },
  {
    id: 'ncc-006',
    ten: 'HTX Lâm nghiệp Đại Lộc',
    hinh_thuc: 'Công ty',
    cccd_mst: '4001998800',
    so_dien_thoai: '0235 288 3300',
    dia_chi: 'Xã Đại Hồng, huyện Đại Lộc, tỉnh Quảng Nam',
    nha_may: 'NMQM',
    created_at: '2022-03-10T06:45:00.000Z',
    updated_at: '2023-11-17T13:00:00.000Z',
  },
];

const SEED_SECONDARIES: SecondarySupplier[] = [
  // Under HTX Bến Hải (ncc-001)
  { id: 'ncp-001', ten: 'Nguyễn Văn Tâm',  hinh_thuc: 'Cá nhân', cccd_mst: '049083004217', so_dien_thoai: '0905 111 001', nha_cung_cap_chinh_id: 'ncc-001' },
  { id: 'ncp-002', ten: 'Trần Văn Mạnh',   hinh_thuc: 'Cá nhân', cccd_mst: '049084001033', so_dien_thoai: '0905 111 002', nha_cung_cap_chinh_id: 'ncc-001' },
  { id: 'ncp-003', ten: 'Lê Thị Hoa',      hinh_thuc: 'Cá nhân', cccd_mst: '049088012490', so_dien_thoai: '0905 111 003', nha_cung_cap_chinh_id: 'ncc-001' },
  { id: 'ncp-004', ten: 'Phạm Quốc Đạt',   hinh_thuc: 'Cá nhân', cccd_mst: '049082007751', so_dien_thoai: '0905 111 004', nha_cung_cap_chinh_id: 'ncc-001' },
  { id: 'ncp-005', ten: 'Hoàng Văn Bình',  hinh_thuc: 'Cá nhân', cccd_mst: '049089004288', so_dien_thoai: '0905 111 005', nha_cung_cap_chinh_id: 'ncc-001' },
  // Under TN Tây Nguyên (ncc-002)
  { id: 'ncp-006', ten: 'Lê Văn Trường',   hinh_thuc: 'Cá nhân', cccd_mst: '059087005321', so_dien_thoai: '0916 234 567', nha_cung_cap_chinh_id: 'ncc-002' },
  // Under CP Phước Sơn (ncc-005)
  { id: 'ncp-007', ten: 'Phan Thị Lan',    hinh_thuc: 'Cá nhân', cccd_mst: '048085009812', so_dien_thoai: '0977 345 678', nha_cung_cap_chinh_id: 'ncc-005' },
  { id: 'ncp-008', ten: 'Võ Đình Tuấn',    hinh_thuc: 'Cá nhân', cccd_mst: '048083011430', so_dien_thoai: '0918 456 789', nha_cung_cap_chinh_id: 'ncc-005' },
];

// Module-level stores — survive hot-reload, reset on server restart.
const primaryStore = new Map<string, Supplier>(SEED_PRIMARIES.map(s => [s.id, { ...s }]));
const secondaryStore = new Map<string, SecondarySupplier>(SEED_SECONDARIES.map(s => [s.id, { ...s }]));

// ─── Repository ───────────────────────────────────────────────────────────────

export const mockSupplierRepository: SupplierRepository = {
  async list(plantId: string): Promise<Supplier[]> {
    return Array.from(primaryStore.values()).filter(s => s.nha_may === plantId);
  },

  async get(_plantId: string, id: string): Promise<Supplier | null> {
    const s = primaryStore.get(id);
    if (!s) return null;
    const secondarySuppliers = Array.from(secondaryStore.values()).filter(
      sec => sec.nha_cung_cap_chinh_id === id,
    );
    return { ...s, secondarySuppliers };
  },

  async update(_plantId: string, id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const existing = primaryStore.get(id);
    if (!existing) throw new Error(`Nhà cung cấp "${id}" không tìm thấy`);
    const updated: Supplier = { ...existing, ...patch, id };
    primaryStore.set(id, updated);
    return updated;
  },

  async listSecondary(_plantId: string, primarySupplierId: string): Promise<SecondarySupplier[]> {
    return Array.from(secondaryStore.values()).filter(
      s => s.nha_cung_cap_chinh_id === primarySupplierId,
    );
  },

  async getSecondary(_plantId: string, id: string): Promise<SecondarySupplier | null> {
    const s = secondaryStore.get(id);
    if (!s) return null;
    const primary = primaryStore.get(s.nha_cung_cap_chinh_id) ?? null;
    return { ...s, nha_cung_cap_chinh: primary };
  },

  async updateSecondary(_plantId: string, id: string, patch: Partial<SecondarySupplier>): Promise<SecondarySupplier> {
    const existing = secondaryStore.get(id);
    if (!existing) throw new Error(`Nhà cung cấp phụ "${id}" không tìm thấy`);
    const updated: SecondarySupplier = { ...existing, ...patch, id };
    secondaryStore.set(id, updated);
    return updated;
  },
};
