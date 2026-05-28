'use client';

// Cargo list + Cargo detail

import React, { useState, useMemo } from 'react';
import {
  CARGO, MockCargoRow,
  fmtTime, fmtDateTime,
} from '../data';
import {
  Icon, Badge, StatusBadge, Button, TextInput, FilterChip,
  Card, Tabs, Th, Td, Row, EmptyState,
} from '../ui';

// ─── Cargo list ───────────────────────────────────────────────────────────────

interface ScreenCargoProps {
  onOpenCargo: (cargo: MockCargoRow) => void;
}

export function ScreenCargo({ onOpenCargo }: ScreenCargoProps) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'createdAt', dir: 'desc' });
  const [hoverRow, setHoverRow] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all:        CARGO.length,
    waiting:    CARGO.filter(c => c.status === 'waiting').length,
    inProgress: CARGO.filter(c => c.status === 'inProgress').length,
    completed:  CARGO.filter(c => c.status === 'completed').length,
    cancelled:  CARGO.filter(c => c.status === 'cancelled').length,
  }), []);

  const filtered = useMemo(() => {
    let rows = CARGO.slice();
    if (filter !== 'all') rows = rows.filter(c => c.status === filter);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      rows = rows.filter(c =>
        c.plate.toLowerCase().includes(k) ||
        c.driver.toLowerCase().includes(k) ||
        c.supplier.toLowerCase().includes(k) ||
        c.material.toLowerCase().includes(k) ||
        c.id.toLowerCase().includes(k),
      );
    }
    rows.sort((a, b) => {
      const va = a[sortBy.col as keyof MockCargoRow];
      const vb = b[sortBy.col as keyof MockCargoRow];
      const r = va! < vb! ? -1 : va! > vb! ? 1 : 0;
      return sortBy.dir === 'asc' ? r : -r;
    });
    return rows;
  }, [filter, q, sortBy]);

  function clickHeader(col: string) {
    setSortBy(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  return (
    <div data-screen-label="cargo-list" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Xe hàng</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
            Danh sách lượt cân
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon="upload" variant="secondary">Nhập từ Excel</Button>
          <Button icon="plus"   variant="primary">Tạo lượt cân</Button>
        </div>
      </div>

      <Card padding={0}>
        {/* Filter chips */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}>
          <FilterChip active={filter === 'all'}        label="Tất cả"     count={counts.all}        onClick={() => setFilter('all')} />
          <FilterChip active={filter === 'waiting'}    label="Chờ lượt"   count={counts.waiting}    onClick={() => setFilter('waiting')}    tone="warning" />
          <FilterChip active={filter === 'inProgress'} label="Đang xử lý" count={counts.inProgress} onClick={() => setFilter('inProgress')} tone="info" />
          <FilterChip active={filter === 'completed'}  label="Hoàn thành" count={counts.completed}  onClick={() => setFilter('completed')}  tone="success" />
          <FilterChip active={filter === 'cancelled'}  label="Hủy lượt"   count={counts.cancelled}  onClick={() => setFilter('cancelled')}  tone="danger" />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <TextInput value={q} onChange={setQ} placeholder="Tìm biển số, tài xế, NCC…" leftIcon="search" style={{ width: 260 }} />
            <Button icon="calendar"          variant="secondary">26/05 – 27/05</Button>
            <Button icon="sliders-horizontal" variant="secondary">Bộ lọc</Button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 'var(--cell-fs)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                <Th onClick={() => clickHeader('plate')}    sort={sortBy} col="plate"     width={140}>Biển số</Th>
                <Th onClick={() => clickHeader('driver')}   sort={sortBy} col="driver"              >Tài xế</Th>
                <Th onClick={() => clickHeader('material')} sort={sortBy} col="material"            >Nguyên liệu</Th>
                <Th onClick={() => clickHeader('supplier')} sort={sortBy} col="supplier"  flex      >Nhà cung cấp chính</Th>
                <Th align="right" width={110}                                                        >Khối lượng</Th>
                <Th onClick={() => clickHeader('status')}   sort={sortBy} col="status"    width={130}>Trạng thái</Th>
                <Th onClick={() => clickHeader('createdAt')} sort={sortBy} col="createdAt" width={120} align="right">Tạo lúc</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isHover = hoverRow === c.id;
                const net = c.grossKg && c.tareKg ? c.grossKg - c.tareKg : null;
                return (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setHoverRow(c.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => onOpenCargo(c)}
                    style={{
                      cursor: 'pointer',
                      background: isHover ? 'var(--color-bg-subtle)' : 'transparent',
                      transition: 'background 100ms ease-out',
                    }}
                  >
                    <Td><span className="mono" style={{ fontWeight: 500 }}>{c.plate}</span></Td>
                    <Td>
                      <div style={{ color: 'var(--color-text-primary)' }}>{c.driver}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{c.driverId}</div>
                    </Td>
                    <Td>{c.material}</Td>
                    <Td>
                      <div style={{ color: 'var(--color-text-primary)' }}>{c.supplier}</div>
                      {c.secondarySuppliers > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>+ {c.secondarySuppliers} NCC phụ</div>
                      )}
                    </Td>
                    <Td align="right">
                      {net !== null ? (
                        <span className="mono">{net.toLocaleString('vi-VN')} <span style={{ color: 'var(--color-text-tertiary)' }}>kg</span></span>
                      ) : c.grossKg ? (
                        <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>{c.grossKg.toLocaleString('vi-VN')} <span style={{ color: 'var(--color-text-tertiary)' }}>kg vào</span></span>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </Td>
                    <Td><StatusBadge statusId={c.status} /></Td>
                    <Td align="right">
                      <span className="mono" style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{fmtTime(c.createdAt)}</span>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px' }}>
                    <EmptyState
                      icon="truck"
                      message="Không có lượt cân nào khớp với bộ lọc hiện tại."
                      action="Xóa bộ lọc"
                      onAction={() => { setFilter('all'); setQ(''); }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--color-text-secondary)',
        }}>
          <span>
            Hiển thị <span className="mono" style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</span>{' '}
            trên <span className="mono" style={{ color: 'var(--color-text-primary)' }}>{CARGO.length}</span> lượt cân
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button size="sm" variant="secondary" icon="chevron-left">Trước</Button>
            <span className="mono" style={{ fontSize: 12 }}>1 / 1</span>
            <Button size="sm" variant="secondary" iconRight="chevron-right">Sau</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Cargo detail ─────────────────────────────────────────────────────────────

interface ScreenCargoDetailProps {
  cargo: MockCargoRow;
  onBack: () => void;
  onNav: (id: string) => void;
}

export function ScreenCargoDetail({ cargo, onBack, onNav }: ScreenCargoDetailProps) {
  const [tab, setTab] = useState('overview');
  const net = cargo.grossKg && cargo.tareKg ? cargo.grossKg - cargo.tareKg : null;

  return (
    <div data-screen-label="cargo-detail" style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          Xe hàng
        </button>
        <Icon name="chevron-right" size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        <span className="mono" style={{ color: 'var(--color-text-primary)' }}>{cargo.plate}</span>
      </div>

      {/* Summary header card */}
      <Card padding={16} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Lượt cân · <span className="mono">{cargo.id}</span></div>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4, lineHeight: 1.2 }} className="mono">{cargo.plate}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <StatusBadge statusId={cargo.status} />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{cargo.material}</span>
            </div>
          </div>
          <SummaryStat label="Tài xế"        value={cargo.driver}                              sub={<span className="mono" style={{ fontSize: 11 }}>{cargo.driverId}</span>} />
          <SummaryStat label="Cân vào"        value={cargo.weighIn  ? fmtTime(cargo.weighIn)  : '—'} mono sub={cargo.weighIn  ? <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{cargo.grossKg?.toLocaleString('vi-VN')} kg</span> : null} />
          <SummaryStat label="Cân ra"         value={cargo.weighOut ? fmtTime(cargo.weighOut) : '—'} mono sub={cargo.weighOut ? <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{cargo.tareKg?.toLocaleString('vi-VN')} kg</span> : null} />
          <SummaryStat label="Khối lượng tịnh" value={net !== null ? `${net.toLocaleString('vi-VN')} kg` : '—'} accent mono />
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
            <Button icon="printer"        variant="secondary">In phiếu</Button>
            <Button icon="pencil"         variant="secondary">Sửa</Button>
            <Button icon="more-horizontal" variant="ghost" />
          </div>
        </div>
      </Card>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Tổng quan',              icon: 'layout-grid'  },
          { id: 'weighing', label: 'Cân hàng',               icon: 'scale',        count: cargo.status === 'completed' ? 2 : cargo.weighIn ? 1 : 0 },
          { id: 'photos',   label: 'Hình ảnh',               icon: 'image',        count: cargo.status === 'completed' ? 8 : 3 },
          { id: 'monitor',  label: 'Giám sát & hoàn thành',  icon: 'shield-check' },
        ]}
      />

      <div style={{ marginTop: 20 }}>
        {tab === 'overview' && <CargoOverview cargo={cargo} />}
        {tab === 'weighing' && <CargoWeighing cargo={cargo} onNav={onNav} />}
        {tab === 'photos'   && <CargoPhotos   cargo={cargo} />}
        {tab === 'monitor'  && <CargoMonitor  cargo={cargo} />}
      </div>
    </div>
  );
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

interface SummaryStatProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  mono?: boolean;
  accent?: boolean;
}

function SummaryStat({ label, value, sub, mono, accent }: SummaryStatProps) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{
        fontSize: 16, fontWeight: 500,
        color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
        marginTop: 2, lineHeight: 1.25,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Cargo overview tab ───────────────────────────────────────────────────────

function CargoOverview({ cargo }: { cargo: MockCargoRow }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
      <Card title="Thông tin lượt cân">
        <Row label="Mã lượt cân"><span className="mono">{cargo.id}</span></Row>
        <Row label="Biển số xe"><span className="mono">{cargo.plate}</span></Row>
        <Row label="Tài xế">
          {cargo.driver}
          <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>{cargo.driverId}</span>
        </Row>
        <Row label="Nguyên liệu">{cargo.material}</Row>
        <Row label="Nhà cung cấp chính">{cargo.supplier}</Row>
        {cargo.secondarySuppliers > 0 && (
          <Row label="Nhà cung cấp phụ">
            <Badge tone="info">{cargo.secondarySuppliers} đơn vị</Badge>
          </Row>
        )}
        <Row label="Lô rừng"><span className="mono">{cargo.plot}</span></Row>
        <Row label="Trạng thái"><StatusBadge statusId={cargo.status} /></Row>
        <Row label="Tạo lúc" last>
          <span className="mono">{fmtDateTime(cargo.createdAt)}</span>
        </Row>
      </Card>
      <Card title="Dòng thời gian">
        <Timeline cargo={cargo} />
      </Card>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ cargo }: { cargo: MockCargoRow }) {
  const events = [
    { t: cargo.createdAt,  label: 'Tạo lượt cân', icon: 'plus',        done: true },
    { t: cargo.weighIn,    label: 'Cân vào',       icon: 'scale',       done: !!cargo.weighIn },
    { t: cargo.weighIn ? new Date(cargo.weighIn.getTime() + 25 * 60000) : null, label: 'Kiểm tra QC', icon: 'shield-check', done: cargo.status === 'completed' || cargo.status === 'inProgress' },
    { t: cargo.weighOut,   label: 'Cân ra',        icon: 'scale-3d',    done: !!cargo.weighOut },
    { t: cargo.weighOut ? new Date(cargo.weighOut.getTime() + 5 * 60000) : null, label: 'Hoàn tất', icon: 'check', done: cargo.status === 'completed' },
  ];
  return (
    <div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
          <div style={{ position: 'relative', width: 24, flexShrink: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: e.done ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
              color: e.done ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              border: `1px solid ${e.done ? 'var(--color-accent)' : 'var(--color-border)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={e.icon} size={11} />
            </div>
            {i < events.length - 1 && (
              <div style={{
                position: 'absolute', left: 11, top: 24, width: 2, height: 16,
                background: e.done ? 'var(--color-accent)' : 'var(--color-border)',
                opacity: e.done ? 0.3 : 1,
              }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: e.done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>{e.label}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {e.t ? fmtDateTime(e.t) : 'Chưa thực hiện'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Weighing tab ─────────────────────────────────────────────────────────────

function CargoWeighing({ cargo, onNav }: { cargo: MockCargoRow; onNav: (id: string) => void }) {
  if (!cargo.weighIn) {
    return (
      <Card padding={40}>
        <EmptyState icon="scale" message="Chưa có lần cân nào cho lượt này." action="Tạo phiếu cân" onAction={() => onNav('weighing')} />
      </Card>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      <WeighCard label="Cân vào" time={cargo.weighIn}  weight={cargo.grossKg} status={cargo.weighIn  ? 'done' : 'pending'} />
      <WeighCard label="Cân ra"  time={cargo.weighOut} weight={cargo.tareKg}  status={cargo.weighOut ? 'done' : 'pending'} />
      <Card padding={16} style={{ borderColor: cargo.weighOut ? 'var(--color-accent)' : 'var(--color-border)' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Khối lượng tịnh</div>
        {cargo.weighOut ? (
          <>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 8, color: 'var(--color-accent)' }}>
              {(cargo.grossKg! - cargo.tareKg!).toLocaleString('vi-VN')} <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>kg</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {cargo.grossKg!.toLocaleString('vi-VN')} − {cargo.tareKg!.toLocaleString('vi-VN')}
            </div>
          </>
        ) : (
          <>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 8, color: 'var(--color-text-tertiary)' }}>
              — <span style={{ fontSize: 14 }}>kg</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Chờ cân ra để tính khối lượng tịnh</div>
          </>
        )}
      </Card>
    </div>
  );
}

function WeighCard({ label, time, weight, status }: { label: string; time: Date | null; weight: number | null; status: 'done' | 'pending' }) {
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</div>
        {status === 'done' ? <Badge tone="success" dot>Đã ghi</Badge> : <Badge tone="warning" dot>Chờ</Badge>}
      </div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 500, color: weight ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
        {weight ? weight.toLocaleString('vi-VN') : '—'} <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>kg</span>
      </div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
        {time ? fmtDateTime(time) : 'Chưa cân'}
      </div>
      <div style={{
        marginTop: 12, padding: 12,
        background: 'var(--color-bg-subtle)', borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, color: 'var(--color-text-secondary)',
      }}>
        <Icon name={weight ? 'image-down' : 'image'} size={14} />
        <span>{weight ? 'Ảnh đồng hồ cân (1)' : 'Chưa có ảnh đồng hồ'}</span>
      </div>
    </Card>
  );
}

// ─── Photos tab ───────────────────────────────────────────────────────────────

function CargoPhotos({ cargo }: { cargo: MockCargoRow }) {
  const groups = [
    { name: 'Ảnh xe vào',         count: 3,                                          icon: 'log-in'  },
    { name: 'Ảnh đồng hồ cân',    count: cargo.status === 'completed' ? 2 : 1,       icon: 'scale'   },
    { name: 'Ảnh nguyên liệu',    count: cargo.status === 'completed' ? 2 : 0,       icon: 'package' },
    { name: 'Ảnh xe ra',          count: cargo.status === 'completed' ? 1 : 0,       icon: 'log-out' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map(g => (
        <div key={g.name}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={g.icon} size={14} style={{ color: 'var(--color-text-secondary)' }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>{g.name}</div>
              <Badge tone="neutral">{g.count}</Badge>
            </div>
            <Button size="sm" variant="ghost" icon="upload">Thêm ảnh</Button>
          </div>
          {g.count > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {Array.from({ length: g.count }).map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '4 / 3', borderRadius: 8,
                  background: 'repeating-linear-gradient(135deg, var(--color-bg-subtle) 0 6px, var(--color-bg-surface) 6px 12px)',
                  border: '1px solid var(--color-border)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <Icon name="image" size={20} />
                  </div>
                  <div className="mono" style={{
                    position: 'absolute', bottom: 6, left: 6,
                    fontSize: 10, color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-surface)', padding: '1px 5px', borderRadius: 4,
                    border: '1px solid var(--color-border)',
                  }}>
                    {fmtTime(new Date(cargo.createdAt.getTime() + i * 5 * 60000))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '20px', textAlign: 'center',
              border: '1px dashed var(--color-border)', borderRadius: 8,
              color: 'var(--color-text-tertiary)', fontSize: 13,
            }}>Chưa có ảnh trong nhóm này.</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Monitor tab ──────────────────────────────────────────────────────────────

function CargoMonitor({ cargo }: { cargo: MockCargoRow }) {
  const checks = [
    { label: 'Giấy tờ rừng đầy đủ',        ok: true,                            by: 'Lê Thị Hồng',     t: cargo.createdAt },
    { label: 'Khối lượng cân khớp phiếu',   ok: cargo.status === 'completed',   by: 'Hệ thống',         t: cargo.weighOut  },
    { label: 'Nguyên liệu đúng loại',       ok: cargo.status !== 'cancelled',   by: 'Nguyễn Văn Đức',   t: cargo.weighIn   },
    { label: 'Ảnh đồng hồ cân rõ nét',     ok: true,                            by: 'Hệ thống',         t: cargo.weighIn   },
    { label: 'Tài xế ký xác nhận',         ok: cargo.status === 'completed',   by: cargo.driver,       t: cargo.weighOut  },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
      <Card title="Danh sách kiểm tra hoàn tất">
        {checks.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderBottom: i < checks.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: c.ok ? 'var(--color-success-subtle)' : 'var(--color-bg-subtle)',
              color: c.ok ? 'var(--color-success-strong)' : 'var(--color-text-tertiary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${c.ok ? 'var(--color-success)' : 'var(--color-border)'}`,
            }}>
              <Icon name={c.ok ? 'check' : 'minus'} size={12} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: c.ok ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{c.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {c.ok ? `Bởi ${c.by}` : 'Đang chờ'}
                {c.ok && c.t && <span className="mono"> · {fmtTime(c.t)}</span>}
              </div>
            </div>
          </div>
        ))}
      </Card>
      <Card title="Kết luận giám sát">
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {cargo.status === 'completed' ? (
            <>Lượt cân đã được kiểm tra đầy đủ. Khối lượng và nguyên liệu khớp với phiếu đăng ký. Hồ sơ rừng nguồn gốc hợp lệ.</>
          ) : cargo.status === 'cancelled' ? (
            <>Lượt cân đã bị hủy. Lý do: <span style={{ color: 'var(--color-danger)' }}>Thiếu giấy tờ hồ sơ rừng nguồn gốc</span>.</>
          ) : (
            <>Đang chờ hoàn tất các bước kiểm tra trước khi đóng lượt cân.</>
          )}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {cargo.status === 'inProgress' && <Button variant="primary"    icon="check">Hoàn tất lượt cân</Button>}
          {cargo.status === 'inProgress' && <Button variant="secondary"  icon="x">Hủy lượt</Button>}
          {cargo.status === 'completed'  && <Button variant="secondary"  icon="download">Tải biên bản PDF</Button>}
          {cargo.status === 'cancelled'  && <Button variant="secondary"  icon="rotate-ccw">Khôi phục lượt</Button>}
        </div>
      </Card>
    </div>
  );
}
