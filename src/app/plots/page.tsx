'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Wrapper } from '@googlemaps/react-wrapper';
import {
  Search, List, Map as MapIcon, ChevronRight, X,
  AlertTriangle, CheckCircle, AlertCircle,
  Trees, MapPin, ExternalLink,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { plotApi } from '@/lib/api-client';
import { fmtDate } from '@/lib/fmt';
import type { PlotRegistry, DeforestationRiskStatus } from '@/types/index';

// ─── Risk helpers ─────────────────────────────────────────────────────────────

const RISK_LABEL: Record<DeforestationRiskStatus, string> = {
  'Thấp':           'Rủi ro thấp',
  'Trung bình':     'Rủi ro vừa',
  'Cao':            'Rủi ro cao',
  'Chưa đánh giá':  'Chưa đánh giá',
};

const RISK_TONE: Record<DeforestationRiskStatus, 'success' | 'warning' | 'danger'> = {
  'Thấp':           'success',
  'Trung bình':     'warning',
  'Cao':            'danger',
  'Chưa đánh giá':  'success',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'duoi4ha' | 'tren4ha' | string; // string covers province names
type ViewMode  = 'list' | 'map';

export default function PlotsPage() {
  const router = useRouter();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const { data: plots = [], isLoading: loading } = useQuery({
    queryKey: ['plots', activePlantId],
    queryFn: () => plotApi.list(activePlantId),
  });
  const [search,    setSearch]    = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [view,      setView]      = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Unique sorted province names derived from data
  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const p of plots) if (p.province) set.add(p.province);
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [plots]);

  const filtered = useMemo(() => {
    let rows = [...plots];
    if (filterKey === 'duoi4ha')      rows = rows.filter(p => p.AreaHa < 4);
    else if (filterKey === 'tren4ha') rows = rows.filter(p => p.AreaHa >= 4);
    else if (filterKey !== 'all')     rows = rows.filter(p => p.province === filterKey);
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
  }, [plots, filterKey, search]);

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
            <ViewBtn active={view === 'map'}  onClick={() => setView('map')}  icon={<MapIcon size={13} strokeWidth={1.75} />} label="Bản đồ"    />
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
        {/* Tất cả */}
        <FilterChipNew label="Tất cả" count={plots.length} active={filterKey === 'all'} onClick={() => setFilterKey('all')} />
        {/* Provinces */}
        {provinces.map(p => (
          <FilterChipNew key={p} label={p.replace('Tỉnh ', '').replace('Thành phố ', 'TP ')} count={plots.filter(pl => pl.province === p).length} active={filterKey === p} onClick={() => setFilterKey(p)} />
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        {/* Area */}
        <FilterChipNew label="Dưới 4 ha" count={plots.filter(p => p.AreaHa < 4).length} active={filterKey === 'duoi4ha'} onClick={() => setFilterKey('duoi4ha')} />
        <FilterChipNew label="Trên 4 ha" count={plots.filter(p => p.AreaHa >= 4).length} active={filterKey === 'tren4ha'} onClick={() => setFilterKey('tren4ha')} />
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
  riskKey: string; count: number; active: boolean; onClick: () => void;
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

function FilterChipNew({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 28, padding: '0 10px',
      borderRadius: 'var(--radius-full)',
      border: active ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-border)',
      background: active ? 'var(--color-accent-subtle)' : 'transparent',
      color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-sm)', fontWeight: active ? 500 : 400,
      cursor: 'pointer',
      transition: 'all var(--duration-fast) var(--ease-out)',
      whiteSpace: 'nowrap',
    }}>
      {label}
      <span style={{ fontSize: 11, fontWeight: 500, color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
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
            <Th flex>Tên</Th>
            <Th width={160}>Xã – Tỉnh</Th>
            <Th align="right" width={90}>Diện tích</Th>
            <Th width={110}>Loài cây</Th>
            <Th width={150}>Rủi ro phá rừng</Th>
            <Th width={110} align="right">Ngày xác minh</Th>
            <Th width={170}>Toạ độ</Th>
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
        <div style={{ color: 'var(--color-text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {p.LandTitle || '—'}
        </div>
      </Td>
      <Td>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 12 }}>{p.commune ?? '—'}</div>
        {p.province && (
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
            {p.province.replace('Tỉnh ', '').replace('Thành phố ', 'TP ')}
          </div>
        )}
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
      <Td align="right">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
          {fmtDate(p.created_at) || '—'}
        </span>
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

// ─── Plots map (Google Maps) ───────────────────────────────────────────────────

const RISK_PIN_COLOR: Record<DeforestationRiskStatus, string> = {
  'Thấp':      '#22c55e',
  'Trung bình': '#f59e0b',
  'Cao':        '#ef4444',
  'Chưa đánh giá': '#6b7280',
};

function makePinSvg(color: string, selected: boolean): string {
  const size = selected ? 14 : 10;
  const stroke = selected ? 'white' : 'rgba(0,0,0,0.3)';
  const sw = selected ? 2 : 1;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size*2}" height="${size*2}" viewBox="0 0 ${size*2} ${size*2}">
      <circle cx="${size}" cy="${size}" r="${size - sw}" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>
    </svg>`
  )}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type GMap = any;
type GMarker = any;

function GoogleMapView({ plots, selectedId, onSelect, onOpen }: {
  plots: PlotRegistry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gmap = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef(new Map() as Map<string, any>);
  const validPlots = plots.filter(p => p.lat != null && p.lng != null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const G = (): any => (window as any).google?.maps;

  // Init map
  useEffect(() => {
    if (!mapRef.current || gmap.current) return;
    gmap.current = new (G().Map)(mapRef.current, {
      zoom: 8,
      center: { lat: 11.0, lng: 106.7 },
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
  }, []);

  // Sync markers whenever plots or selection changes
  useEffect(() => {
    if (!gmap.current) return;
    const map = gmap.current;
    const g = G();
    const currentIds = new Set(validPlots.map(p => p.PlotID));

    // Remove stale markers
    markers.current.forEach((m, id) => {
      if (!currentIds.has(id)) { m.setMap(null); markers.current.delete(id); }
    });

    // Add/update markers
    validPlots.forEach(p => {
      const color = RISK_PIN_COLOR[p.DeforestationRiskStatus] ?? '#6b7280';
      const isSelected = p.PlotID === selectedId;
      const sz = isSelected ? 28 : 20;
      const icon = {
        url: makePinSvg(color, isSelected),
        scaledSize: new g.Size(sz, sz),
        anchor: new g.Point(sz / 2, sz / 2),
      };

      let marker = markers.current.get(p.PlotID);
      if (!marker) {
        marker = new g.Marker({
          position: { lat: p.lat!, lng: p.lng! },
          map,
          title: `${p.PlotID} — ${p.TreeSpecies} — ${p.AreaHa} ha`,
          icon,
        });
        marker.addListener('click', () => onSelect(p.PlotID));
        marker.addListener('dblclick', () => onOpen(p.PlotID));
        markers.current.set(p.PlotID, marker);
      } else {
        marker.setIcon(icon);
      }
    });

    // Fit bounds on first load
    if (validPlots.length > 0 && markers.current.size === validPlots.length) {
      const bounds = new g.LatLngBounds();
      validPlots.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
      map.fitBounds(bounds, 60);
    }
  }, [validPlots, selectedId, onSelect, onOpen]);

  return (
    <div style={{ position: 'relative', height: 500 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 28, left: 12, zIndex: 1,
        padding: '10px 12px', borderRadius: 'var(--radius-md)',
        background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: 12,
      }}>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 6, fontWeight: 600 }}>Rủi ro phá rừng</div>
        {(['Thấp', 'Trung bình', 'Cao', 'Chưa đánh giá'] as DeforestationRiskStatus[]).map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_PIN_COLOR[r], flexShrink: 0 }} />
            <span style={{ color: '#444' }}>{RISK_LABEL[r] ?? r}</span>
          </div>
        ))}
      </div>

      {validPlots.length < plots.length && (
        <div style={{
          position: 'absolute', bottom: 28, right: 12, zIndex: 1,
          fontSize: 11, color: '#666', background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        }}>
          {plots.length - validPlots.length} lô chưa có toạ độ
        </div>
      )}
    </div>
  );
}

function PlotsMap({ plots, selectedId, onSelect, onOpen }: {
  plots: PlotRegistry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  return (
    <Wrapper apiKey={apiKey} version="weekly">
      <GoogleMapView plots={plots} selectedId={selectedId} onSelect={onSelect} onOpen={onOpen} />
    </Wrapper>
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
