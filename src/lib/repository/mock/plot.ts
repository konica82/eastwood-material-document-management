/**
 * Mock plot registry repository.
 *
 * Forest plots across all three plants — each with owners, polygon boundary
 * coordinates, and supporting documents. These represent the EUDR traceability layer.
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

function isoDate(str: string): string {
  return new Date(str).toISOString();
}

function iso(daysAgo: number, hour = 8): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Seed: Owners ────────────────────────────────────────────────────────────

const OWNERS: PlotOwner[] = [
  // PLT-001
  { id: 'own-001', plot_id: 'PLT-001', owner_id: '', ten: 'Nguyễn Văn Tâm',  cccd: '049083004217', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 60,  hieu_luc_tu: null },
  { id: 'own-002', plot_id: 'PLT-001', owner_id: '', ten: 'Nguyễn Thị Mai',  cccd: '049090006531', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 40,  hieu_luc_tu: null },
  // PLT-002
  { id: 'own-003', plot_id: 'PLT-002', owner_id: '', ten: 'Trần Văn Mạnh',   cccd: '049084001033', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 100, hieu_luc_tu: null },
  // PLT-003
  { id: 'own-004', plot_id: 'PLT-003', owner_id: '', ten: 'Lê Thị Hoa',      cccd: '049088012490', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 50,  hieu_luc_tu: null },
  { id: 'own-005', plot_id: 'PLT-003', owner_id: '', ten: 'Lê Văn Nam',       cccd: '049085018744', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 50,  hieu_luc_tu: null },
  // PLT-004
  { id: 'own-006', plot_id: 'PLT-004', owner_id: '', ten: 'Phạm Quốc Đạt',   cccd: '049082007751', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 100, hieu_luc_tu: null },
  // PLT-005
  { id: 'own-007', plot_id: 'PLT-005', owner_id: '', ten: 'Hoàng Văn Bình',  cccd: '049089004288', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 70,  hieu_luc_tu: null },
  { id: 'own-008', plot_id: 'PLT-005', owner_id: '', ten: 'Hoàng Thị Linh',  cccd: '049091009923', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 30,  hieu_luc_tu: null },
  // PLT-006
  { id: 'own-009', plot_id: 'PLT-006', owner_id: '', ten: 'Lê Văn Trường',   cccd: '059087005321', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 80,  hieu_luc_tu: null },
  { id: 'own-010', plot_id: 'PLT-006', owner_id: '', ten: 'Lê Thị Phương',   cccd: '059092011042', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 20,  hieu_luc_tu: null },
  // PLT-007
  { id: 'own-011', plot_id: 'PLT-007', owner_id: '', ten: 'Võ Thanh Hùng',   cccd: '046087003712', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 100, hieu_luc_tu: null },
  // PLT-008
  { id: 'own-012', plot_id: 'PLT-008', owner_id: '', ten: 'Đặng Văn Lộc',    cccd: '046083009401', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 55,  hieu_luc_tu: null },
  { id: 'own-013', plot_id: 'PLT-008', owner_id: '', ten: 'Đặng Thị Lan',    cccd: '046089017833', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 45,  hieu_luc_tu: null },
  // PLT-009
  { id: 'own-014', plot_id: 'PLT-009', owner_id: '', ten: 'Bùi Quang Huy',   cccd: '038086002198', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 100, hieu_luc_tu: null },
  // PLT-010
  { id: 'own-015', plot_id: 'PLT-010', owner_id: '', ten: 'Ngô Đức Trí',     cccd: '038090007624', so_dien_thoai: null, vai_tro: 'Chủ rừng', ty_le: 60,  hieu_luc_tu: null },
  { id: 'own-016', plot_id: 'PLT-010', owner_id: '', ten: 'Ngô Thị Thu',     cccd: '038093014400', so_dien_thoai: null, vai_tro: 'Chủ gỗ',   ty_le: 40,  hieu_luc_tu: null },
];

// ─── Seed: Polygon coordinates ────────────────────────────────────────────────

function makeRect(plotId: string, lat: number, lng: number, dLat = 0.008, dLng = 0.012): PolygonCoordinate[] {
  return [
    { id: `poly-${plotId}-1`, plot_id: plotId, lat,        lng,        thu_tu: 1 },
    { id: `poly-${plotId}-2`, plot_id: plotId, lat: lat + dLat, lng,   thu_tu: 2 },
    { id: `poly-${plotId}-3`, plot_id: plotId, lat: lat + dLat, lng: lng + dLng, thu_tu: 3 },
    { id: `poly-${plotId}-4`, plot_id: plotId, lat,        lng: lng + dLng, thu_tu: 4 },
    { id: `poly-${plotId}-5`, plot_id: plotId, lat: lat - dLat * 0.3, lng: lng + dLng * 0.5, thu_tu: 5 },
  ];
}

const POLYGONS: PolygonCoordinate[] = [
  ...makeRect('PLT-001', 16.7812, 106.9124, 0.010, 0.014),
  ...makeRect('PLT-002', 16.6534, 107.0811, 0.007, 0.011),
  ...makeRect('PLT-003', 16.5221, 107.1338, 0.014, 0.016),
  ...makeRect('PLT-004', 15.9876, 108.1432, 0.006, 0.010),
  ...makeRect('PLT-005', 16.8234, 106.7891, 0.011, 0.013),
  ...makeRect('PLT-006', 13.9812, 108.0023, 0.018, 0.022),
  ...makeRect('PLT-007', 16.9123, 107.0234, 0.008, 0.011),
  ...makeRect('PLT-008', 16.7234, 107.1012, 0.006, 0.009),
  ...makeRect('PLT-009', 20.1234, 105.4512, 0.009, 0.013),
  ...makeRect('PLT-010', 20.0678, 105.5234, 0.007, 0.010),
];

// ─── Seed: Documents ──────────────────────────────────────────────────────────

const DOCUMENTS: PlotDocument[] = [
  { id: 'doc-001', plot_id: 'PLT-001', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-001', uploaded_at: iso(30), uploaded_by: 'usr-manager-1' },
  { id: 'doc-002', plot_id: 'PLT-001', ten_tai_lieu: 'Bản đồ địa chính lô rừng',           loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-002', uploaded_at: iso(28), uploaded_by: 'usr-manager-1' },
  { id: 'doc-003', plot_id: 'PLT-001', ten_tai_lieu: 'Xác nhận của UBND xã',               loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-003', uploaded_at: iso(25), uploaded_by: 'usr-manager-1' },
  { id: 'doc-004', plot_id: 'PLT-001', ten_tai_lieu: 'Chứng nhận FSC-CoC',                 loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-004', uploaded_at: iso(10), uploaded_by: 'usr-manager-1' },
  { id: 'doc-005', plot_id: 'PLT-001', ten_tai_lieu: 'Ảnh hiện trạng lô',                  loai: 'ZIP', drive_url: 'https://drive.google.com/file/mock-005', uploaded_at: iso(7),  uploaded_by: 'usr-ops-1' },
  { id: 'doc-006', plot_id: 'PLT-002', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-006', uploaded_at: iso(45), uploaded_by: 'usr-manager-1' },
  { id: 'doc-007', plot_id: 'PLT-002', ten_tai_lieu: 'Hợp đồng giao khoán',                loai: 'DOCX',drive_url: 'https://drive.google.com/file/mock-007', uploaded_at: iso(40), uploaded_by: 'usr-manager-1' },
  { id: 'doc-008', plot_id: 'PLT-003', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-008', uploaded_at: iso(60), uploaded_by: 'usr-manager-1' },
  { id: 'doc-009', plot_id: 'PLT-003', ten_tai_lieu: 'Chứng nhận PEFC',                    loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-009', uploaded_at: iso(15), uploaded_by: 'usr-manager-1' },
  { id: 'doc-010', plot_id: 'PLT-003', ten_tai_lieu: 'Bản đồ địa chính',                   loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-010', uploaded_at: iso(55), uploaded_by: 'usr-manager-1' },
  { id: 'doc-011', plot_id: 'PLT-004', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-011', uploaded_at: iso(90), uploaded_by: 'usr-manager-1' },
  { id: 'doc-012', plot_id: 'PLT-005', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-012', uploaded_at: iso(50), uploaded_by: 'usr-manager-1' },
  { id: 'doc-013', plot_id: 'PLT-005', ten_tai_lieu: 'Chứng nhận FSC-CoC',                 loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-013', uploaded_at: iso(20), uploaded_by: 'usr-manager-1' },
  { id: 'doc-014', plot_id: 'PLT-006', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-014', uploaded_at: iso(180), uploaded_by: 'usr-manager-1' },
  { id: 'doc-015', plot_id: 'PLT-006', ten_tai_lieu: 'Yêu cầu xác minh EUDR',              loai: 'DOCX',drive_url: 'https://drive.google.com/file/mock-015', uploaded_at: iso(5),  uploaded_by: 'usr-manager-1' },
  { id: 'doc-016', plot_id: 'PLT-007', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-016', uploaded_at: iso(35), uploaded_by: 'usr-manager-2' },
  { id: 'doc-017', plot_id: 'PLT-008', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-017', uploaded_at: iso(70), uploaded_by: 'usr-manager-2' },
  { id: 'doc-018', plot_id: 'PLT-009', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-018', uploaded_at: iso(42), uploaded_by: 'usr-manager-3' },
  { id: 'doc-019', plot_id: 'PLT-010', ten_tai_lieu: 'Giấy chứng nhận quyền sử dụng đất', loai: 'PDF', drive_url: 'https://drive.google.com/file/mock-019', uploaded_at: iso(88), uploaded_by: 'usr-manager-3' },
];

// ─── Seed: Plots ──────────────────────────────────────────────────────────────

interface PlotSeed {
  PlotID: string;
  nha_may: string;
  LandTitle: string;
  AreaHa: number;
  TreeSpecies: string;
  DeforestationRiskStatus: DeforestationRiskStatus;
  ActualQuantityDelivered: number;
  lat: number;
  lng: number;
  commune: string;
  district: string;
  province: string;
  planted_at: string;
  harvest_plan: string;
  rotation_years: number;
  density_per_ha: number;
  prev_harvests: number;
  elevation_m: number;
  slope_deg: number;
  soil_type: string;
  certificate: string | null;
  cert_id: string | null;
  image: string | null;
  createdDaysAgo: number;
}

const SEED_PLOTS: PlotSeed[] = [
  // ── NMQM plots ──────────────────────────────────────────────────────────────
  {
    PlotID: 'PLT-001', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-QT-2018-0041',
    AreaHa: 12.5, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 84.2, image: null,
    lat: 16.7851, lng: 106.9184,
    commune: 'Xã Vĩnh Thủy', district: 'Vĩnh Linh', province: 'Quảng Trị',
    planted_at: isoDate('2017-03-08'), harvest_plan: isoDate('2024-09-15'),
    rotation_years: 7, density_per_ha: 1660, prev_harvests: 1,
    elevation_m: 82, slope_deg: 12, soil_type: 'Feralit đỏ vàng',
    certificate: 'FSC-CoC', cert_id: 'FSC-VN-0142', createdDaysAgo: 400,
  },
  {
    PlotID: 'PLT-002', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-QT-2019-0188',
    AreaHa: 8.3, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 41.7, image: null,
    lat: 16.6573, lng: 107.0878,
    commune: 'Xã A Lưới', district: 'A Lưới', province: 'Thừa Thiên Huế',
    planted_at: isoDate('2018-11-22'), harvest_plan: isoDate('2025-05-30'),
    rotation_years: 7, density_per_ha: 1800, prev_harvests: 0,
    elevation_m: 312, slope_deg: 22, soil_type: 'Đất đỏ bazan',
    certificate: 'Không', cert_id: null, createdDaysAgo: 320,
  },
  {
    PlotID: 'PLT-003', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-TT-2020-0027',
    AreaHa: 21.0, TreeSpecies: 'Bạch đàn',
    DeforestationRiskStatus: 'Trung bình', ActualQuantityDelivered: 152.5, image: null,
    lat: 16.5255, lng: 107.1384,
    commune: 'Xã Phước Đức', district: 'Phước Sơn', province: 'Quảng Nam',
    planted_at: isoDate('2016-07-12'), harvest_plan: isoDate('2024-07-28'),
    rotation_years: 8, density_per_ha: 1500, prev_harvests: 2,
    elevation_m: 540, slope_deg: 28, soil_type: 'Feralit nâu đỏ',
    certificate: 'PEFC', cert_id: 'PEFC-VN-0817', createdDaysAgo: 280,
  },
  {
    PlotID: 'PLT-004', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-QN-2017-0334',
    AreaHa: 6.8, TreeSpecies: 'Keo tai tượng',
    DeforestationRiskStatus: 'Cao', ActualQuantityDelivered: 0, image: null,
    lat: 15.9876, lng: 108.1432,
    commune: 'Xã Hòa Châu', district: 'Hòa Vang', province: 'Đà Nẵng',
    planted_at: isoDate('2019-01-15'), harvest_plan: isoDate('2026-02-10'),
    rotation_years: 7, density_per_ha: 1700, prev_harvests: 0,
    elevation_m: 28, slope_deg: 6, soil_type: 'Đất phù sa',
    certificate: 'Chờ cấp', cert_id: null, createdDaysAgo: 500,
  },
  {
    PlotID: 'PLT-005', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-QT-2021-0099',
    AreaHa: 15.2, TreeSpecies: 'Tràm nước',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 73.3, image: null,
    lat: 16.8234, lng: 106.7891,
    commune: 'Xã Đại Hồng', district: 'Đại Lộc', province: 'Quảng Nam',
    planted_at: isoDate('2015-04-30'), harvest_plan: isoDate('2024-04-12'),
    rotation_years: 9, density_per_ha: 2200, prev_harvests: 2,
    elevation_m: 64, slope_deg: 9, soil_type: 'Feralit vàng',
    certificate: 'FSC-CoC', cert_id: 'FSC-VN-0309', createdDaysAgo: 200,
  },
  {
    PlotID: 'PLT-006', nha_may: 'NMQM',
    LandTitle: 'GCNQSDĐ-GL-2016-0012',
    AreaHa: 33.7, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Cao', ActualQuantityDelivered: 0, image: null,
    lat: 13.9812, lng: 108.0023,
    commune: 'Xã Ia Kha', district: 'Ia Grai', province: 'Gia Lai',
    planted_at: isoDate('2017-09-04'), harvest_plan: isoDate('2025-10-05'),
    rotation_years: 8, density_per_ha: 1620, prev_harvests: 1,
    elevation_m: 720, slope_deg: 18, soil_type: 'Đất đỏ bazan',
    certificate: 'Không', cert_id: null, createdDaysAgo: 600,
  },

  // ── NMXH plots ──────────────────────────────────────────────────────────────
  {
    PlotID: 'PLT-007', nha_may: 'NMXH',
    LandTitle: 'GCNQSDĐ-QT-2020-0215',
    AreaHa: 5.2, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 22.8, image: null,
    lat: 16.9123, lng: 107.0234,
    commune: 'Xã Gio Phong', district: 'Gio Linh', province: 'Quảng Trị',
    planted_at: isoDate('2018-06-14'), harvest_plan: isoDate('2025-06-30'),
    rotation_years: 7, density_per_ha: 1720, prev_harvests: 0,
    elevation_m: 110, slope_deg: 14, soil_type: 'Feralit đỏ vàng',
    certificate: 'FSC-CoC', cert_id: 'FSC-VN-0388', createdDaysAgo: 250,
  },
  {
    PlotID: 'PLT-008', nha_may: 'NMXH',
    LandTitle: 'GCNQSDĐ-QT-2022-0071',
    AreaHa: 3.8, TreeSpecies: 'Keo tai tượng',
    DeforestationRiskStatus: 'Trung bình', ActualQuantityDelivered: 8.4, image: null,
    lat: 16.7234, lng: 107.1012,
    commune: 'Xã Cam Hiếu', district: 'Cam Lộ', province: 'Quảng Trị',
    planted_at: isoDate('2020-09-22'), harvest_plan: isoDate('2027-09-22'),
    rotation_years: 7, density_per_ha: 1650, prev_harvests: 0,
    elevation_m: 185, slope_deg: 19, soil_type: 'Đất đỏ bazan',
    certificate: 'Không', cert_id: null, createdDaysAgo: 150,
  },

  // ── NMCT plots ──────────────────────────────────────────────────────────────
  {
    PlotID: 'PLT-009', nha_may: 'NMCT',
    LandTitle: 'GCNQSDĐ-TH-2019-0088',
    AreaHa: 7.4, TreeSpecies: 'Keo lai',
    DeforestationRiskStatus: 'Thấp', ActualQuantityDelivered: 31.6, image: null,
    lat: 20.1234, lng: 105.4512,
    commune: 'Xã Cẩm Thủy', district: 'Cẩm Thủy', province: 'Thanh Hóa',
    planted_at: isoDate('2017-04-20'), harvest_plan: isoDate('2024-04-20'),
    rotation_years: 7, density_per_ha: 1580, prev_harvests: 1,
    elevation_m: 240, slope_deg: 16, soil_type: 'Feralit đỏ vàng',
    certificate: 'PEFC', cert_id: 'PEFC-VN-0922', createdDaysAgo: 380,
  },
  {
    PlotID: 'PLT-010', nha_may: 'NMCT',
    LandTitle: 'GCNQSDĐ-TH-2023-0014',
    AreaHa: 4.1, TreeSpecies: 'Bạch đàn',
    DeforestationRiskStatus: 'Cao', ActualQuantityDelivered: 0, image: null,
    lat: 20.0678, lng: 105.5234,
    commune: 'Xã Cẩm Lương', district: 'Cẩm Thủy', province: 'Thanh Hóa',
    planted_at: isoDate('2021-11-10'), harvest_plan: isoDate('2029-11-10'),
    rotation_years: 8, density_per_ha: 1450, prev_harvests: 0,
    elevation_m: 310, slope_deg: 23, soil_type: 'Đất đỏ bazan',
    certificate: 'Không', cert_id: null, createdDaysAgo: 90,
  },
];

const SEED: PlotRegistry[] = SEED_PLOTS.map(p => ({
  PlotID:                  p.PlotID,
  LandTitle:               p.LandTitle,
  AreaHa:                  p.AreaHa,
  TreeSpecies:             p.TreeSpecies,
  DeforestationRiskStatus: p.DeforestationRiskStatus,
  ActualQuantityDelivered: p.ActualQuantityDelivered,
  nha_may:                 p.nha_may,
  lat:                     p.lat,
  lng:                     p.lng,
  commune:                 p.commune,
  district:                p.district,
  province:                p.province,
  planted_at:              p.planted_at,
  harvest_plan:            p.harvest_plan,
  rotation_years:          p.rotation_years,
  density_per_ha:          p.density_per_ha,
  prev_harvests:           p.prev_harvests,
  elevation_m:             p.elevation_m,
  slope_deg:               p.slope_deg,
  soil_type:               p.soil_type,
  certificate:             p.certificate,
  cert_id:                 p.cert_id,
  image:                   p.image,
  created_at:              iso(p.createdDaysAgo),
  updated_at:              iso(Math.floor(p.createdDaysAgo / 4)),
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

  async getWithDetails(_plantId: string, plotId: string): Promise<PlotRegistry | null> {
    const base = store.get(plotId);
    if (!base) return null;
    return {
      ...base,
      owners:    OWNERS.filter(o => o.plot_id === plotId),
      polygon:   POLYGONS.filter(p => p.plot_id === plotId),
      documents: DOCUMENTS.filter(d => d.plot_id === plotId),
    };
  },
};
