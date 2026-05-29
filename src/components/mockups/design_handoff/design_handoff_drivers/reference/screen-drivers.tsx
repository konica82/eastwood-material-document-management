// Drivers (Tài xế) — table list + slide-over detail drawer

// Build a richer driver dataset, deriving trips from CARGO where names match.
const DRIVER_BASE = [
  { name: 'Nguyễn Văn Tâm',  cccd: '049083004217', phone: '0905 218 447', gplx: '790112034881', cls: 'FC', expiry: new Date('2026-07-12'), base: 'Quảng Trị',  joined: new Date('2022-03-14'), status: 'active'  },
  { name: 'Trần Quốc Bảo',   cccd: '049084001033', phone: '0913 770 052', gplx: '790118220194', cls: 'C',  expiry: new Date('2026-06-09'), base: 'Quảng Nam',  joined: new Date('2021-11-02'), status: 'active'  },
  { name: 'Lê Hoàng Phúc',   cccd: '049088012490', phone: '0987 411 309', gplx: '790120771630', cls: 'FC', expiry: new Date('2026-06-02'), base: 'Đà Nẵng',    joined: new Date('2023-01-19'), status: 'expiring' },
  { name: 'Phạm Đình Sơn',   cccd: '049082007751', phone: '0935 882 117', gplx: '790115003442', cls: 'C',  expiry: new Date('2027-02-28'), base: 'Gia Lai',    joined: new Date('2020-08-30'), status: 'active'  },
  { name: 'Hoàng Minh Đức',  cccd: '049089004288', phone: '0901 663 270', gplx: '790121448900', cls: 'E',  expiry: new Date('2026-05-31'), base: 'Quảng Nam',  joined: new Date('2023-09-05'), status: 'expiring' },
  { name: 'Võ Thanh Hùng',   cccd: '064085001244', phone: '0972 504 188', gplx: '640112770013', cls: 'FC', expiry: new Date('2026-12-20'), base: 'Gia Lai',    joined: new Date('2019-04-22'), status: 'active'  },
  { name: 'Đặng Văn Lộc',    cccd: '064088000922', phone: '0944 117 836', gplx: '640119002255', cls: 'C',  expiry: new Date('2025-11-15'), base: 'Khánh Hòa',  joined: new Date('2024-02-08'), status: 'suspended' },
  { name: 'Bùi Quang Huy',   cccd: '064084003781', phone: '0918 209 644', gplx: '640114668120', cls: 'FC', expiry: new Date('2027-08-01'), base: 'Gia Lai',    joined: new Date('2021-06-17'), status: 'active'  },
  { name: 'Ngô Đức Trí',     cccd: '049081002455', phone: '0903 558 901', gplx: '790110224578', cls: 'B2', expiry: new Date('2026-09-22'), base: 'Quảng Nam',  joined: new Date('2022-10-11'), status: 'active'  },
  { name: 'Phan Văn Nam',    cccd: '049087001023', phone: '0966 340 712', gplx: '790122990147', cls: 'C',  expiry: new Date('2026-06-18'), base: 'Đà Nẵng',    joined: new Date('2024-05-20'), status: 'pending' },
  { name: 'Đỗ Hữu Thắng',    cccd: '049085001980', phone: '0978 661 205', gplx: '790116300988', cls: 'FC', expiry: new Date('2027-04-09'), base: 'Quảng Trị',  joined: new Date('2020-12-01'), status: 'active'  },
  { name: 'Cao Bá Quát',     cccd: '048084002115', phone: '0939 884 016', gplx: '480113557742', cls: 'E',  expiry: new Date('2026-06-05'), base: 'Khánh Hòa',  joined: new Date('2023-07-30'), status: 'expiring' },
];

const TODAY_REF = new Date('2026-05-28');

function daysUntil(d) {
  return Math.round((d - TODAY_REF) / 86400000);
}

const DRIVERS_FULL = DRIVER_BASE.map((d) => {
  const trips = CARGO.filter(c => c.driver === d.name);
  const completed = trips.filter(c => c.status === 'completed');
  const plates = Array.from(new Set(trips.map(c => c.plate)));
  const materials = Array.from(new Set(trips.map(c => c.material)));
  const kg30 = completed.reduce((a, c) => a + ((c.grossKg && c.tareKg) ? c.grossKg - c.tareKg : 0), 0);
  const lastTrip = trips.length ? trips.reduce((a, c) => c.createdAt > a.createdAt ? c : a, trips[0]) : null;
  // fall back so every driver shows some activity
  const plateList = plates.length ? plates : [PLATES[DRIVER_BASE.indexOf(d) % PLATES.length]];
  const matList = materials.length ? materials : [MATERIALS[DRIVER_BASE.indexOf(d) % MATERIALS.length]];
  return {
    ...d,
    trips,
    trips30: trips.length || (2 + (DRIVER_BASE.indexOf(d) % 5)),
    kg30: kg30 || (38000 + (DRIVER_BASE.indexOf(d) * 4100) % 52000),
    totalTrips: 120 + (DRIVER_BASE.indexOf(d) * 37) % 540,
    plates: plateList,
    materials: matList,
    lastTrip,
    expDays: daysUntil(d.expiry),
  };
});

const CLASS_INFO = {
  B2: 'Xe tải < 3,5 tấn',
  C:  'Xe tải ≥ 3,5 tấn',
  E:  'Xe khách > 30 chỗ',
  FC: 'Xe tải kéo rơ-moóc',
};

const DRIVER_STATUS = {
  active:    { tone: 'success', label: 'Đang hoạt động' },
  expiring:  { tone: 'warning', label: 'GPLX sắp hết hạn' },
  suspended: { tone: 'danger',  label: 'Tạm khóa' },
  pending:   { tone: 'neutral', label: 'Chờ duyệt hồ sơ' },
};

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name) {
  const palette = [
    ['rgba(30,64,175,0.10)', 'var(--accent)'],
    ['rgba(22,163,74,0.10)', '#16A34A'],
    ['rgba(217,119,6,0.10)', '#D97706'],
    ['rgba(124,58,237,0.10)', '#7C3AED'],
    ['rgba(8,145,178,0.10)', '#0891B2'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function DriverAvatar({ name, size = 34 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 44 ? 15 : 12, fontWeight: 600,
      flexShrink: 0, letterSpacing: '0.02em',
    }}>{initials(name)}</div>
  );
}

function ClassBadge({ cls }) {
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center',
      height: 20, padding: '0 7px', borderRadius: 5,
      background: 'var(--surface-tint)', border: '1px solid var(--border)',
      fontSize: 11, fontWeight: 500, color: 'var(--text-1)',
    }}>{cls}</span>
  );
}

function ExpiryCell({ date, days }) {
  let color = 'var(--text-2)', label = null;
  if (days < 0) { color = 'var(--danger-text)'; label = 'Đã hết hạn'; }
  else if (days <= 30) { color = 'var(--danger-text)'; label = `Còn ${days} ngày`; }
  else if (days <= 90) { color = 'var(--warning-text)'; label = `Còn ${days} ngày`; }
  return (
    <div>
      <div className="mono" style={{ fontSize: 12, color }}>{fmtDate(date)}</div>
      {label && <div style={{ fontSize: 11, color }}>{label}</div>}
    </div>
  );
}

function DriverStatTile({ icon, label, value, tone, sub, onClick, active }) {
  const [hover, setHover] = useState(false);
  const toneColor = {
    accent: 'var(--accent)', success: 'var(--success)',
    warning: 'var(--warning)', danger: 'var(--danger)',
  }[tone] || 'var(--text-2)';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, textAlign: 'left',
        background: 'var(--card-bg)',
        border: active ? `1px solid ${toneColor}` : 'var(--card-border)',
        boxShadow: active ? `0 0 0 1px ${toneColor}` : 'none',
        borderRadius: 10, padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
        ...(hover && !active ? { background: 'var(--surface-tint)' } : null),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: tone === 'accent' ? 'var(--accent-tint)' : `color-mix(in srgb, ${toneColor} 12%, transparent)`,
          color: toneColor,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span className="mono" style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
    </button>
  );
}

function ScreenDrivers({ onToast }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState({ col: 'name', dir: 'asc' });
  const [hoverRow, setHoverRow] = useState(null);
  const [openDriver, setOpenDriver] = useState(null);

  const counts = useMemo(() => ({
    all: DRIVERS_FULL.length,
    active: DRIVERS_FULL.filter(d => d.status === 'active').length,
    expiring: DRIVERS_FULL.filter(d => d.status === 'expiring' || (d.expDays <= 90 && d.expDays >= 0)).length,
    suspended: DRIVERS_FULL.filter(d => d.status === 'suspended').length,
    pending: DRIVERS_FULL.filter(d => d.status === 'pending').length,
  }), []);

  const totalKg = DRIVERS_FULL.reduce((a, d) => a + d.kg30, 0);

  const filtered = useMemo(() => {
    let rows = DRIVERS_FULL.slice();
    if (filter === 'active')    rows = rows.filter(d => d.status === 'active');
    if (filter === 'expiring')  rows = rows.filter(d => d.status === 'expiring' || (d.expDays <= 90 && d.expDays >= 0));
    if (filter === 'suspended') rows = rows.filter(d => d.status === 'suspended');
    if (filter === 'pending')   rows = rows.filter(d => d.status === 'pending');
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      rows = rows.filter(d =>
        d.name.toLowerCase().includes(k) ||
        d.cccd.includes(k) ||
        d.gplx.includes(k) ||
        d.phone.replace(/\s/g, '').includes(k.replace(/\s/g, '')) ||
        d.plates.some(p => p.toLowerCase().includes(k))
      );
    }
    rows.sort((a, b) => {
      let va = a[sortBy.col], vb = b[sortBy.col];
      if (sortBy.col === 'expiry') { va = a.expDays; vb = b.expDays; }
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sortBy.dir === 'asc' ? r : -r;
    });
    return rows;
  }, [filter, q, sortBy]);

  function clickHeader(col) {
    setSortBy(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  return (
    <div data-screen-label="drivers-list" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Tài xế</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--text-1)' }}>
            Danh sách tài xế
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon="download" variant="secondary">Xuất Excel</Button>
          <Button icon="user-plus" variant="primary">Thêm tài xế</Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <DriverStatTile icon="users" label="Tổng tài xế" value={counts.all} tone="accent"
          sub={`${Math.round(totalKg / 1000).toLocaleString('vi-VN')} tấn · 30N`}
          active={filter === 'all'} onClick={() => setFilter('all')} />
        <DriverStatTile icon="circle-check" label="Đang hoạt động" value={counts.active} tone="success"
          active={filter === 'active'} onClick={() => setFilter('active')} />
        <DriverStatTile icon="clock-alert" label="GPLX sắp hết hạn" value={counts.expiring} tone="warning"
          sub="≤ 90 ngày" active={filter === 'expiring'} onClick={() => setFilter('expiring')} />
        <DriverStatTile icon="user-x" label="Tạm khóa / chờ duyệt" value={counts.suspended + counts.pending} tone="danger"
          active={filter === 'suspended'} onClick={() => setFilter('suspended')} />
      </div>

      <Card padding={0}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
        }}>
          <FilterChip active={filter === 'all'}       label="Tất cả"      count={counts.all}       onClick={() => setFilter('all')} />
          <FilterChip active={filter === 'active'}    label="Hoạt động"   count={counts.active}    onClick={() => setFilter('active')}    tone="success" />
          <FilterChip active={filter === 'expiring'}  label="Sắp hết hạn" count={counts.expiring}  onClick={() => setFilter('expiring')}  tone="warning" />
          <FilterChip active={filter === 'suspended'} label="Tạm khóa"    count={counts.suspended} onClick={() => setFilter('suspended')} tone="danger" />
          <FilterChip active={filter === 'pending'}   label="Chờ duyệt"   count={counts.pending}   onClick={() => setFilter('pending')} />
          <div style={{ flex: 1 }} />
          <TextInput value={q} onChange={setQ} placeholder="Tìm tên, CCCD, GPLX, biển số…" leftIcon="search" style={{ width: 280 }} />
        </div>

        {/* Table */}
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 'var(--cell-fs)' }}>
            <thead>
              <tr>
                <Th onClick={() => clickHeader('name')} sort={sortBy} col="name" flex>Tài xế</Th>
                <Th width={150}>GPLX</Th>
                <Th onClick={() => clickHeader('expiry')} sort={sortBy} col="expiry" width={140}>Hạn GPLX</Th>
                <Th width={130}>Điện thoại</Th>
                <Th width={150}>Phương tiện</Th>
                <Th onClick={() => clickHeader('trips30')} sort={sortBy} col="trips30" width={90} align="right">Chuyến 30N</Th>
                <Th onClick={() => clickHeader('kg30')} sort={sortBy} col="kg30" width={120} align="right">KL tịnh 30N</Th>
                <Th width={150}>Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const isHover = hoverRow === d.cccd;
                const st = DRIVER_STATUS[d.status];
                return (
                  <tr key={d.cccd}
                    onMouseEnter={() => setHoverRow(d.cccd)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => setOpenDriver(d)}
                    style={{
                      cursor: 'pointer',
                      background: isHover ? 'var(--surface-tint)' : 'transparent',
                      transition: 'background 100ms ease-out',
                    }}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <DriverAvatar name={d.name} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>{d.name}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.cccd} · {d.base}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClassBadge cls={d.cls} />
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.gplx}</span>
                      </div>
                    </Td>
                    <Td><ExpiryCell date={d.expiry} days={d.expDays} /></Td>
                    <Td><span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.phone}</span></Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 12 }}>{d.plates[0]}</span>
                        {d.plates.length > 1 && (
                          <span style={{
                            fontSize: 11, color: 'var(--text-3)',
                            background: 'var(--surface-tint)', borderRadius: 999, padding: '1px 6px',
                          }}>+{d.plates.length - 1}</span>
                        )}
                      </div>
                    </Td>
                    <Td align="right"><span className="mono">{d.trips30}</span></Td>
                    <Td align="right"><span className="mono">{Math.round(d.kg30 / 1000).toLocaleString('vi-VN')} <span style={{ color: 'var(--text-3)' }}>t</span></span></Td>
                    <Td><Badge tone={st.tone} dot>{st.label}</Badge></Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px' }}>
                    <EmptyState icon="user-round" message="Không có tài xế nào khớp với bộ lọc."
                      action="Xóa bộ lọc" onAction={() => { setFilter('all'); setQ(''); }} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--text-2)',
        }}>
          <span>Hiển thị <span className="mono" style={{ color: 'var(--text-1)' }}>{filtered.length}</span> trên <span className="mono" style={{ color: 'var(--text-1)' }}>{DRIVERS_FULL.length}</span> tài xế</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="info" size={12} style={{ color: 'var(--text-3)' }} />
            Nhấp vào một dòng để xem hồ sơ tài xế
          </span>
        </div>
      </Card>

      <DriverDrawer driver={openDriver} onClose={() => setOpenDriver(null)} onToast={onToast} />
    </div>
  );
}

function DriverDrawer({ driver, onClose, onToast }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && driver) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [driver, onClose]);

  if (!driver) return null;
  const d = driver;
  const st = DRIVER_STATUS[d.status];
  const recent = (d.trips && d.trips.length ? d.trips.slice() : [])
    .sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.32)',
        zIndex: 150, animation: 'fadeIn 150ms ease-out',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 92vw)',
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        zIndex: 151, display: 'flex', flexDirection: 'column',
        animation: 'panelIn 200ms ease-out', boxShadow: '-8px 0 28px rgba(15,23,42,0.10)',
      }}>
        {/* Drawer header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <DriverAvatar name={d.name} size={48} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-1)' }}>{d.name}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{d.cccd}</div>
                <div style={{ marginTop: 8 }}><Badge tone={st.tone} dot>{st.label}</Badge></div>
              </div>
            </div>
            <IconButton icon="x" label="Đóng" onClick={onClose} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
            <DrawerStat label="Chuyến 30N" value={d.trips30} />
            <DrawerStat label="KL tịnh 30N" value={`${Math.round(d.kg30 / 1000)}t`} />
            <DrawerStat label="Tổng chuyến" value={d.totalTrips} />
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Documents */}
          <DrawerSection title="Giấy tờ & bằng lái" icon="id-card">
            <DrawerRow label="Giấy phép lái xe">
              <span className="mono">{d.gplx}</span>
            </DrawerRow>
            <DrawerRow label="Hạng">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ClassBadge cls={d.cls} />
                <span style={{ color: 'var(--text-2)' }}>{CLASS_INFO[d.cls]}</span>
              </span>
            </DrawerRow>
            <DrawerRow label="Hạn GPLX">
              <ExpiryCell date={d.expiry} days={d.expDays} />
            </DrawerRow>
            <DrawerRow label="Số CCCD"><span className="mono">{d.cccd}</span></DrawerRow>
            <DrawerRow label="Điện thoại"><span className="mono">{d.phone}</span></DrawerRow>
            <DrawerRow label="Khu vực / Ngày vào" last>
              {d.base}<span style={{ color: 'var(--text-3)' }}> · </span>
              <span className="mono">{fmtDate(d.joined)}</span>
            </DrawerRow>
          </DrawerSection>

          {/* Vehicles */}
          <DrawerSection title="Phương tiện thường dùng" icon="truck"
            action={<span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.plates.length} xe</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.plates.map((p, i) => (
                <div key={p} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, background: 'var(--surface-tint)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)',
                    }}><Icon name="truck" size={14} /></div>
                    <span className="mono" style={{ fontWeight: 500 }}>{p}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.materials[i % d.materials.length]}</span>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Recent trips */}
          <DrawerSection title="Chuyến gần đây" icon="history"
            action={<span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{recent.length || '—'}</span>}>
            {recent.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13,
                border: '1px dashed var(--border)', borderRadius: 8 }}>
                Chưa có chuyến nào trong kỳ.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recent.map((c, i) => {
                  const net = c.grossKg && c.tareKg ? c.grossKg - c.tareKg : null;
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {c.material} <span style={{ color: 'var(--text-3)' }}>·</span> <span className="mono">{c.plate}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          <span className="mono">{c.id}</span> · {fmtDateTime(c.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {net !== null ? `${net.toLocaleString('vi-VN')} kg` : '—'}
                        </div>
                        <div style={{ marginTop: 3 }}><StatusBadge statusId={c.status} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DrawerSection>
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)',
          display: 'flex', gap: 8,
        }}>
          <Button variant="secondary" icon="pencil" style={{ flex: 1 }}
            onClick={() => onToast && onToast({ message: 'Mở biểu mẫu chỉnh sửa hồ sơ tài xế.', tone: 'info' })}>
            Sửa hồ sơ
          </Button>
          {d.status === 'suspended' ? (
            <Button variant="primary" icon="unlock"
              onClick={() => onToast && onToast({ message: `Đã mở khóa tài xế ${d.name}.`, tone: 'success' })}>
              Mở khóa
            </Button>
          ) : (
            <Button variant="secondary" icon="ban"
              onClick={() => onToast && onToast({ message: `Đã tạm khóa tài xế ${d.name}.`, tone: 'warning' })}>
              Tạm khóa
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function DrawerStat({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-1)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function DrawerSection({ title, icon, action, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={14} style={{ color: 'var(--text-2)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DrawerRow({ label, children, last }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center',
      padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--border)', fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ color: 'var(--text-1)' }}>{children}</span>
    </div>
  );
}

Object.assign(window, { ScreenDrivers });
