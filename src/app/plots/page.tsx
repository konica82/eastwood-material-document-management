'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Search, List, Map, ChevronRight, X,
  AlertTriangle, CheckCircle, AlertCircle,
  Trees, MapPin, ExternalLink,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { plotApi } from '@/lib/api-client';
import { fmtDate } from '@/lib/fmt';
import type { PlotRegistry, DeforestationRiskStatus } from '@/types/index';

// ─── Risk helpers ─────────────────────────────────────────────────────────────

const RISK_LABEL: Record<DeforestationRiskStatus, string> = {
  'Thấp':      'Rủi ro thấp',
  'Trung bình':'Rủi ro vừa',
  'Cao':       'Rủi ro cao',
};

const RISK_TONE: Record<DeforestationRiskStatus, 'success' | 'warning' | 'danger'> = {
  'Thấp':      'success',
  'Trung bình':'warning',
  'Cao':       'danger',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type RiskFilter = 'all' | DeforestationRiskStatus;
type ViewMode   = 'list' | 'map';

export default function PlotsPage() {
  const router = useRouter();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const { data: plots = [], isLoading: loading } = useQuery({
    queryKey: ['plots', activePlantId],
    queryFn: () => plotApi.list(activePlantId),
  });
  const [search,     setSearch]     = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [view,       setView]       = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: plots.length };
    for (const p of plots) m[p.DeforestationRiskStatus] = (m[p.DeforestationRiskStatus] ?? 0) + 1;
    return m;
  }, [plots]);

  const filtered = useMemo(() => {
    let rows = [...plots];
    if (riskFilter !== 'all') rows = rows.filter(p => p.DeforestationRiskStatus === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        p.PlotID.toLowerCase().includes(q) ||
        (p.commune ?? '').toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q) ||
        p.TreeSpecies.toLowerCase().includes(q) ||
        p.LandTitle.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [plots, riskFilter, search]);

  const selected = useMemo(
    () => plots.find(p => p.PlotID === selectedId) ?? null,
    [plots, selectedId],
  );

  function openDetail(id: string) {
    router.push(`/plots/${id}`);
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Hồ sơ rừng</div>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
            Đăng ký lô rừng
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{
            display: 'inline-flex', padding: 2,
            background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <ViewBtn active={view === 'list'} onClick={() => setView('list')} icon={<List   size={13} strokeWidth={1.75} />} label="Danh sách" />
            <ViewBtn active={view === 'map'}  onClick={() => setView('map')}  icon={<Map    size={13} strokeWidth={1.75} />} label="Bản đồ"    />
          </div>
          {canEdit && (
            <button style={primBtnStyle} disabled title="Chức năng tạo mới có trong AppSheet">
              Đăng ký lô rừng
            </button>
          )}
        </div>
      </div>

      {/* ── Filter row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Tìm theo mã, loài cây, địa điểm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 32, width: 280, paddingLeft: 28, paddingRight: 10,
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)', outline: 'none',
            }}
          />
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        {(['all', 'Thấp', 'Trung bình', 'Cao'] as RiskFilter[]).map(key => (
          <RiskChip
            key={key}
            riskKey={key}
            count={counts[key] ?? 0}
            active={riskFilter === key}
            onClick={() => setRiskFilter(key)}
          />
        ))}
      </div>

      {/* ── Content area ── */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 12, alignItems: 'start' }}>
          {/* Table / Map */}
          <div style={{
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
            background: 'var(--color-bg-surface)', overflow: 'hidden',
          }}>
            {view === 'list' ? (
              <PlotsTable
                plots={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={openDetail}
              />
            ) : (
              <PlotsMap
                plots={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={openDetail}
              />
            )}
          </div>

          {/* Side panel */}
          {selected && (
            <SidePanel
              plot={selected}
              onClose={() => setSelectedId(null)}
              onOpen={openDetail}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── View toggle button ───────────────────────────────────────────────────────

function ViewBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 28, padding: '0 10px',
      background: active ? 'var(--color-bg-surface)' : 'transparent',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-border)' : '1px solid transparent',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--font-size-sm)', fontWeight: active ? 500 : 400,
      cursor: 'pointer',
      transition: 'all var(--duration-fast) var(--ease-out)',
    }}>
      {icon}
      {label}
    </button>
  );
}

// ─── Risk filter chip ─────────────────────────────────────────────────────────

function RiskChip({ riskKey, count, active, onClick }: {
  riskKey: RiskFilter; count: number; active: boolean; onClick: () => void;
}) {
  const label = riskKey === 'all' ? 'Tất cả' : RISK_LABEL[riskKey as DeforestationRiskStatus];
  const tone  = riskKey === 'all' ? null : RISK_TONE[riskKey as DeforestationRiskStatus];

  const fg     = tone ? `var(--color-${tone})` : 'var(--color-accent)';
  const bg     = tone ? `var(--color-${tone}-subtle)` : 'var(--color-accent-subtle)';
  const border = tone ? `var(--color-${tone})` : 'var(--color-accent)';

  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 28, padding: '0 10px',
      borderRadius: 'var(--radius-full)',
      border: active ? `1.5px solid ${border}` : '1.5px solid var(--color-border)',
      background: active ? bg : 'transparent',
      color: active ? fg : 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-sm)', fontWeight: active ? 500 : 400,
      cursor: 'pointer',
      transition: 'all var(--duration-fast) var(--ease-out)',
      whiteSpace: 'nowrap',
    }}>
      {tone && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? fg : 'var(--color-text-tertiary)', flexShrink: 0 }} />
      )}
      {label}
      <span style={{ fontSize: 11, fontWeight: 500, color: active ? fg : 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        {count}
      </span>
    </button>
  );
}

// ─── Plots table ──────────────────────────────────────────────────────────────

function PlotsTable({ plots, selectedId, onSelect, onOpen }: {
  plots: PlotRegistry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--color-table-header-bg)' }}>
            <Th width={130}>Mã hồ sơ</Th>
            <Th flex>Chủ rừng</Th>
            <Th width={180}>Xã / Huyện</Th>
            <Th align="right" width={100}>Diện tích</Th>
            <Th width={130}>Loài cây</Th>
            <Th width={150}>Rủi ro phá rừng</Th>
            <Th width={180}>Toạ độ</Th>
            <Th width={48} />
          </tr>
        </thead>
        <tbody>
          {plots.map(p => (
            <PlotsTableRow
              key={p.PlotID}
              plot={p}
              selected={p.PlotID === selectedId}
              onSelect={() => onSelect(p.PlotID)}
              onOpen={() => onOpen(p.PlotID)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlotsTableRow({ plot: p, selected, onSelect, onOpen }: {
  plot: PlotRegistry;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tone = RISK_TONE[p.DeforestationRiskStatus];
  const coords = p.lat != null && p.lng != null
    ? `${p.lat.toFixed(4)}° B, ${p.lng.toFixed(4)}° Đ`
    : '—';

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      onDoubleClick={onOpen}
      style={{
        borderTop: '1px solid var(--color-border)',
        background: selected
          ? 'var(--color-accent-subtle)'
          : hovered ? 'var(--color-bg-subtle)' : 'transparent',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <Td>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: selected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
          {p.PlotID}
        </span>
      </Td>
      <Td>
        <div style={{ color: 'var(--color-text-primary)' }}>
          {p.owners?.[0]?.ten ?? (p.commune ?? '—')}
        </div>
        {p.commune && (
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
            {p.commune}
          </div>
        )}
      </Td>
      <Td>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {p.district ?? '—'}{p.province ? `, ${p.province}` : ''}
        </span>
      </Td>
      <Td align="right">
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {p.AreaHa.toFixed(1)}{' '}
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>ha</span>
        </span>
      </Td>
      <Td>{p.TreeSpecies}</Td>
      <Td>
        <RiskBadge status={p.DeforestationRiskStatus} tone={tone} dot />
      </Td>
      <Td>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {coords}
        </span>
      </Td>
      <Td align="right">
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          title="Mở chi tiết"
          style={{
            width: 28, height: 28, padding: 0,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} strokeWidth={1.75} />
        </button>
      </Td>
    </tr>
  );
}

// ─── Plots map (SVG) ──────────────────────────────────────────────────────────

const SVG_W = 800;
const SVG_H = 460;
const SVG_PAD = 50;

function projectPlot(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const x = SVG_PAD + ((lng - bounds.minLng) / lngRange) * (SVG_W - 2 * SVG_PAD);
  const y = (SVG_H - SVG_PAD) - ((lat - bounds.minLat) / latRange) * (SVG_H - 2 * SVG_PAD);
  return { x, y };
}

function PlotsMap({ plots, selectedId, onSelect, onOpen }: {
  plots: PlotRegistry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const validPlots = plots.filter(p => p.lat != null && p.lng != null);

  const bounds = useMemo(() => {
    if (!validPlots.length) return { minLat: 10, maxLat: 25, minLng: 100, maxLng: 115 };
    const lats = validPlots.map(p => p.lat!);
    const lngs = validPlots.map(p => p.lng!);
    const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.15 || 0.1;
    const padLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.15 || 0.1;
    return {
      minLat: Math.min(...lats) - padLat,
      maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng,
      maxLng: Math.max(...lngs) + padLng,
    };
  }, [validPlots]);

  return (
    <div style={{ position: 'relative', height: 500 }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={SVG_W} height={SVG_H} fill="var(--color-bg-subtle)" />
        <rect width={SVG_W} height={SVG_H} fill="url(#map-grid)" />

        {validPlots.map(p => {
          const { x, y } = projectPlot(p.lat!, p.lng!, bounds);
          const tone = RISK_TONE[p.DeforestationRiskStatus];
          const isSelected = p.PlotID === selectedId;
          const r = Math.max(14, Math.min(28, Math.sqrt(p.AreaHa) * 5));

          return (
            <g
              key={p.PlotID}
              onClick={() => onSelect(p.PlotID)}
              onDoubleClick={() => onOpen(p.PlotID)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x} cy={y} r={r}
                fill={`var(--color-${tone}-subtle)`}
                fillOpacity={isSelected ? 0.95 : 0.7}
                stroke={`var(--color-${tone})`}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={x} y={y + 4}
                fontSize="9"
                fill={`var(--color-${tone})`}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                style={{ pointerEvents: 'none', fontWeight: isSelected ? 700 : 400 }}
              >
                {p.PlotID.replace('PLT-', '')}
              </text>
              <title>{p.PlotID} — {p.TreeSpecies} — {p.AreaHa} ha</title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        padding: '10px 12px', borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
        fontSize: 12,
      }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6, fontWeight: 500 }}>
          Rủi ro phá rừng
        </div>
        {(['Thấp', 'Trung bình', 'Cao'] as DeforestationRiskStatus[]).map(r => {
          const tone = RISK_TONE[r];
          return (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: `var(--color-${tone}-subtle)`, border: `1.5px solid var(--color-${tone})`, flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{RISK_LABEL[r]}</span>
            </div>
          );
        })}
      </div>

      {validPlots.length < plots.length && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          fontSize: 11, color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        }}>
          {plots.length - validPlots.length} lô chưa có toạ độ
        </div>
      )}
    </div>
  );
}

// ─── Side panel ───────────────────────────────────────────────────────────────

function SidePanel({ plot: p, onClose, onOpen }: {
  plot: PlotRegistry;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const tone = RISK_TONE[p.DeforestationRiskStatus];
  const coords = p.lat != null && p.lng != null
    ? `${p.lat.toFixed(4)}° B, ${p.lng.toFixed(4)}° Đ`
    : null;

  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-surface)', overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Lô rừng</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {p.PlotID}
          </div>
        </div>
        <button onClick={onClose} style={{ ...iconBtnStyle, marginTop: 2 }}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PanelRow label="Loài cây">{p.TreeSpecies}</PanelRow>
        <PanelRow label="Chủ rừng">{p.commune ?? '—'}</PanelRow>
        <PanelRow label="Địa điểm">
          {[p.commune, p.district, p.province].filter(Boolean).join(', ') || '—'}
        </PanelRow>
        <PanelRow label="Diện tích">
          <span style={{ fontFamily: 'var(--font-mono)' }}>{p.AreaHa.toFixed(2)} ha</span>
        </PanelRow>
        {coords && (
          <PanelRow label="Toạ độ">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{coords}</span>
          </PanelRow>
        )}
        <PanelRow label="Rủi ro" last>
          <RiskBadge status={p.DeforestationRiskStatus} tone={tone} dot />
        </PanelRow>

        {/* Mini stats */}
        <div style={{ marginTop: 4, padding: 12, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Khối lượng đã giao</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {p.ActualQuantityDelivered > 0
              ? `${p.ActualQuantityDelivered.toFixed(1)} tấn`
              : '—'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => onOpen(p.PlotID)} style={{ ...primBtnStyle, flex: 1, justifyContent: 'center' }}>
            <ExternalLink size={13} strokeWidth={1.75} />
            Mở chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading / empty states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-surface)', padding: 'var(--space-12)',
      textAlign: 'center', color: 'var(--color-text-tertiary)',
      fontSize: 'var(--font-size-sm)',
    }}>
      Đang tải dữ liệu lô rừng...
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-surface)', padding: 'var(--space-12)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <Trees size={36} strokeWidth={1.25} style={{ color: 'var(--color-text-tertiary)' }} />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0, textAlign: 'center' }}>
        Không tìm thấy lô rừng nào phù hợp với bộ lọc hiện tại.
      </p>
    </div>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ status, tone, dot }: {
  status: DeforestationRiskStatus;
  tone: 'success' | 'warning' | 'danger';
  dot?: boolean;
}) {
  const Icon = tone === 'success' ? CheckCircle : tone === 'warning' ? AlertCircle : AlertTriangle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 500,
      padding: '2px 8px', borderRadius: 'var(--radius-full)',
      background: `var(--color-${tone}-subtle)`,
      color: `var(--color-${tone})`,
      border: `1px solid var(--color-${tone})`,
      whiteSpace: 'nowrap',
    }}>
      {dot
        ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: `var(--color-${tone})`, flexShrink: 0 }} />
        : <Icon size={11} strokeWidth={2} />}
      {RISK_LABEL[status]}
    </span>
  );
}

// ─── Shared table primitives ──────────────────────────────────────────────────

function Th({ children, flex, align, width }: {
  children?: React.ReactNode; flex?: boolean; align?: 'right'; width?: number;
}) {
  return (
    <th style={{
      padding: '10px 14px', textAlign: align ?? 'left',
      fontSize: 'var(--font-size-xs)', fontWeight: 500,
      color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
      width: flex ? undefined : width,
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <td style={{ padding: '11px 14px', verticalAlign: 'middle', textAlign: align }}>
      {children}
    </td>
  );
}

// ─── Side panel row ───────────────────────────────────────────────────────────

function PanelRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'start',
      paddingBottom: last ? 0 : 10,
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const primBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28,
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text-secondary)',
  cursor: 'pointer', flexShrink: 0,
};
