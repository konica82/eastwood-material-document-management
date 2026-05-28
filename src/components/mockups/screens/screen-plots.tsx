'use client';

// Plot registry: list + map toggle

import React, { useState } from 'react';
import { PLOTS, RISK, MockPlot } from '../data';
import { Icon, Badge, Button, IconButton, Card, Th, Td, Row } from '../ui';

interface ScreenPlotsProps {
  onOpenPlot?: (plot: MockPlot) => void;
}

export function ScreenPlots({ onOpenPlot }: ScreenPlotsProps) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selected, setSelected] = useState<MockPlot | null>(null);

  return (
    <div data-screen-label="plots" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Hồ sơ rừng</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>Đăng ký lô rừng</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', padding: 2,
            background: 'var(--color-bg-subtle)', borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}>
            <ViewBtn icon="list" label="Danh sách" active={view === 'list'} onClick={() => setView('list')} />
            <ViewBtn icon="map"  label="Bản đồ"    active={view === 'map'}  onClick={() => setView('map')} />
          </div>
          <Button icon="plus" variant="primary">Đăng ký lô rừng</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 12 }}>
        <Card padding={0}>
          {view === 'list' ? (
            <PlotsTable selected={selected} onSelect={setSelected} onOpenPlot={onOpenPlot} />
          ) : (
            <PlotsMap selected={selected} onSelect={setSelected} />
          )}
        </Card>
        {selected && (
          <PlotPanel plot={selected} onClose={() => setSelected(null)} onOpenPlot={onOpenPlot} />
        )}
      </div>
    </div>
  );
}

// ─── View toggle button ───────────────────────────────────────────────────────

function ViewBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 28, padding: '0 10px',
      background: active ? 'var(--color-bg-surface)' : 'transparent',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-border)' : '1px solid transparent',
      borderRadius: 6,
      fontSize: 13, fontWeight: active ? 500 : 400,
      cursor: 'pointer',
    }}>
      <Icon name={icon} size={13} />
      {label}
    </button>
  );
}

// ─── Plots table ──────────────────────────────────────────────────────────────

function PlotsTable({
  selected, onSelect, onOpenPlot,
}: {
  selected: MockPlot | null;
  onSelect: (p: MockPlot) => void;
  onOpenPlot?: (p: MockPlot) => void;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 'var(--cell-fs)' }}>
      <thead>
        <tr style={{ background: 'var(--color-table-header-bg)' }}>
          <Th width={140}>Mã hồ sơ</Th>
          <Th flex>Chủ rừng</Th>
          <Th>Xã / Huyện</Th>
          <Th align="right" width={100}>Diện tích</Th>
          <Th>Loài cây</Th>
          <Th width={130}>Rủi ro phá rừng</Th>
          <Th width={170}>Toạ độ</Th>
          <Th width={56} />
        </tr>
      </thead>
      <tbody>
        {PLOTS.map(p => {
          const isSelected = selected && selected.id === p.id;
          return (
            <tr
              key={p.id}
              onClick={() => onSelect(p)}
              onDoubleClick={() => onOpenPlot && onOpenPlot(p)}
              style={{
                cursor: 'pointer',
                background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-bg-subtle)'; }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
            >
              <Td><span className="mono" style={{ fontWeight: 500 }}>{p.id}</span></Td>
              <Td>{p.owner}</Td>
              <Td><span style={{ color: 'var(--color-text-secondary)' }}>{p.commune}</span></Td>
              <Td align="right"><span className="mono">{p.area.toFixed(1)} <span style={{ color: 'var(--color-text-tertiary)' }}>ha</span></span></Td>
              <Td>{p.species}</Td>
              <Td>
                <Badge tone={p.risk === 'low' ? 'success' : p.risk === 'medium' ? 'warning' : 'danger'} dot>
                  {RISK[p.risk].label}
                </Badge>
              </Td>
              <Td><span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{p.coords}</span></Td>
              <Td align="right">
                <button
                  onClick={e => { e.stopPropagation(); onOpenPlot && onOpenPlot(p); }}
                  title="Mở chi tiết"
                  style={{
                    width: 28, height: 28, padding: 0, borderRadius: 4,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  <Icon name="chevron-right" size={14} />
                </button>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Plots map ────────────────────────────────────────────────────────────────

const MAP_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  'KH-2024-03': { x: 30,  y: 25,  w: 70,  h: 55  },
  'KH-2024-08': { x: 140, y: 50,  w: 50,  h: 50  },
  'KH-2024-12': { x: 230, y: 120, w: 95,  h: 70  },
  'KH-2024-17': { x: 380, y: 70,  w: 55,  h: 80  },
  'KH-2024-21': { x: 470, y: 180, w: 75,  h: 60  },
  'KH-2024-26': { x: 580, y: 80,  w: 120, h: 100 },
  'KH-2024-29': { x: 60,  y: 220, w: 50,  h: 50  },
  'KH-2024-34': { x: 200, y: 280, w: 30,  h: 30  },
};

function PlotsMap({ selected, onSelect }: { selected: MockPlot | null; onSelect: (p: MockPlot) => void }) {
  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 240px)', minHeight: 500, overflow: 'hidden', borderRadius: 12 }}>
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="800" height="500" fill="var(--color-bg-subtle)" />
        <rect width="800" height="500" fill="url(#grid)" />
        <path d="M 0 380 Q 200 360 400 400 T 800 360" stroke="var(--color-border-strong)" strokeWidth="3" fill="none" opacity="0.5" />
        <path d="M 0 380 Q 200 360 400 400 T 800 360" stroke="var(--color-accent)"       strokeWidth="1" fill="none" opacity="0.2" />
        <path d="M 0 150 L 800 200"   stroke="var(--color-border-strong)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
        <path d="M 300 0 L 350 500"   stroke="var(--color-border-strong)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />

        {PLOTS.map(p => {
          const pos = MAP_POSITIONS[p.id];
          const color = RISK[p.risk].color;
          const isSelected = selected && selected.id === p.id;
          if (!pos) return null;
          return (
            <g key={p.id} onClick={() => onSelect(p)} style={{ cursor: 'pointer' }}>
              <rect
                x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="4"
                fill={color} fillOpacity={isSelected ? 0.4 : 0.18}
                stroke={color} strokeWidth={isSelected ? 2 : 1}
              />
              <text x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 4}
                fontSize="10" fill="var(--color-text-primary)" textAnchor="middle"
                fontFamily="JetBrains Mono" style={{ pointerEvents: 'none' }}>
                {p.id.replace('KH-2024-', '')}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6,
      }}>
        <IconButton icon="plus"   label="Phóng to"  />
        <IconButton icon="minus"  label="Thu nhỏ"   />
        <IconButton icon="locate" label="Định vị"   />
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        padding: '10px 12px', borderRadius: 8,
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
        fontSize: 12,
      }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>Rủi ro phá rừng</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(Object.entries(RISK) as [string, { label: string; color: string }][]).map(([k, r]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: r.color, opacity: 0.4, border: `1px solid ${r.color}` }} />
              <span style={{ color: 'var(--color-text-primary)' }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="mono" style={{ position: 'absolute', bottom: 6, right: 12, fontSize: 10, color: 'var(--color-text-tertiary)' }}>
        © CARTO Positron · OpenStreetMap
      </div>
    </div>
  );
}

// ─── Plot panel (side preview) ────────────────────────────────────────────────

function PlotPanel({
  plot, onClose, onOpenPlot,
}: {
  plot: MockPlot;
  onClose: () => void;
  onOpenPlot?: (p: MockPlot) => void;
}) {
  return (
    <Card padding={0} style={{ overflow: 'hidden', alignSelf: 'flex-start', animation: 'fadeIn 200ms ease-out' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Hồ sơ rừng</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>{plot.id}</div>
        </div>
        <IconButton icon="x" label="Đóng" onClick={onClose} />
      </div>
      <div style={{ padding: 16 }}>
        <Row label="Chủ rừng">{plot.owner}</Row>
        <Row label="Địa điểm">{plot.commune}</Row>
        <Row label="Loài cây">{plot.species}</Row>
        <Row label="Diện tích"><span className="mono">{plot.area.toFixed(2)} ha</span></Row>
        <Row label="Toạ độ"><span className="mono" style={{ fontSize: 12 }}>{plot.coords}</span></Row>
        <Row label="Rủi ro" last>
          <Badge tone={plot.risk === 'low' ? 'success' : plot.risk === 'medium' ? 'warning' : 'danger'} dot>
            {RISK[plot.risk].label}
          </Badge>
        </Row>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--color-bg-subtle)', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lượt giao gần đây</div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>3 lượt · 42.180 kg</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="primary" icon="external-link" onClick={() => onOpenPlot && onOpenPlot(plot)}>Mở chi tiết</Button>
          <Button variant="ghost"   icon="pencil">Sửa hồ sơ</Button>
        </div>
      </div>
    </Card>
  );
}
