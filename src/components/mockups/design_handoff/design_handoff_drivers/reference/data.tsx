// Mock data + Vietnamese strings

const PLANTS = [
  { id: 'NMXH', name: 'Nhà máy Xuân Hòa', role: 'Quản lý' },
  { id: 'NMQM', name: 'Nhà máy Quy Mỹ', role: 'Vận hành cân' },
  { id: 'NMCT', name: 'Nhà máy Cẩm Thượng', role: 'Kiểm soát chất lượng' },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'cargo', label: 'Xe hàng', icon: 'truck' },
  { id: 'weighing', label: 'Phiếu cân', icon: 'scale' },
  { id: 'plots', label: 'Hồ sơ rừng', icon: 'map' },
  { id: 'suppliers', label: 'Nhà cung cấp', icon: 'building-2' },
  { id: 'materials', label: 'Nguyên liệu', icon: 'package' },
  { id: 'drivers', label: 'Tài xế', icon: 'user-round' },
  { id: 'reports', label: 'Báo cáo', icon: 'file-bar-chart' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings', gated: true },
];

const STATUS = {
  waiting:    { id: 'waiting',    label: 'Chờ lượt',    tone: 'warning' },
  inProgress: { id: 'inProgress', label: 'Đang xử lý',  tone: 'info' },
  completed:  { id: 'completed',  label: 'Hoàn thành',  tone: 'success' },
  cancelled:  { id: 'cancelled',  label: 'Hủy lượt',    tone: 'danger' },
};

const MATERIALS = ['Keo lai', 'Cao su', 'Điều', 'Tràm nước', 'Bạch đàn', 'Mùn cưa', 'Dăm gỗ keo'];
const SUPPLIERS_BRIEF = [
  'Hợp tác xã Lâm nghiệp Bến Hải',
  'Công ty TNHH Lâm sản Tây Nguyên',
  'HTX Trồng rừng Cẩm Lệ',
  'Cá nhân — Nguyễn Văn Hùng',
  'Công ty CP Nguyên liệu Phước Sơn',
  'HTX Lâm nghiệp Đại Lộc',
];
const DRIVERS = [
  'Nguyễn Văn Tâm', 'Trần Quốc Bảo', 'Lê Hoàng Phúc', 'Phạm Đình Sơn',
  'Hoàng Minh Đức', 'Võ Thanh Hùng', 'Đặng Văn Lộc', 'Bùi Quang Huy',
  'Ngô Đức Trí', 'Phan Văn Nam', 'Đỗ Hữu Thắng', 'Cao Bá Quát',
];
const PLATES = [
  '43C-219.84','75H-002.41','92A-117.65','51F-806.22','38C-441.07',
  '47B-359.18','29H-712.04','82D-100.95','61C-228.50','77A-944.66',
  '14B-503.71','30E-617.32',
];

function pad(n) { return String(n).padStart(2, '0'); }
function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000);
}
function fmtTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtDateTime(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtDate(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}

// Generate cargo rows
function makeCargo() {
  const statuses = ['waiting','waiting','inProgress','inProgress','inProgress','completed','completed','completed','completed','cancelled'];
  const rows = [];
  for (let i = 0; i < 28; i++) {
    const s = statuses[i % statuses.length];
    const created = hoursAgo(i * 0.6 + Math.random() * 0.4);
    rows.push({
      id: `XH-${20260000 + 528 + i}`,
      plate: PLATES[i % PLATES.length],
      driver: DRIVERS[i % DRIVERS.length],
      driverId: `0${36000000 + i * 13}`.slice(0, 12),
      material: MATERIALS[i % MATERIALS.length],
      supplier: SUPPLIERS_BRIEF[i % SUPPLIERS_BRIEF.length],
      secondarySuppliers: i % 3 === 0 ? 2 : i % 4 === 0 ? 1 : 0,
      status: s,
      createdAt: created,
      weighIn: s !== 'waiting' ? new Date(created.getTime() + 15 * 60000) : null,
      weighOut: (s === 'completed') ? new Date(created.getTime() + 95 * 60000) : null,
      grossKg: s !== 'waiting' ? 24000 + (i * 137) % 9800 : null,
      tareKg: s === 'completed' ? 9800 + (i * 53) % 1200 : null,
      plot: `KH-${2024}-${pad((i % 47) + 3)}`,
    });
  }
  return rows;
}

const CARGO = makeCargo();

const DASH_STATS = {
  waiting: CARGO.filter(c => c.status === 'waiting').length,
  inProgress: CARGO.filter(c => c.status === 'inProgress').length,
  completed: CARGO.filter(c => c.status === 'completed').length,
  cancelled: CARGO.filter(c => c.status === 'cancelled').length,
};

// 30-day trend (cargo completed per day)
const TREND = (() => {
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const base = 28 + Math.sin(i / 4) * 8;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 3.5;
    out.push({ day: i, value: Math.max(8, Math.round(base + noise)) });
  }
  return out;
})();

// Per-material accumulation (30 days)
// Total ≈ 1.697 tấn for the plant
const MATERIAL_PALETTE = {
  'Keo lai':     'var(--accent)',
  'Cao su':      '#059669',
  'Điều':        '#D97706',
  'Tràm nước':   '#0891B2',
  'Bạch đàn':    '#7C3AED',
  'Mùn cưa':     '#BE185D',
  'Dăm gỗ keo':  '#475569',
};

function makeSpark(seed, days = 14) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const v = (Math.sin(i * 0.6 + seed * 1.7) + 1) / 2 * 0.7
            + (Math.cos(i * 1.2 + seed * 2.3) + 1) / 2 * 0.3;
    out.push(Math.max(0.05, v));
  }
  return out;
}

const MATERIAL_STATS_BASE = [
  { name: 'Keo lai',     kg30: 624500, count30: 86, delta: +12 },
  { name: 'Cao su',      kg30: 412300, count30: 41, delta:  +6 },
  { name: 'Điều',        kg30: 198400, count30: 28, delta:  -3 },
  { name: 'Tràm nước',   kg30: 167200, count30: 23, delta:  +9 },
  { name: 'Bạch đàn',    kg30: 124800, count30: 19, delta:  +2 },
  { name: 'Mùn cưa',     kg30:  96400, count30: 14, delta: +14 },
  { name: 'Dăm gỗ keo',  kg30:  73200, count30: 11, delta:  -1 },
].map((m, i) => ({
  ...m,
  color: MATERIAL_PALETTE[m.name],
  spark: makeSpark(i + 1),
}));

const MATERIAL_STATS = {
  '7d':  MATERIAL_STATS_BASE.map(m => ({ ...m, kg: Math.round(m.kg30 * 0.24), count: Math.round(m.count30 * 0.25) })),
  '30d': MATERIAL_STATS_BASE.map(m => ({ ...m, kg: m.kg30, count: m.count30 })),
  '90d': MATERIAL_STATS_BASE.map(m => ({ ...m, kg: Math.round(m.kg30 * 2.85), count: Math.round(m.count30 * 2.92) })),
};

// 14-day daily intake split by material (for stacked chart)
const DAILY_INTAKE_14D = (() => {
  const out = [];
  for (let d = 13; d >= 0; d--) {
    const dayFactor = 0.70 + (Math.sin(d * 0.5) + 1) / 2 * 0.55;
    const date = new Date(Date.now() - d * 86400000);
    // weekends lighter
    const dow = date.getDay();
    const weekend = (dow === 0 || dow === 6) ? 0.55 : 1;
    const day = { day: d, date };
    MATERIAL_STATS_BASE.forEach((m, i) => {
      const base = m.kg30 / 30;
      const wobble = 0.6 + ((Math.sin(d * 1.1 + i * 2.3) + 1) / 2) * 0.8;
      day[m.name] = Math.round(base * dayFactor * weekend * wobble);
    });
    out.push(day);
  }
  return out;
})();

// Top suppliers (this month)
const TOP_SUPPLIERS = [
  { name: 'Hợp tác xã Lâm nghiệp Bến Hải',    short: 'HTX Bến Hải',    kg: 487000, count: 38, plots: 5 },
  { name: 'Công ty CP Nguyên liệu Phước Sơn', short: 'CP Phước Sơn',   kg: 342000, count: 24, plots: 3 },
  { name: 'Công ty TNHH Lâm sản Tây Nguyên',  short: 'TN Tây Nguyên',  kg: 298500, count: 22, plots: 4 },
  { name: 'HTX Lâm nghiệp Đại Lộc',           short: 'HTX Đại Lộc',    kg: 187200, count: 16, plots: 2 },
  { name: 'HTX Trồng rừng Cẩm Lệ',            short: 'HTX Cẩm Lệ',     kg: 144000, count: 12, plots: 2 },
];

const ACTIVITY = [
  { t: hoursAgo(0.15), text: 'Cân ra hoàn tất', meta: '43C-219.84 · 14.380 kg net', kind: 'completed' },
  { t: hoursAgo(0.4),  text: 'Xe vào trạm cân',  meta: '75H-002.41 · Gỗ keo tròn', kind: 'inProgress' },
  { t: hoursAgo(0.7),  text: 'Phiếu cân tạo mới', meta: '92A-117.65 · HTX Bến Hải', kind: 'waiting' },
  { t: hoursAgo(1.2),  text: 'Hủy lượt cân',      meta: '51F-806.22 · Thiếu giấy tờ rừng', kind: 'cancelled' },
  { t: hoursAgo(1.6),  text: 'Cập nhật hồ sơ rừng', meta: 'KH-2024-17 · Cẩm Lệ', kind: 'inProgress' },
  { t: hoursAgo(2.1),  text: 'Cân ra hoàn tất',   meta: '38C-441.07 · 12.910 kg net', kind: 'completed' },
  { t: hoursAgo(2.8),  text: 'Hình ảnh QC bổ sung', meta: '47B-359.18 · 4 ảnh', kind: 'inProgress' },
  { t: hoursAgo(3.4),  text: 'Xe vào trạm cân',    meta: '29H-712.04 · Dăm gỗ keo', kind: 'inProgress' },
  { t: hoursAgo(4.2),  text: 'Phiếu cân tạo mới',  meta: '82D-100.95 · CP Phước Sơn', kind: 'waiting' },
  { t: hoursAgo(5.1),  text: 'Cân ra hoàn tất',    meta: '61C-228.50 · 15.620 kg net', kind: 'completed' },
];

// Plot registry
const PLOTS = [
  { id: 'KH-2024-03', owner: 'HTX Bến Hải', area: 4.2,  species: 'Keo lai', risk: 'low',    coords: '16.7842° N, 107.1934° E', lat: 16.7842, lng: 107.1934, commune: 'Xã Vĩnh Thủy',  district: 'Vĩnh Linh',   province: 'Quảng Trị',     plantedAt: new Date('2017-03-08'), harvestPlan: new Date('2024-09-15'), rotation: 7, density: 1660, prevHarvests: 1, certificate: 'FSC-CoC',         certId: 'FSC-VN-0142',  registered: new Date('2022-01-14'), elevation: 82,  slope: 12, soil: 'Feralit đỏ vàng' },
  { id: 'KH-2024-08', owner: 'Nguyễn Văn Hùng', area: 1.8, species: 'Keo lai', risk: 'medium', coords: '16.2401° N, 107.6611° E', lat: 16.2401, lng: 107.6611, commune: 'Xã A Lưới',     district: 'A Lưới',     province: 'Thừa Thiên Huế', plantedAt: new Date('2018-11-22'), harvestPlan: new Date('2025-05-30'), rotation: 7, density: 1800, prevHarvests: 0, certificate: 'Không',           certId: '—',           registered: new Date('2023-06-02'), elevation: 312, slope: 22, soil: 'Đất đỏ bazan' },
  { id: 'KH-2024-12', owner: 'CP Phước Sơn',  area: 7.6, species: 'Bạch đàn', risk: 'low',    coords: '15.4022° N, 107.8810° E', lat: 15.4022, lng: 107.8810, commune: 'Xã Phước Đức',  district: 'Phước Sơn',  province: 'Quảng Nam',     plantedAt: new Date('2016-07-12'), harvestPlan: new Date('2024-07-28'), rotation: 8, density: 1500, prevHarvests: 2, certificate: 'PEFC',            certId: 'PEFC-VN-0817', registered: new Date('2021-09-19'), elevation: 540, slope: 28, soil: 'Feralit nâu đỏ' },
  { id: 'KH-2024-17', owner: 'HTX Cẩm Lệ',    area: 3.1, species: 'Keo tai tượng', risk: 'high', coords: '15.9981° N, 108.1701° E', lat: 15.9981, lng: 108.1701, commune: 'Xã Hòa Châu',   district: 'Hòa Vang',    province: 'Đà Nẵng',       plantedAt: new Date('2019-01-15'), harvestPlan: new Date('2026-02-10'), rotation: 7, density: 1700, prevHarvests: 0, certificate: 'Chờ cấp',        certId: '—',           registered: new Date('2024-02-08'), elevation: 28,  slope: 6,  soil: 'Đất phù sa' },
  { id: 'KH-2024-21', owner: 'HTX Đại Lộc',   area: 5.4, species: 'Tràm',     risk: 'low',    coords: '15.8412° N, 108.0091° E', lat: 15.8412, lng: 108.0091, commune: 'Xã Đại Hồng',   district: 'Đại Lộc',    province: 'Quảng Nam',     plantedAt: new Date('2015-04-30'), harvestPlan: new Date('2024-04-12'), rotation: 9, density: 2200, prevHarvests: 2, certificate: 'FSC-CoC',         certId: 'FSC-VN-0309',  registered: new Date('2020-11-25'), elevation: 64,  slope: 9,  soil: 'Feralit vàng' },
  { id: 'KH-2024-26', owner: 'TN Tây Nguyên', area: 11.0, species: 'Keo lai', risk: 'medium', coords: '14.0851° N, 108.2772° E', lat: 14.0851, lng: 108.2772, commune: 'Xã Ia Kha',    district: 'Ia Grai',    province: 'Gia Lai',        plantedAt: new Date('2017-09-04'), harvestPlan: new Date('2025-10-05'), rotation: 8, density: 1620, prevHarvests: 1, certificate: 'PEFC',            certId: 'PEFC-VN-1104', registered: new Date('2022-08-30'), elevation: 720, slope: 18, soil: 'Đất đỏ bazan' },
  { id: 'KH-2024-29', owner: 'HTX Bến Hải',   area: 2.3, species: 'Bạch đàn', risk: 'low',    coords: '16.7611° N, 107.2018° E', lat: 16.7611, lng: 107.2018, commune: 'Xã Vĩnh Linh',   district: 'Vĩnh Linh',   province: 'Quảng Trị',     plantedAt: new Date('2018-02-19'), harvestPlan: new Date('2025-12-04'), rotation: 7, density: 1750, prevHarvests: 0, certificate: 'FSC-CoC',         certId: 'FSC-VN-0142',  registered: new Date('2023-01-09'), elevation: 95,  slope: 14, soil: 'Feralit đỏ vàng' },
  { id: 'KH-2024-34', owner: 'Nguyễn Văn Hùng', area: 0.9, species: 'Keo lai', risk: 'high', coords: '16.2300° N, 107.6420° E', lat: 16.2300, lng: 107.6420, commune: 'Xã A Lưới',     district: 'A Lưới',     province: 'Thừa Thiên Huế', plantedAt: new Date('2020-05-08'), harvestPlan: new Date('2027-06-22'), rotation: 7, density: 1850, prevHarvests: 0, certificate: 'Không',           certId: '—',           registered: new Date('2024-03-17'), elevation: 305, slope: 26, soil: 'Đất đỏ bazan' },
];
const RISK = {
  low:    { label: 'Rủi ro thấp', color: '#16A34A' },
  medium: { label: 'Rủi ro vừa',  color: '#D97706' },
  high:   { label: 'Rủi ro cao',  color: '#DC2626' },
};

// Suppliers (primary + secondaries)
const SUPPLIER_DETAIL = {
  name: 'Hợp tác xã Lâm nghiệp Bến Hải',
  code: 'NCC-00041',
  taxCode: '3300687412',
  rep: 'Nguyễn Văn Quân',
  phone: '0234 555 0148',
  address: 'Thôn Hiền Lương, xã Vĩnh Thành, huyện Vĩnh Linh, tỉnh Quảng Trị',
  registered: new Date('2023-04-18'),
  status: 'active',
  secondaries: [
    { name: 'Nguyễn Văn Tâm',  id: '049083004217', share: 18, plots: 2 },
    { name: 'Trần Văn Mạnh',   id: '049084001033', share: 24, plots: 3 },
    { name: 'Lê Thị Hoa',      id: '049088012490', share: 12, plots: 1 },
    { name: 'Phạm Quốc Đạt',   id: '049082007751', share: 31, plots: 4 },
    { name: 'Hoàng Văn Bình',  id: '049089004288', share: 15, plots: 2 },
  ],
};

Object.assign(window, {
  PLANTS, NAV_ITEMS, STATUS, MATERIALS, SUPPLIERS_BRIEF, DRIVERS, PLATES,
  CARGO, DASH_STATS, TREND, ACTIVITY, PLOTS, RISK, SUPPLIER_DETAIL,
  MATERIAL_PALETTE, MATERIAL_STATS, DAILY_INTAKE_14D, TOP_SUPPLIERS,
  fmtTime, fmtDateTime, fmtDate, pad, hoursAgo,
});
