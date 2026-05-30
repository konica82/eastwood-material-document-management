'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, Plus, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { IconTruck, IconTractor, IconTruckDelivery } from '@tabler/icons-react';
import type { VehicleType } from '@/types/index';
import { usePlant } from '@/contexts/PlantContext';
import { cargoApi } from '@/lib/api-client';
import { fmtTime } from '@/lib/fmt';
import type { Cargo, CargoStatus } from '@/types/index';

// ─── Types & constants ────────────────────────────────────────────────────────

type FilterKey = 'all' | CargoStatus;

const STATUS_FILTER_CHIPS: Array<{ key: FilterKey; label: string; tone?: 'warning' | 'info' | 'success' | 'danger' }> = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'Chờ lượt',   label: 'Chờ lượt',   tone: 'warning' },
  { key: 'Đang xử lý', label: 'Đang xử lý', tone: 'info' },
  { key: 'Hoàn thành', label: 'Hoàn thành', tone: 'success' },
  { key: 'Hủy lượt',   label: 'Hủy lượt',   tone: 'danger' },
];

const TONE_FG: Record<string, string> = {
  warning: 'var(--color-warning)',
  info:    'var(--color-info)',
  success: 'var(--color-success)',
  danger:  'var(--color-danger)',
};
const TONE_BG: Record<string, string> = {
  warning: 'var(--color-warning-subtle)',
  info:    'var(--color-info-subtle)',
  success: 'var(--color-success-subtle)',
  danger:  'var(--color-danger-subtle)',
};
const TONE_BORDER: Record<string, string> = {
  warning: 'var(--color-warning-muted)',
  info:    'var(--color-info-muted)',
  success: 'var(--color-success-muted)',
  danger:  'var(--color-danger-muted)',
};

const STATUS_COLORS: Record<CargoStatus, { bg: string; fg: string; border: string }> = {
  'Chờ lượt':   { bg: 'var(--color-warning-subtle)',  fg: 'var(--color-warning)',  border: 'var(--color-warning-muted)' },
  'Đang xử lý': { bg: 'var(--color-info-subtle)',     fg: 'var(--color-info)',     border: 'var(--color-info-muted)' },
  'Hoàn thành': { bg: 'var(--color-success-subtle)',  fg: 'var(--color-success)',  border: 'var(--color-success-muted)' },
  'Hủy lượt':   { bg: 'var(--color-danger-subtle)',   fg: 'var(--color-danger)',   border: 'var(--color-danger-muted)' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateRange(from: string, to: string) {
  const f = from.slice(5).replace('-', '/');
  const t = to.slice(5).replace('-', '/');
  return f === t ? f : `${f} – ${t}`;
}

export default function CargoPage() {
  const { activePlantId } = usePlant();
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(todayISO);
  const [dateTo,   setDateTo]   = useState(todayISO);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showDatePicker]);

  const { data: cargos = [], isLoading: loading } = useQuery({
    queryKey: ['cargo', activePlantId, dateFrom, dateTo],
    queryFn: () => cargoApi.list(activePlantId, { dateFrom, dateTo }),
  });
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' });

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: cargos.length };
    for (const c of cargos) m[c.trang_thai] = (m[c.trang_thai] ?? 0) + 1;
    return m;
  }, [cargos]);

  const filtered = useMemo(() => {
    let rows = [...cargos];
    if (filter !== 'all') rows = rows.filter(c => c.trang_thai === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(c =>
        c.so_xe.toLowerCase().includes(q) ||
        (c.tai_xe?.ten ?? '').toLowerCase().includes(q) ||
        (c.nguyen_lieu?.ten ?? '').toLowerCase().includes(q) ||
        (c.nha_cung_cap?.ten ?? '').toLowerCase().includes(q) ||
        (c.so_phieu_can ?? '').toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      let va: string = '';
      let vb: string = '';
      switch (sortBy.col) {
        case 'so_xe':      va = a.so_xe;      vb = b.so_xe;      break;
        case 'trang_thai': va = a.trang_thai; vb = b.trang_thai; break;
        default:           va = a.created_at; vb = b.created_at; break;
      }
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sortBy.dir === 'asc' ? r : -r;
    });
    return rows;
  }, [cargos, filter, search, sortBy]);

  function toggleSort(col: string) {
    setSortBy(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Xe hàng</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
            Danh sách lượt cân
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={secBtnStyle}>
            <Upload size={14} strokeWidth={1.75} />
            Nhập từ Excel
          </button>
          <button style={primBtnStyle}>
            <Plus size={14} strokeWidth={2} />
            Tạo lượt cân
          </button>
        </div>
      </div>

      {/* Table card */}
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        overflow: 'hidden',
      }}>
        {/* Filter + search row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}>
          {STATUS_FILTER_CHIPS.map(chip => (
            <FilterChip
              key={chip.key}
              active={filter === chip.key}
              label={chip.label}
              count={counts[chip.key] ?? 0}
              tone={chip.tone}
              onClick={() => setFilter(chip.key)}
            />
          ))}
          <div style={{ flex: 1, minWidth: 8 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Tìm biển số, tài xế, NCC..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  height: 32, paddingLeft: 28, paddingRight: 10,
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)', outline: 'none', width: 240,
                }}
              />
            </div>
            <div ref={datePickerRef} style={{ position: 'relative' }}>
              <button style={secBtnSmStyle} onClick={() => setShowDatePicker(v => !v)}>
                <Calendar size={13} strokeWidth={1.75} />
                {fmtDateRange(dateFrom, dateTo)}
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50,
                  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Từ ngày</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      style={{ height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Đến ngày</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      style={{ height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontSize: 13 }} />
                  </div>
                  <button onClick={() => setShowDatePicker(false)}
                    style={{ height: 32, borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                    Áp dụng
                  </button>
                </div>
              )}
            </div>
            <button style={secBtnSmStyle}>
              <SlidersHorizontal size={13} strokeWidth={1.75} />
              Bộ lọc
            </button>
          </div>
        </div>

        {/* Table or loading */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-table-header-bg)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', width: 48 }}>STT</th>
                    <SortTh col="so_xe"        sort={sortBy} onSort={toggleSort} width={140}>Biển số</SortTh>
                    <SortTh col="tai_xe"       sort={sortBy} onSort={toggleSort}>Tài xế</SortTh>
                    <SortTh col="nguyen_lieu"  sort={sortBy} onSort={toggleSort}>Nguyên liệu</SortTh>
                    <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Loại NL</th>
                    <SortTh col="nha_cung_cap" sort={sortBy} onSort={toggleSort}>Nhà cung cấp chính</SortTh>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', width: 120 }}>Khối lượng</th>
                    <SortTh col="trang_thai"  sort={sortBy} onSort={toggleSort} width={130}>Trạng thái</SortTh>
                    <SortTh col="created_at"  sort={sortBy} onSort={toggleSort} width={90} align="right">Tạo lúc</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <CargoRow key={c.id} cargo={c} isLast={i === filtered.length - 1} />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <Truck size={28} style={{ color: 'var(--color-text-tertiary)' }} />
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
                            Không có lượt cân nào khớp với bộ lọc hiện tại.
                          </p>
                          <button style={{ ...secBtnSmStyle, marginTop: 4 }} onClick={() => { setFilter('all'); setSearch(''); }}>
                            Xóa bộ lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12, color: 'var(--color-text-secondary)',
            }}>
              <span>
                Hiển thị{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{filtered.length}</span>
                {' '}trên{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{cargos.length}</span>
                {' '}lượt cân
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{ ...secBtnSmStyle, opacity: 0.5, cursor: 'default' }} disabled>
                  <ChevronLeft size={13} strokeWidth={1.75} />
                  Trước
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>1 / 1</span>
                <button style={{ ...secBtnSmStyle, opacity: 0.5, cursor: 'default' }} disabled>
                  Sau
                  <ChevronRight size={13} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Vehicle type badge ───────────────────────────────────────────────────────

const VEHICLE_CONFIG: Record<VehicleType, {
  Icon: React.ComponentType<{ size?: number; stroke?: number; style?: React.CSSProperties }>;
  label: string;
  color: string;
  bg: string;
}> = {
  'Xe tải':   { Icon: IconTruck,         label: 'Xe tải',   color: 'var(--color-text-secondary)',  bg: 'var(--color-bg-subtle)' },
  'Máy cày':  { Icon: IconTractor,       label: 'Máy cày',  color: 'var(--color-warning)',          bg: 'var(--color-warning-subtle)' },
  'Đầu kéo':  { Icon: IconTruckDelivery, label: 'Đầu kéo',  color: 'var(--color-info)',             bg: 'var(--color-info-subtle)' },
};

function VehicleTypeBadge({ type }: { type: VehicleType | null }) {
  if (!type) return null;
  const cfg = VEHICLE_CONFIG[type];
  if (!cfg) return null;
  const { Icon, label, color, bg } = cfg;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px', borderRadius: 'var(--radius-sm)',
      background: bg, marginBottom: 3,
    }}>
      <Icon size={11} stroke={1.75} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color, fontWeight: 500, lineHeight: 1 }}>{label}</span>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function CargoRow({ cargo: c, isLast }: { cargo: Cargo; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const net = c.phieu_can?.dlc_trong_luong_hang;
  const grossKg = c.phieu_can?.dlc_can_vao;
  const hasSecondary = !!c.nha_cung_cap_phu_id;
  const col = STATUS_COLORS[c.trang_thai];

  return (
    <tr
      onClick={() => router.push(`/cargo/${c.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        borderBottom: isLast ? 'none' : undefined,
        cursor: 'pointer',
        transition: 'background 100ms ease-out',
      }}
    >
      {/* STT */}
      <td style={{ ...tdStyle(), textAlign: 'center', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {c.stt_tai ?? '—'}
      </td>

      {/* Biển số + vehicle type + mooc */}
      <td style={tdStyle()}>
        <VehicleTypeBadge type={c.loai_xe} />
        <div>
          <Link
            href={`/cargo/${c.id}`}
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 13 }}
          >
            {c.so_xe}
          </Link>
        </div>
        {c.so_mooc && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
            {c.so_mooc}
          </div>
        )}
      </td>

      {/* Tài xế: name + CCCD */}
      <td style={tdStyle()}>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{c.tai_xe?.ten ?? '—'}</div>
        {c.tai_xe?.cccd && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
            {c.tai_xe.cccd}
          </div>
        )}
      </td>

      {/* Nguyên liệu */}
      <td style={tdStyle()}>{c.nguyen_lieu?.ten ?? '—'}</td>

      {/* Loại nguyên liệu */}
      <td style={{ ...tdStyle(), color: 'var(--color-text-secondary)', fontSize: 12 }}>{c.loai_nguyen_lieu ?? '—'}</td>

      {/* Nhà cung cấp: name + NCC phụ count */}
      <td style={tdStyle()}>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{c.nha_cung_cap?.ten ?? '—'}</div>
        {hasSecondary && (
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>+ 1 NCC phụ</div>
        )}
      </td>

      {/* Khối lượng — right aligned */}
      <td style={tdStyle('right')}>
        {net != null ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {net.toLocaleString('vi-VN')}{' '}
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>kg</span>
          </span>
        ) : grossKg ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {grossKg.toLocaleString('vi-VN')}{' '}
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>kg vào</span>
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
        )}
      </td>

      {/* Trạng thái */}
      <td style={tdStyle()}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 500,
          padding: '2px 8px', borderRadius: 9999,
          background: col.bg, color: col.fg, border: `1px solid ${col.border}`,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: col.fg, flexShrink: 0 }} />
          {c.trang_thai}
        </span>
      </td>

      {/* Tạo lúc — time only, right aligned */}
      <td style={tdStyle('right')}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {fmtTime(c.created_at)}
        </span>
      </td>
    </tr>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function FilterChip({ active, label, count, tone, onClick }: {
  active: boolean; label: string; count: number;
  tone?: 'warning' | 'info' | 'success' | 'danger';
  onClick: () => void;
}) {
  const fg     = tone ? TONE_FG[tone]     : 'var(--color-accent)';
  const bg     = tone ? TONE_BG[tone]     : 'var(--color-accent-subtle)';
  const border = tone ? TONE_BORDER[tone] : 'var(--color-accent)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 28, padding: '0 10px',
        borderRadius: 9999,
        border: active ? `1.5px solid ${border}` : '1.5px solid var(--color-border)',
        background: active ? bg : 'transparent',
        color: active ? fg : 'var(--color-text-secondary)',
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 100ms ease-out',
        whiteSpace: 'nowrap',
      }}
    >
      {tone && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? fg : 'var(--color-text-tertiary)', flexShrink: 0 }} />
      )}
      {label}
      <span style={{
        fontSize: 11, fontWeight: 500, minWidth: 16, textAlign: 'center',
        color: active ? fg : 'var(--color-text-tertiary)',
        background: active ? 'transparent' : 'var(--color-bg-subtle)',
        borderRadius: 9999, padding: '0 5px',
      }}>
        {count}
      </span>
    </button>
  );
}

function SortTh({ col, sort, onSort, width, align = 'left', children }: {
  col: string; sort: { col: string; dir: string }; onSort: (col: string) => void;
  width?: number; align?: 'left' | 'right'; children: React.ReactNode;
}) {
  const active = sort.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '10px 14px', textAlign: align,
        fontSize: 12, fontWeight: 500,
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap', width, cursor: 'pointer', userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {children}
        {active && <span style={{ fontSize: 10 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}

function tdStyle(align: 'left' | 'right' = 'left'): React.CSSProperties {
  return { padding: '11px 14px', verticalAlign: 'middle', textAlign: align };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const secBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
};

const primBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const secBtnSmStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  height: 30, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)',
  fontSize: 12, cursor: 'pointer',
};
