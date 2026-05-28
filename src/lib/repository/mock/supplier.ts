import type { Supplier, SecondarySupplier } from '../../../types/index';
import type { SupplierRepository } from '../types';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PRIMARIES: Supplier[] = [
  {
    id: 'ncc-001',
    ten: 'Hợp tác xã Lâm nghiệp Bến Hải',
    hinh_thuc: 'Công ty',
    loai_hinh: 'HTX',
    cccd_mst: '3300687412',
    so_dien_thoai: '0234 555 0148',
    nguoi_dai_dien: 'Nguyễn Văn Quân',
    dia_chi: 'Thôn Hiền Lương, xã Vĩnh Thành, huyện Vĩnh Linh, tỉnh Quảng Trị',
    nha_may: 'NMQM',
    chung_chi: 'FSC-CoC',
    created_at: '2023-04-17T07:00:00.000Z',
    updated_at: '2024-01-10T08:30:00.000Z',
  },
  {
    id: 'ncc-002',
    ten: 'Công ty TNHH Lâm sản Tây Nguyên',
    hinh_thuc: 'Công ty',
    loai_hinh: 'TNHH',
    cccd_mst: '5901234567',
    so_dien_thoai: '0262 388 4521',
    nguoi_dai_dien: 'Trần Minh Hoàng',
    dia_chi: '12 Đường Hùng Vương, TP Pleiku, tỉnh Gia Lai',
    nha_may: 'NMQM',
    created_at: '2022-11-03T09:15:00.000Z',
    updated_at: '2023-12-05T14:20:00.000Z',
  },
  {
    id: 'ncc-003',
    ten: 'HTX Trồng rừng Cẩm Lệ',
    hinh_thuc: 'Công ty',
    loai_hinh: 'HTX',
    cccd_mst: '0401889234',
    so_dien_thoai: '0236 219 7788',
    nguoi_dai_dien: 'Lê Thị Thanh',
    dia_chi: 'Xã Hòa Châu, huyện Hòa Vang, TP Đà Nẵng',
    nha_may: 'NMQM',
    created_at: '2023-08-22T10:00:00.000Z',
    updated_at: '2024-02-14T11:45:00.000Z',
  },
  {
    id: 'ncc-004',
    ten: 'HTX Lâm nghiệp Đại Lộc',
    hinh_thuc: 'Công ty',
    loai_hinh: 'HTX',
    cccd_mst: '4001998800',
    so_dien_thoai: '0235 288 3300',
    nguoi_dai_dien: 'Phạm Văn Tùng',
    dia_chi: 'Xã Đại Hồng, huyện Đại Lộc, tỉnh Quảng Nam',
    nha_may: 'NMQM',
    created_at: '2022-03-10T06:45:00.000Z',
    updated_at: '2023-11-17T13:00:00.000Z',
  },
  {
    id: 'ncc-005',
    ten: 'Công ty CP Nguyên liệu Phước Sơn',
    hinh_thuc: 'Công ty',
    loai_hinh: 'CP',
    cccd_mst: '4001567890',
    so_dien_thoai: '0255 391 6644',
    nguoi_dai_dien: 'Hoàng Đức Nam',
    dia_chi: 'KCN Phước Nam, huyện Phước Sơn, tỉnh Quảng Nam',
    nha_may: 'NMQM',
    chung_chi: 'FSC-FM',
    created_at: '2022-07-01T07:30:00.000Z',
    updated_at: '2024-01-28T09:10:00.000Z',
  },
  {
    id: 'ncc-006',
    ten: 'Công ty TNHH Lâm nghiệp Tiến Phát',
    hinh_thuc: 'Công ty',
    loai_hinh: 'TNHH',
    cccd_mst: '4002113344',
    so_dien_thoai: '0235 441 2200',
    nguoi_dai_dien: 'Võ Thị Hà',
    dia_chi: '58 Lê Lợi, TP Tam Kỳ, tỉnh Quảng Nam',
    nha_may: 'NMQM',
    created_at: '2024-01-15T08:00:00.000Z',
    updated_at: '2024-03-01T10:30:00.000Z',
  },
];

const SEED_SECONDARIES: SecondarySupplier[] = [
  // Under HTX Bến Hải (ncc-001) — shares sum to 100%
  {
    id: 'ncp-001', ten: 'Nguyễn Văn Tâm',  hinh_thuc: 'Cá nhân',
    cccd_mst: '049083004217', so_dien_thoai: '0905 111 001',
    co_phan_phan_tram: 18, lo_rung: 2, ngay_tham_gia: '2023-05-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-001',
  },
  {
    id: 'ncp-002', ten: 'Trần Văn Mạnh',   hinh_thuc: 'Cá nhân',
    cccd_mst: '049084001033', so_dien_thoai: '0905 111 002',
    co_phan_phan_tram: 24, lo_rung: 3, ngay_tham_gia: '2023-05-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-001',
  },
  {
    id: 'ncp-003', ten: 'Lê Thị Hoa',      hinh_thuc: 'Cá nhân',
    cccd_mst: '049088012490', so_dien_thoai: '0905 111 003',
    co_phan_phan_tram: 12, lo_rung: 1, ngay_tham_gia: '2023-07-10T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-001',
  },
  {
    id: 'ncp-004', ten: 'Phạm Quốc Đạt',   hinh_thuc: 'Cá nhân',
    cccd_mst: '049082007751', so_dien_thoai: '0905 111 004',
    co_phan_phan_tram: 31, lo_rung: 4, ngay_tham_gia: '2023-04-17T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-001',
  },
  {
    id: 'ncp-005', ten: 'Hoàng Văn Bình',  hinh_thuc: 'Cá nhân',
    cccd_mst: '049089004288', so_dien_thoai: '0905 111 005',
    co_phan_phan_tram: 15, lo_rung: 2, ngay_tham_gia: '2024-01-08T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-001',
  },
  // Under TNHH Tây Nguyên (ncc-002)
  {
    id: 'ncp-006', ten: 'Lê Văn Trường',    hinh_thuc: 'Cá nhân',
    cccd_mst: '059087005321', so_dien_thoai: '0916 234 567',
    co_phan_phan_tram: 40, lo_rung: 5, ngay_tham_gia: '2023-02-20T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-002',
  },
  {
    id: 'ncp-007', ten: 'Nguyễn Thị Hương', hinh_thuc: 'Cá nhân',
    cccd_mst: '059089003210', so_dien_thoai: '0916 234 568',
    co_phan_phan_tram: 35, lo_rung: 4, ngay_tham_gia: '2023-02-20T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-002',
  },
  {
    id: 'ncp-008', ten: 'Trần Quang Hải',   hinh_thuc: 'Cá nhân',
    cccd_mst: '059086001120', so_dien_thoai: '0916 234 569',
    co_phan_phan_tram: 25, lo_rung: 3, ngay_tham_gia: '2023-06-15T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-002',
  },
  {
    id: 'ncp-009', ten: 'Võ Thị Mai',       hinh_thuc: 'Cá nhân',
    cccd_mst: '059088007431', so_dien_thoai: '0916 234 570',
    co_phan_phan_tram: 0, lo_rung: 2, ngay_tham_gia: '2024-03-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-002',
  },
  // Under HTX Cẩm Lệ (ncc-003)
  {
    id: 'ncp-010', ten: 'Đặng Văn Phúc',    hinh_thuc: 'Cá nhân',
    cccd_mst: '048085009812', so_dien_thoai: '0977 345 678',
    co_phan_phan_tram: 33, lo_rung: 3, ngay_tham_gia: '2023-09-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-003',
  },
  {
    id: 'ncp-011', ten: 'Phan Thị Lan',     hinh_thuc: 'Cá nhân',
    cccd_mst: '048087002311', so_dien_thoai: '0977 345 679',
    co_phan_phan_tram: 42, lo_rung: 4, ngay_tham_gia: '2023-09-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-003',
  },
  {
    id: 'ncp-012', ten: 'Lý Văn Sơn',       hinh_thuc: 'Cá nhân',
    cccd_mst: '048083011430', so_dien_thoai: '0977 345 680',
    co_phan_phan_tram: 25, lo_rung: 2, ngay_tham_gia: '2024-02-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-003',
  },
  // Under HTX Đại Lộc (ncc-004)
  {
    id: 'ncp-013', ten: 'Nguyễn Thanh Bình', hinh_thuc: 'Cá nhân',
    cccd_mst: '049081004219', so_dien_thoai: '0908 456 001',
    co_phan_phan_tram: 28, lo_rung: 3, ngay_tham_gia: '2022-06-10T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-004',
  },
  {
    id: 'ncp-014', ten: 'Trần Thị Kim',     hinh_thuc: 'Cá nhân',
    cccd_mst: '049085008320', so_dien_thoai: '0908 456 002',
    co_phan_phan_tram: 35, lo_rung: 4, ngay_tham_gia: '2022-06-10T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-004',
  },
  {
    id: 'ncp-015', ten: 'Hồ Văn Dũng',      hinh_thuc: 'Cá nhân',
    cccd_mst: '049086001430', so_dien_thoai: '0908 456 003',
    co_phan_phan_tram: 20, lo_rung: 2, ngay_tham_gia: '2023-01-15T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-004',
  },
  {
    id: 'ncp-016', ten: 'Lê Quang Vinh',    hinh_thuc: 'Cá nhân',
    cccd_mst: '049087009011', so_dien_thoai: '0908 456 004',
    co_phan_phan_tram: 17, lo_rung: 1, ngay_tham_gia: '2023-08-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-004',
  },
  // Under CP Phước Sơn (ncc-005)
  {
    id: 'ncp-017', ten: 'Võ Đình Tuấn',     hinh_thuc: 'Cá nhân',
    cccd_mst: '048083011433', so_dien_thoai: '0918 456 789',
    co_phan_phan_tram: 50, lo_rung: 6, ngay_tham_gia: '2022-08-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-005',
  },
  {
    id: 'ncp-018', ten: 'Đinh Thị Xuân',    hinh_thuc: 'Cá nhân',
    cccd_mst: '048086005211', so_dien_thoai: '0918 456 790',
    co_phan_phan_tram: 30, lo_rung: 3, ngay_tham_gia: '2022-08-01T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-005',
  },
  {
    id: 'ncp-019', ten: 'Bùi Văn Hải',      hinh_thuc: 'Cá nhân',
    cccd_mst: '048089002910', so_dien_thoai: '0918 456 791',
    co_phan_phan_tram: 20, lo_rung: 2, ngay_tham_gia: '2023-05-10T00:00:00.000Z',
    nha_cung_cap_chinh_id: 'ncc-005',
  },
  // Under TNHH Tiến Phát (ncc-006) — new supplier, no secondaries yet
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
    const updated: Supplier = { ...existing, ...patch, id, updated_at: new Date().toISOString() };
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
