/**
 * Mock cargo repository.
 *
 * Generates seed data covering all four statuses:
 *   Chờ lượt / Đang xử lý / Hoàn thành / Hủy lượt
 *
 * Joined objects (tai_xe, nguyen_lieu, nha_cung_cap, phieu_can) are
 * populated inline so list and detail views work without additional fetches.
 */

import type { Cargo, Driver, Material, Supplier, WeighingSlip, CargoStatus } from '@/types/index';
import type { CargoRepository, CreateCargoInput } from '../types';

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function isoAt(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ─── Joined entity stubs ──────────────────────────────────────────────────────

const DRIVERS: Record<string, Driver> = {
  'drv-01': {
    id: 'drv-01', ten: 'Nguyễn Văn An', cccd: '079123456789',
    so_dien_thoai: '0901234567', so_xe: '51A-123.45',
    nha_may: 'NMQM', completedDeliveries: 42,
    created_at: isoAt(90, 8), updated_at: isoAt(10, 8),
  },
  'drv-02': {
    id: 'drv-02', ten: 'Trần Thị Bình', cccd: '079234567890',
    so_dien_thoai: '0912345678', so_xe: '51B-234.56',
    nha_may: 'NMQM', completedDeliveries: 28,
    created_at: isoAt(80, 8), updated_at: isoAt(5, 8),
  },
  'drv-03': {
    id: 'drv-03', ten: 'Lê Văn Cường', cccd: '079345678901',
    so_dien_thoai: '0923456789', so_xe: '51C-345.67',
    nha_may: 'NMQM', completedDeliveries: 67,
    created_at: isoAt(120, 8), updated_at: isoAt(2, 8),
  },
  'drv-04': {
    id: 'drv-04', ten: 'Phạm Văn Dũng', cccd: '079456789012',
    so_dien_thoai: '0934567890', so_xe: '60A-456.78',
    nha_may: 'NMQM', completedDeliveries: 15,
    created_at: isoAt(60, 8), updated_at: isoAt(7, 8),
  },
  'drv-05': {
    id: 'drv-05', ten: 'Hoàng Thị Lan', cccd: '079567890123',
    so_dien_thoai: '0945678901', so_xe: '60B-567.89',
    nha_may: 'NMQM', completedDeliveries: 33,
    created_at: isoAt(100, 8), updated_at: isoAt(3, 8),
  },
  'drv-06': {
    id: 'drv-06', ten: 'Vũ Văn Minh', cccd: '079678901234',
    so_dien_thoai: '0956789012', so_xe: '51D-678.90',
    nha_may: 'NMQM', completedDeliveries: 51,
    created_at: isoAt(75, 8), updated_at: isoAt(1, 8),
  },
};

const MATERIALS: Record<string, Material> = {
  'mat-01': { id: 'mat-01', ten: 'Keo lai', ten_khoa_hoc: 'Acacia hybrid', image: null },
  'mat-02': { id: 'mat-02', ten: 'Cao su', ten_khoa_hoc: 'Hevea brasiliensis', image: null },
  'mat-03': { id: 'mat-03', ten: 'Điều', ten_khoa_hoc: 'Anacardium occidentale', image: null },
  'mat-04': { id: 'mat-04', ten: 'Tràm nước', ten_khoa_hoc: 'Melaleuca cajuputi', image: null },
  'mat-05': { id: 'mat-05', ten: 'Bạch đàn', ten_khoa_hoc: 'Eucalyptus urophylla', image: null },
};

const SUPPLIERS: Record<string, Supplier> = {
  'ncc-001': {
    id: 'ncc-001', ten: 'Công ty TNHH Lâm Nghiệp Phú Quý', hinh_thuc: 'Công ty', loai_hinh: 'TNHH',
    cccd_mst: '0301234567', so_dien_thoai: '0271234567', dia_chi: 'Thị trấn Quảng Minh, Bình Phước',
    nha_may: 'NMQM', created_at: isoAt(200, 8), updated_at: isoAt(30, 8),
  },
  'ncc-002': {
    id: 'ncc-002', ten: 'HTX Nông Lâm Sản Đông Phú', hinh_thuc: 'Công ty', loai_hinh: 'HTX',
    cccd_mst: '0302345678', so_dien_thoai: '0272345678', dia_chi: 'Xã Đông Phú, Bù Đăng, Bình Phước',
    nha_may: 'NMQM', created_at: isoAt(180, 8), updated_at: isoAt(15, 8),
  },
  'ncc-003': {
    id: 'ncc-003', ten: 'Công ty CP Gỗ Xanh Việt', hinh_thuc: 'Công ty', loai_hinh: 'CP',
    cccd_mst: '0303456789', so_dien_thoai: '0273456789', dia_chi: 'KCN Chơn Thành, Bình Phước',
    nha_may: 'NMQM', created_at: isoAt(160, 8), updated_at: isoAt(20, 8),
  },
};

// ─── Weighing slip factory ────────────────────────────────────────────────────

function makeSlip(id: string, cargoId: string, inTime: string, outTime: string | null, inKg: number, outKg: number | null): WeighingSlip {
  const net = outKg != null && inKg != null ? inKg - outKg : null;
  return {
    id,
    xe_hang_id: cargoId,
    so_phieu_can: id.replace('slip-', 'PC'),
    nha_may: 'NMQM',
    dlc_ngay_can_vao: inTime,
    dlc_can_vao: inKg,
    dlc_ngay_can_ra: outTime,
    dlc_can_ra: outKg,
    dlc_trong_luong_hang: net,
    can_thu: 'Nguyễn Thị Hoa',
    hinh_anh_phieu_can: null,
    created_at: inTime,
    updated_at: outTime ?? inTime,
  };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function makeCargo(
  id: string,
  opts: {
    sttTai: number;
    status: CargoStatus;
    plate: string;
    driverId: string;
    materialId: string;
    supplierId: string;
    createdAt: string;
    slip?: WeighingSlip;
    lyDoHuy?: string;
    hoanThanhLuc?: string;
    ghi_chu?: string;
  }
): Cargo {
  const driver = DRIVERS[opts.driverId] ?? null;
  const material = MATERIALS[opts.materialId] ?? null;
  const supplier = SUPPLIERS[opts.supplierId] ?? null;

  const waitMs = opts.slip
    ? new Date(opts.slip.dlc_ngay_can_vao).getTime() - new Date(opts.createdAt).getTime()
    : null;

  const weighMs =
    opts.slip && opts.slip.dlc_ngay_can_ra
      ? new Date(opts.slip.dlc_ngay_can_ra).getTime() - new Date(opts.slip.dlc_ngay_can_vao).getTime()
      : null;

  return {
    id,
    nha_may: 'NMQM',
    so_xe: opts.plate,
    so_mooc: null,
    loai_xe: 'Xe tải',
    stt_tai: opts.sttTai,
    hinh_phieu_thong_tin: null,
    trang_thai: opts.status,
    hoan_thanh_luc: opts.hoanThanhLuc ?? null,
    ly_do_huy: opts.lyDoHuy ?? null,

    tai_xe_id: opts.driverId,
    tai_xe: driver,

    nguyen_lieu_id: opts.materialId,
    nguyen_lieu: material,
    loai_nguyen_lieu: null,

    nha_cung_cap_id: opts.supplierId,
    nha_cung_cap: supplier,
    nha_cung_cap_phu_id: null,
    nha_cung_cap_phu: null,
    chu_lam_san: null,

    dia_chi_nguyen_lieu: null,
    tinh: null,
    huyen: null,
    xa: null,
    ten_chu_rung: null,

    plot_id: null,
    plot: null,
    khoang_cach_nha_may: null,

    phieu_can_id: opts.slip?.id ?? null,
    phieu_can: opts.slip ?? null,
    so_phieu_can: opts.slip?.so_phieu_can ?? null,

    thoi_gian_cho: waitMs,
    tong_thoi_gian_can: weighMs,
    hsls_hoan_thanh: opts.status === 'Hoàn thành' ? true : false,

    ghi_chu: opts.ghi_chu ?? null,
    created_at: opts.createdAt,
    created_by: 'mock-user-1',
    updated_at: opts.slip?.updated_at ?? opts.createdAt,
    updated_by: 'mock-user-1',
  };
}

// Build seed list
function buildSeedData(): Cargo[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Helper: ISO string for today at a given time
  const t = (h: number, m = 0) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const cargos: Cargo[] = [];

  // ─── Chờ lượt (6 records, created today) ────────────────────────────────────
  cargos.push(makeCargo('cargo-001', {
    sttTai: 1, status: 'Chờ lượt', plate: '51A-123.45',
    driverId: 'drv-01', materialId: 'mat-01', supplierId: 'ncc-001',
    createdAt: t(6, 30),
  }));
  cargos.push(makeCargo('cargo-002', {
    sttTai: 2, status: 'Chờ lượt', plate: '51B-234.56',
    driverId: 'drv-02', materialId: 'mat-02', supplierId: 'ncc-002',
    createdAt: t(7, 0),
  }));
  cargos.push(makeCargo('cargo-003', {
    sttTai: 3, status: 'Chờ lượt', plate: '51C-345.67',
    driverId: 'drv-03', materialId: 'mat-01', supplierId: 'ncc-001',
    createdAt: t(7, 20),
  }));
  cargos.push(makeCargo('cargo-004', {
    sttTai: 4, status: 'Chờ lượt', plate: '60A-456.78',
    driverId: 'drv-04', materialId: 'mat-03', supplierId: 'ncc-003',
    createdAt: t(7, 45),
  }));
  cargos.push(makeCargo('cargo-005', {
    sttTai: 5, status: 'Chờ lượt', plate: '60B-567.89',
    driverId: 'drv-05', materialId: 'mat-05', supplierId: 'ncc-002',
    createdAt: t(8, 10),
  }));
  cargos.push(makeCargo('cargo-006', {
    sttTai: 6, status: 'Chờ lượt', plate: '51D-678.90',
    driverId: 'drv-06', materialId: 'mat-04', supplierId: 'ncc-001',
    createdAt: t(8, 30),
    ghi_chu: 'Lái xe phản ánh cân trước',
  }));

  // ─── Đang xử lý (4 records — weigh-in done, no weigh-out) ───────────────────
  cargos.push(makeCargo('cargo-007', {
    sttTai: 7, status: 'Đang xử lý', plate: '51A-111.22',
    driverId: 'drv-01', materialId: 'mat-01', supplierId: 'ncc-001',
    createdAt: t(5, 0),
    slip: makeSlip('slip-007', 'cargo-007', t(5, 48), null, 28_500, null),
  }));
  cargos.push(makeCargo('cargo-008', {
    sttTai: 8, status: 'Đang xử lý', plate: '51B-222.33',
    driverId: 'drv-02', materialId: 'mat-02', supplierId: 'ncc-002',
    createdAt: t(4, 30),
    slip: makeSlip('slip-008', 'cargo-008', t(5, 15), null, 32_000, null),
  }));
  cargos.push(makeCargo('cargo-009', {
    sttTai: 9, status: 'Đang xử lý', plate: '60A-333.44',
    driverId: 'drv-04', materialId: 'mat-03', supplierId: 'ncc-003',
    createdAt: t(5, 30),
    slip: makeSlip('slip-009', 'cargo-009', t(6, 5), null, 25_200, null),
  }));
  cargos.push(makeCargo('cargo-010', {
    sttTai: 10, status: 'Đang xử lý', plate: '51D-444.55',
    driverId: 'drv-06', materialId: 'mat-05', supplierId: 'ncc-001',
    createdAt: t(4, 0),
    slip: makeSlip('slip-010', 'cargo-010', t(4, 52), null, 19_800, null),
  }));

  // ─── Hoàn thành (10 records — various days, full weighing) ──────────────────
  interface CompletedSeed {
    cid: string; stt: number; daysAgo: number;
    driverIdx: number; matIdx: number;
    inHour: number; outHour: number;
    inKg: number; outKg: number;
  }
  const completedData: CompletedSeed[] = [
    { cid: 'cargo-011', stt: 11, daysAgo: 0, driverIdx: 0, matIdx: 0, inHour: 5, outHour: 8,  inKg: 30_000, outKg: 12_500 },
    { cid: 'cargo-012', stt: 12, daysAgo: 0, driverIdx: 1, matIdx: 1, inHour: 6, outHour: 9,  inKg: 27_500, outKg: 10_800 },
    { cid: 'cargo-013', stt: 13, daysAgo: 1, driverIdx: 2, matIdx: 2, inHour: 7, outHour: 10, inKg: 35_000, outKg: 14_200 },
    { cid: 'cargo-014', stt: 14, daysAgo: 1, driverIdx: 3, matIdx: 3, inHour: 8, outHour: 11, inKg: 22_000, outKg:  9_000 },
    { cid: 'cargo-015', stt: 15, daysAgo: 1, driverIdx: 4, matIdx: 4, inHour: 6, outHour: 7,  inKg: 40_000, outKg: 16_000 },
    { cid: 'cargo-016', stt: 16, daysAgo: 2, driverIdx: 5, matIdx: 0, inHour: 7, outHour: 9,  inKg: 18_500, outKg:  7_500 },
    { cid: 'cargo-017', stt: 17, daysAgo: 2, driverIdx: 0, matIdx: 1, inHour: 5, outHour: 8,  inKg: 29_000, outKg: 11_800 },
    { cid: 'cargo-018', stt: 18, daysAgo: 3, driverIdx: 1, matIdx: 2, inHour: 6, outHour: 10, inKg: 31_500, outKg: 13_000 },
    { cid: 'cargo-019', stt: 19, daysAgo: 3, driverIdx: 2, matIdx: 3, inHour: 7, outHour: 9,  inKg: 26_000, outKg: 10_500 },
    { cid: 'cargo-020', stt: 20, daysAgo: 4, driverIdx: 3, matIdx: 4, inHour: 5, outHour: 8,  inKg: 38_000, outKg: 15_200 },
  ];

  const driverIds = ['drv-01', 'drv-02', 'drv-03', 'drv-04', 'drv-05', 'drv-06'];
  const matIds = ['mat-01', 'mat-02', 'mat-03', 'mat-04', 'mat-05'];
  const supIds = ['ncc-001', 'ncc-002', 'ncc-003'];

  completedData.forEach((seed, i) => {
    const { cid, stt, daysAgo, driverIdx, matIdx, inHour, outHour, inKg, outKg } = seed;
    const createdTime = isoAt(daysAgo, inHour - 1);
    const weighInTime = isoAt(daysAgo, inHour);
    const weighOutTime = isoAt(daysAgo, outHour);
    const driverId = driverIds[driverIdx % driverIds.length];
    const materialId = matIds[matIdx % matIds.length];
    const supplierId = supIds[i % supIds.length];
    const slipId = `slip-${cid.replace('cargo-', '')}`;
    const slip = makeSlip(slipId, cid, weighInTime, weighOutTime, inKg, outKg);

    cargos.push(makeCargo(cid, {
      sttTai: stt,
      status: 'Hoàn thành',
      plate: `5${i % 2 === 0 ? '1' : '9'}${String.fromCharCode(65 + (i % 6))}-${String(100 + i * 37).padStart(3, '0')}.${String(10 + i * 11).padStart(2, '0')}`,
      driverId,
      materialId,
      supplierId,
      createdAt: createdTime,
      slip,
      hoanThanhLuc: weighOutTime,
    }));
  });

  // ─── Hủy lượt (4 records) ───────────────────────────────────────────────────
  const cancelReasons = [
    'Lái xe không đủ giấy tờ',
    'Xe hỏng máy trên đường vào cổng',
    'Nguyên liệu không đạt chất lượng kiểm tra sơ bộ',
    'Nhà máy đủ tải trong ngày',
  ];
  ['cargo-021', 'cargo-022', 'cargo-023', 'cargo-024'].forEach((cid, i) => {
    cargos.push(makeCargo(cid, {
      sttTai: 21 + i,
      status: 'Hủy lượt',
      plate: `51F-${String(700 + i * 30).padStart(3, '0')}.${String(50 + i * 13).padStart(2, '0')}`,
      driverId: driverIds[i % driverIds.length],
      materialId: matIds[i % matIds.length],
      supplierId: supIds[i % supIds.length],
      createdAt: isoAt(i, 9 + i),
      lyDoHuy: cancelReasons[i],
    }));
  });

  return cargos;
}

// Module-level store — mutated by updateStatus / completeDossier
const store: Map<string, Cargo> = new Map(
  buildSeedData().map(c => [c.id, c])
);

// ─── Repository implementation ────────────────────────────────────────────────

let nextId = 100;

export const mockCargoRepository: CargoRepository = {
  async list(plantId: string): Promise<Cargo[]> {
    return [...store.values()].filter(c => c.nha_may === plantId);
  },

  async get(plantId: string, id: string): Promise<Cargo | null> {
    const c = store.get(id);
    if (!c || c.nha_may !== plantId) return null;
    return c;
  },

  async create(plantId: string, input: CreateCargoInput): Promise<Cargo> {
    const id = `cargo-${String(nextId++).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newCargo: Cargo = {
      ...input,
      id,
      nha_may: plantId,
      stt_tai: store.size + 1,
      thoi_gian_cho: null,
      tong_thoi_gian_can: null,
      hoan_thanh_luc: null,
      so_phieu_can: null,
      tai_xe: null,
      nguyen_lieu: null,
      nha_cung_cap: null,
      nha_cung_cap_phu: null,
      khoang_cach_nha_may: null,
      plot: null,
      phieu_can: null,
      created_at: now,
      created_by: 'mock-user-1',
      updated_at: now,
      updated_by: 'mock-user-1',
    };
    store.set(id, newCargo);
    return newCargo;
  },

  async update(plantId: string, id: string, patch: Partial<Cargo>): Promise<Cargo> {
    const existing = store.get(id);
    if (!existing || existing.nha_may !== plantId) {
      throw new Error(`Cargo ${id} not found`);
    }
    const updated: Cargo = { ...existing, ...patch, updated_at: new Date().toISOString(), updated_by: 'mock-user-1' };
    store.set(id, updated);
    return updated;
  },

  async updateStatus(plantId: string, cargoId: string, status: CargoStatus, ly_do_huy?: string): Promise<Cargo> {
    const existing = store.get(cargoId);
    if (!existing || existing.nha_may !== plantId) {
      throw new Error(`Cargo ${cargoId} not found`);
    }
    const now = new Date().toISOString();
    const updated: Cargo = {
      ...existing,
      trang_thai: status,
      ly_do_huy: status === 'Hủy lượt' ? (ly_do_huy ?? null) : existing.ly_do_huy,
      hoan_thanh_luc: status === 'Hoàn thành' ? now : existing.hoan_thanh_luc,
      updated_at: now,
      updated_by: 'mock-user-1',
    };
    store.set(cargoId, updated);
    return updated;
  },

  async completeDossier(plantId: string, cargoId: string): Promise<Cargo> {
    const existing = store.get(cargoId);
    if (!existing || existing.nha_may !== plantId) {
      throw new Error(`Cargo ${cargoId} not found`);
    }
    const updated: Cargo = {
      ...existing,
      hsls_hoan_thanh: true,
      updated_at: new Date().toISOString(),
      updated_by: 'mock-user-1',
    };
    store.set(cargoId, updated);
    return updated;
  },
};
