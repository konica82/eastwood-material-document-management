// Settings (Cài đặt) — data sources + adjacent admin sections.
// Brief:
//  - Each plant has its OWN set of Google Sheet URLs for its data.
//  - Only "Danh sách người dùng" is a single sheet shared across all 3 plants.

const DATASET_META = {
  cargo:     { name: 'Xe hàng & phiếu cân', icon: 'scale',        desc: 'Lượt cân, ảnh đồng hồ, dữ liệu giám sát' },
  plots:     { name: 'Hồ sơ rừng',          icon: 'map',          desc: 'Lô rừng, ranh giới, mức rủi ro' },
  suppliers: { name: 'Nhà cung cấp',        icon: 'building-2',   desc: 'Nhà cung cấp chính và phụ' },
  materials: { name: 'Nguyên liệu',         icon: 'package',      desc: 'Danh mục loại nguyên liệu' },
  drivers:   { name: 'Tài xế',              icon: 'user-round',   desc: 'Hồ sơ tài xế và phương tiện' },
};

function gid(seed) {
  // pretend Google Sheets file id — 44-char base64-ish
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  let s = ''; let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 44; i++) { h = (h * 1103515245 + 12345) >>> 0; s += chars[h % chars.length]; }
  return s;
}
function sheetUrl(seed) {
  return `https://docs.google.com/spreadsheets/d/${gid(seed)}/edit`;
}
function minsAgo(m) { return new Date(Date.now() - m * 60000); }

const DEFAULT_SOURCES = {
  NMXH: {
    cargo:     { url: sheetUrl('NMXH-cargo'),     tab: 'PhieuCan',  range: 'A2:AC', lastSync: minsAgo(3),  status: 'ok' },
    plots:     { url: sheetUrl('NMXH-plots'),     tab: 'HoSoRung',  range: 'A2:N',  lastSync: minsAgo(11), status: 'ok' },
    suppliers: { url: sheetUrl('NMXH-suppliers'), tab: 'NhaCungCap',range: 'A2:M',  lastSync: minsAgo(11), status: 'ok' },
    materials: { url: sheetUrl('NMXH-materials'), tab: 'NguyenLieu',range: 'A2:F',  lastSync: minsAgo(11), status: 'ok' },
    drivers:   { url: sheetUrl('NMXH-drivers'),   tab: 'TaiXe',     range: 'A2:K',  lastSync: minsAgo(11), status: 'ok' },
  },
  NMQM: {
    cargo:     { url: sheetUrl('NMQM-cargo'),     tab: 'PhieuCan',  range: 'A2:AC', lastSync: minsAgo(6),  status: 'ok' },
    plots:     { url: sheetUrl('NMQM-plots'),     tab: 'HoSoRung',  range: 'A2:N',  lastSync: minsAgo(72), status: 'error', error: 'Không thể đọc trang tính: kiểm tra quyền chia sẻ' },
    suppliers: { url: sheetUrl('NMQM-suppliers'), tab: 'NhaCungCap',range: 'A2:M',  lastSync: minsAgo(14), status: 'ok' },
    materials: { url: sheetUrl('NMQM-materials'), tab: 'NguyenLieu',range: 'A2:F',  lastSync: minsAgo(14), status: 'ok' },
    drivers:   { url: '',                          tab: 'TaiXe',     range: 'A2:K',  lastSync: null,        status: 'empty' },
  },
  NMCT: {
    cargo:     { url: sheetUrl('NMCT-cargo'),     tab: 'PhieuCan',  range: 'A2:AC', lastSync: minsAgo(2),  status: 'ok' },
    plots:     { url: sheetUrl('NMCT-plots'),     tab: 'HoSoRung',  range: 'A2:N',  lastSync: minsAgo(9),  status: 'ok' },
    suppliers: { url: sheetUrl('NMCT-suppliers'), tab: 'NhaCungCap',range: 'A2:M',  lastSync: minsAgo(9),  status: 'ok' },
    materials: { url: sheetUrl('NMCT-materials'), tab: 'NguyenLieu',range: 'A2:F',  lastSync: minsAgo(9),  status: 'ok' },
    drivers:   { url: sheetUrl('NMCT-drivers'),   tab: 'TaiXe',     range: 'A2:K',  lastSync: minsAgo(9),  status: 'ok' },
  },
};

const DEFAULT_SHARED_USERS = {
  url: sheetUrl('SHARED-users'), tab: 'NguoiDung', range: 'A2:G', lastSync: minsAgo(5), status: 'ok',
};

const SETTINGS_SECTIONS = [
  { id: 'sources',  label: 'Nguồn dữ liệu',          icon: 'database' },
  { id: 'sync',     label: 'Đồng bộ',                icon: 'refresh-ccw' },
  { id: 'users',    label: 'Người dùng & vai trò',   icon: 'users' },
  { id: 'alerts',   label: 'Cảnh báo & thông báo',   icon: 'bell' },
  { id: 'audit',    label: 'Nhật ký phiên',          icon: 'history' },
];

function fmtAgo(d) {
  if (!d) return 'Chưa đồng bộ';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ ${mins % 60} phút trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function ScreenSettings({ onToast }) {
  const [section, setSection] = useState('sources');
  const [plantId, setPlantId] = useState('NMXH');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [shared, setShared] = useState(DEFAULT_SHARED_USERS);
  const [dirty, setDirty] = useState(new Set());
  const [testing, setTesting] = useState(null); // { key } currently testing

  const errorCount = useMemo(() => {
    let n = 0;
    Object.values(sources).forEach(p => Object.values(p).forEach(s => { if (s.status === 'error') n++; }));
    return n;
  }, [sources]);

  function markDirty(key) {
    setDirty(prev => { const n = new Set(prev); n.add(key); return n; });
  }

  function updatePlantSource(plant, dataset, patch) {
    setSources(prev => ({
      ...prev,
      [plant]: { ...prev[plant], [dataset]: { ...prev[plant][dataset], ...patch } },
    }));
    markDirty(`${plant}.${dataset}`);
  }

  function updateShared(patch) {
    setShared(prev => ({ ...prev, ...patch }));
    markDirty('shared.users');
  }

  function testConnection(key) {
    setTesting(key);
    setTimeout(() => {
      setTesting(null);
      onToast && onToast({ message: `Kết nối thành công · ${key}`, tone: 'success' });
    }, 1200);
  }

  function syncOne(plant, dataset) {
    setSources(prev => ({
      ...prev,
      [plant]: { ...prev[plant], [dataset]: { ...prev[plant][dataset], lastSync: new Date(), status: 'ok', error: null } },
    }));
    onToast && onToast({ message: `Đã đồng bộ ${DATASET_META[dataset].name} · ${plant}.`, tone: 'success' });
  }

  function syncAll() {
    const now = new Date();
    setSources(prev => {
      const out = {};
      Object.entries(prev).forEach(([p, ds]) => {
        out[p] = {};
        Object.entries(ds).forEach(([k, s]) => {
          out[p][k] = s.url ? { ...s, lastSync: now, status: 'ok', error: null } : s;
        });
      });
      return out;
    });
    setShared(s => ({ ...s, lastSync: now, status: 'ok' }));
    onToast && onToast({ message: 'Đã đồng bộ tất cả nguồn dữ liệu.', tone: 'success' });
  }

  return (
    <div data-screen-label="settings" style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Cài đặt</div>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--text-1)', lineHeight: 1.3 }}>
          Cấu hình hệ thống
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
          <Icon name="shield-check" size={12} />
          <span>Khu vực dành cho quản trị viên · các thay đổi áp dụng ngay khi lưu</span>
        </div>
      </div>

      {/* Layout: sub-nav + content */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sub-nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 72 }}>
          {SETTINGS_SECTIONS.map(s => (
            <SettingsNavItem key={s.id} item={s} active={section === s.id} onClick={() => setSection(s.id)}
              warn={s.id === 'sources' && errorCount > 0 ? errorCount : null}
            />
          ))}
        </nav>

        {/* Content */}
        <div style={{ minWidth: 0 }}>
          {section === 'sources' && (
            <DataSourcesSection
              plantId={plantId} setPlantId={setPlantId}
              sources={sources} updatePlantSource={updatePlantSource}
              shared={shared} updateShared={updateShared}
              dirty={dirty}
              testing={testing} testConnection={testConnection}
              syncOne={syncOne} syncAll={syncAll}
              errorCount={errorCount}
            />
          )}
          {section !== 'sources' && <SectionPlaceholder section={section} />}
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ item, active, onClick, warn }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        background: active ? 'var(--accent-tint)' : (hover ? 'var(--surface-tint)' : 'transparent'),
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        border: 'none', borderRadius: 6,
        textAlign: 'left', cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-1)',
        fontWeight: active ? 500 : 400, fontSize: 13,
        transition: 'background 150ms ease-out',
      }}>
      <Icon name={item.icon} size={14} style={{ color: active ? 'var(--accent)' : 'var(--text-2)' }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {warn !== null && warn !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 999,
          background: 'var(--danger-bg)', color: 'var(--danger-text)',
        }} className="mono">{warn}</span>
      )}
    </button>
  );
}

function DataSourcesSection(props) {
  const { plantId, setPlantId, sources, updatePlantSource, shared, updateShared,
          dirty, testing, testConnection, syncOne, syncAll, errorCount } = props;
  const plant = PLANTS.find(p => p.id === plantId);
  const plantSources = sources[plantId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 920 }}>
      {/* Sub-header */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text-1)' }}>Nguồn dữ liệu</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', maxWidth: 680 }}>
          Mỗi nhà máy có một bộ Google Sheets riêng cho từng loại dữ liệu. Riêng <span style={{ color: 'var(--text-1)' }}>danh sách người dùng</span> là một trang tính dùng chung cho cả ba nhà máy.
        </p>
      </div>

      {/* Status banner */}
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: errorCount > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
              color: errorCount > 0 ? 'var(--danger-text)' : 'var(--success-text)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={errorCount > 0 ? 'alert-triangle' : 'check'} size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                {errorCount > 0 ? `${errorCount} nguồn dữ liệu đang gặp lỗi` : 'Tất cả nguồn đang hoạt động'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                Đồng bộ tự động mỗi <span className="mono">15</span> phút · áp dụng cho 3 nhà máy
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button icon="refresh-ccw" variant="secondary" onClick={syncAll}>Đồng bộ tất cả ngay</Button>
        </div>
      </Card>

      {/* Plant tabs */}
      <Card padding={0}>
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <Tabs
            active={plantId}
            onChange={setPlantId}
            tabs={PLANTS.map(p => {
              const errs = Object.values(sources[p.id]).filter(s => s.status === 'error').length;
              return { id: p.id, label: p.name, count: errs > 0 ? errs : undefined };
            })}
          />
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
            <Icon name="info" size={12} style={{ color: 'var(--text-3)' }} />
            <span>Vai trò của bạn tại nhà máy này:</span>
            <Badge tone="info">{plant.role}</Badge>
          </div>
          {Object.keys(DATASET_META).map(k => (
            <SourceRow key={`${plantId}.${k}`}
              datasetKey={k}
              source={plantSources[k]}
              dirty={dirty.has(`${plantId}.${k}`)}
              testing={testing === `${plantId}.${k}`}
              onChange={(patch) => updatePlantSource(plantId, k, patch)}
              onTest={() => testConnection(`${plantId}.${k}`)}
              onSync={() => syncOne(plantId, k)}
            />
          ))}
        </div>
      </Card>

      {/* Shared section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--text-1)' }}>Dùng chung cho cả ba nhà máy</h3>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 999,
            background: 'var(--surface-tint)', border: '1px solid var(--border)', color: 'var(--text-2)',
          }} className="mono">SHARED</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 12px' }}>
          Một bảng người dùng chung quản lý quyền truy cập vào toàn bộ hệ thống.
        </p>
        <Card padding={16}>
          <SourceRow
            datasetKey="users"
            meta={{ name: 'Danh sách người dùng', icon: 'users', desc: 'Tài khoản, email, vai trò ở từng nhà máy' }}
            source={shared}
            dirty={dirty.has('shared.users')}
            testing={testing === 'shared.users'}
            onChange={updateShared}
            onTest={() => testConnection('shared.users')}
            onSync={() => updateShared({ lastSync: new Date(), status: 'ok' })}
            noContainer
          />
        </Card>
      </div>
    </div>
  );
}

function SourceRow({ datasetKey, source, dirty, testing, onChange, onTest, onSync, meta, noContainer }) {
  const m = meta || DATASET_META[datasetKey];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const wrapStyle = noContainer ? {} : {
    border: '1px solid var(--border)', borderRadius: 10, padding: 14,
    background: source.status === 'error' ? 'color-mix(in srgb, var(--danger-bg) 60%, transparent)' : 'var(--card-bg)',
  };

  return (
    <div style={wrapStyle}>
      {/* Row 1: header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'var(--surface-tint)', border: '1px solid var(--border)',
          color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={m.icon} size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{m.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{m.desc}</div>
        </div>
        <SourceStatus source={source} dirty={dirty} />
      </div>

      {/* Row 2: URL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={source.url}
          onChange={v => onChange({ url: v })}
          mono
          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          leftIcon="link"
          style={{ flex: 1 }}
        />
        <IconButton icon="external-link" label="Mở trong tab mới"
          onClick={() => source.url && window.open(source.url, '_blank')} />
        <IconButton icon="copy" label="Sao chép URL"
          onClick={() => navigator.clipboard && navigator.clipboard.writeText(source.url)} />
        <Button size="md" variant="secondary" icon="plug-zap" loading={testing} onClick={onTest}>Kiểm tra</Button>
      </div>

      {/* Row 3: sub fields */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <SubField label="Tab">
          <TextInput value={source.tab} onChange={v => onChange({ tab: v })} mono style={{ width: 160 }} />
        </SubField>
        <SubField label="Khoảng ô">
          <TextInput value={source.range} onChange={v => onChange({ range: v })} mono style={{ width: 110 }} />
        </SubField>
        <div style={{ flex: 1 }} />
        <Button size="md" variant="ghost" icon="refresh-ccw" onClick={onSync}>Đồng bộ ngay</Button>
        <button onClick={() => setShowAdvanced(v => !v)}
          aria-label="Tùy chọn nâng cao"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-2)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Icon name="more-horizontal" size={14} />
        </button>
      </div>

      {/* Error message */}
      {source.status === 'error' && source.error && (
        <div style={{
          marginTop: 10, padding: '8px 10px', borderRadius: 6,
          background: 'var(--danger-bg)', color: 'var(--danger-text)',
          fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="alert-circle" size={12} />
          <span>{source.error}</span>
        </div>
      )}
    </div>
  );
}

function SourceStatus({ source, dirty }) {
  if (dirty) return <Badge tone="info">Chưa lưu</Badge>;
  if (source.status === 'empty') return <Badge tone="neutral">Chưa cấu hình</Badge>;
  if (source.status === 'error') return <Badge tone="danger" dot>Lỗi đồng bộ</Badge>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Badge tone="success" dot>Đồng bộ</Badge>
      <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtAgo(source.lastSync)}</span>
    </div>
  );
}

function SubField({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      {children}
    </label>
  );
}

function SectionPlaceholder({ section }) {
  const s = SETTINGS_SECTIONS.find(x => x.id === section);
  return (
    <div style={{ maxWidth: 920 }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 4px', color: 'var(--text-1)' }}>{s.label}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>
        Phần này sẽ kế thừa cấu trúc tương tự Nguồn dữ liệu.
      </p>
      <Card padding={40}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-3)' }}>
          <Icon name={s.icon} size={40} strokeWidth={1.25} />
          <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Sắp triển khai.</div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ScreenSettings });
