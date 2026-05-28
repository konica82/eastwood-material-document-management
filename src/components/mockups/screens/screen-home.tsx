'use client';

// Home dashboard — operational density: KPI strip, material accumulation,
// daily intake stacked chart, top suppliers, activity feed, plot risk summary

import React, { useState } from 'react';
import {
  MockPlant,
  CARGO, DASH_STATS, MATERIAL_STATS, MATERIAL_STATS_BASE, DAILY_INTAKE_14D,
  TOP_SUPPLIERS, ACTIVITY, PLOTS, MATERIAL_PALETTE,
  pad, fmtTime, fmtDate,
} from '../data';
import { Icon, Card, Button } from '../ui';

const MATERIAL_NAMES = MATERIAL_STATS_BASE.map(m => m.name);

// ─── Spark line ───────────────────────────────────────────────────────────────

interface SparkProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

function Spark({ values, width = 60, height = 20, stroke = 'var(--color-accent)' }: SparkProps) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 2) - 1}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: string;
  delta?: number;
  sparkValues?: number[];
}

function MetricCard({ label, value, suffix, tone, delta, sparkValues }: MetricCardProps) {
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</div>
        {tone && <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: tone === 'info' ? 'var(--color-accent)' : `var(--color-${tone})`,
          marginTop: 8,
        }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>{suffix}</span>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        marginTop: 8, fontSize: 12,
      }}>
        {delta !== undefined ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)',
            fontWeight: 500,
          }}>
            <Icon name={delta > 0 ? 'trending-up' : delta < 0 ? 'trending-down' : 'minus'} size={12} />
            <span className="mono">{delta > 0 ? '+' : ''}{delta}%</span>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>vs hôm qua</span>
          </span>
        ) : <span />}
        {sparkValues && <Spark values={sparkValues} width={64} height={20} />}
      </div>
    </Card>
  );
}

// ─── Material accumulation card ───────────────────────────────────────────────

interface MaterialAccumulationCardProps {
  period: string;
  setPeriod: (p: string) => void;
}

function MaterialAccumulationCard({ period, setPeriod }: MaterialAccumulationCardProps) {
  const stats = MATERIAL_STATS[period];
  const total = stats.reduce((acc, m) => acc + m.kg, 0);
  const totalCount = stats.reduce((acc, m) => acc + m.count, 0);
  const max = Math.max(...stats.map(m => m.kg));

  return (
    <Card padding={20} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="package-2" size={14} style={{ color: 'var(--color-accent)' }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Sản lượng nguyên liệu nhập vào</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1, color: 'var(--color-text-primary)' }}>
              {(total / 1000).toFixed(1)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>tấn</span>
            <span style={{
              padding: '3px 10px', borderRadius: 999,
              background: 'var(--color-success-subtle)', color: 'var(--color-success-strong)',
              fontSize: 11, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <Icon name="trending-up" size={11} />
              <span className="mono">+8.4%</span>
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            <span className="mono">{totalCount}</span> lượt giao · {stats.length} loại nguyên liệu · trung bình{' '}
            <span className="mono">{(total / totalCount / 1000).toFixed(1)}</span> tấn/lượt
          </div>
        </div>
        <div style={{
          display: 'inline-flex', padding: 2,
          background: 'var(--color-bg-subtle)', borderRadius: 8,
          border: '1px solid var(--color-border)',
        }}>
          {([{ id: '7d', label: '7N' }, { id: '30d', label: '30N' }, { id: '90d', label: '90N' }] as const).map(p => (
            <button key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                height: 28, padding: '0 12px',
                borderRadius: 6, border: 'none',
                background: period === p.id ? 'var(--color-bg-surface)' : 'transparent',
                color: period === p.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontSize: 12, fontWeight: period === p.id ? 500 : 400,
                cursor: 'pointer',
                boxShadow: period === p.id ? '0 0 0 1px var(--color-border) inset' : 'none',
              }} className="mono">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr 110px 100px 90px 80px',
        gap: 16,
        padding: '8px 0',
        fontSize: 11, color: 'var(--color-text-tertiary)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div>Nguyên liệu</div>
        <div>Tỷ trọng</div>
        <div style={{ textAlign: 'right' }}>Khối lượng</div>
        <div style={{ textAlign: 'right' }}>Lượt giao</div>
        <div style={{ textAlign: 'right' }}>Thay đổi</div>
        <div style={{ textAlign: 'right' }}>14N</div>
      </div>

      {stats.map(m => {
        const sharePct = (m.kg / total) * 100;
        const barPct = (m.kg / max) * 100;
        return (
          <div key={m.name} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 110px 100px 90px 80px',
            gap: 16, alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid var(--color-border)',
            fontSize: 13,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1, height: 8, borderRadius: 4,
                background: 'var(--color-bg-subtle)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: m.color, opacity: 0.85 }} />
              </div>
              <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', minWidth: 42, textAlign: 'right' }}>
                {sharePct.toFixed(1)}%
              </span>
            </div>
            <div style={{ textAlign: 'right' }} className="mono">
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{(m.kg / 1000).toFixed(1)}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginLeft: 4 }}>tấn</span>
            </div>
            <div style={{ textAlign: 'right' }} className="mono">
              <span style={{ color: 'var(--color-text-primary)' }}>{m.count}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginLeft: 4 }}>lượt</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 12, fontWeight: 500,
                color: m.delta > 0 ? 'var(--color-success)' : m.delta < 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)',
              }}>
                <Icon name={m.delta > 0 ? 'trending-up' : m.delta < 0 ? 'trending-down' : 'minus'} size={11} />
                <span className="mono">{m.delta > 0 ? '+' : ''}{m.delta}%</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Spark values={m.spark} width={72} height={22} stroke={m.color} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ─── Daily intake card ────────────────────────────────────────────────────────

function DailyIntakeCard() {
  const data = DAILY_INTAKE_14D;
  const totals = data.map(d => MATERIAL_NAMES.reduce((acc, m) => acc + ((d[m] as number) || 0), 0));
  const maxTotal = Math.max(...totals);
  const W = 560, H = 200, P = { l: 36, r: 12, t: 16, b: 28 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const barW = innerW / data.length;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Card padding={20}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="bar-chart-3" size={14} style={{ color: 'var(--color-accent)' }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Sản lượng theo ngày · 14 ngày</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Phân tách theo loại nguyên liệu</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end', maxWidth: 280 }}>
          {MATERIAL_NAMES.map(m => (
            <div key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: MATERIAL_PALETTE[m] }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
          preserveAspectRatio="none" style={{ display: 'block' }}
          onMouseLeave={() => setHover(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <g key={i}>
              <line x1={P.l} x2={P.l + innerW} y1={P.t + innerH * (1 - f)} y2={P.t + innerH * (1 - f)} stroke="var(--color-border)" strokeDasharray={f === 0 ? 'none' : '2 4'} />
              <text x={P.l - 8} y={P.t + innerH * (1 - f) + 3} fontSize="10" fill="var(--color-text-tertiary)" textAnchor="end" fontFamily="JetBrains Mono">
                {((maxTotal / 1000) * f).toFixed(0)}t
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = P.l + i * barW + barW * 0.15;
            const w = barW * 0.7;
            let acc = 0;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
                <rect x={P.l + i * barW} y={P.t} width={barW} height={innerH} fill="transparent" />
                {MATERIAL_NAMES.map((m, mi) => {
                  const v = (d[m] as number) || 0;
                  const h = (v / maxTotal) * innerH;
                  const y = P.t + innerH - acc - h;
                  acc += h;
                  const isTop = mi === MATERIAL_NAMES.length - 1;
                  return (
                    <rect key={m} x={x} y={y} width={w} height={h}
                      fill={MATERIAL_PALETTE[m]}
                      opacity={hover === null || hover === i ? 1 : 0.4}
                      rx={isTop ? 2 : 0}
                    />
                  );
                })}
                {i % 2 === 0 && (
                  <text x={x + w / 2} y={H - 8} fontSize="10" fill="var(--color-text-tertiary)" textAnchor="middle" fontFamily="JetBrains Mono">
                    {pad((d.date as Date).getDate())}/{pad((d.date as Date).getMonth() + 1)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div style={{
            position: 'absolute',
            left: `${((P.l + hover * barW + barW / 2) / W) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            background: 'var(--color-bg-tooltip)', color: 'var(--color-text-inverse)',
            padding: '8px 10px', borderRadius: 6,
            fontSize: 11, whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 5,
          }}>
            <div className="mono" style={{ marginBottom: 4, opacity: 0.7 }}>
              {pad((data[hover].date as Date).getDate())}/{pad((data[hover].date as Date).getMonth() + 1)}
            </div>
            {MATERIAL_NAMES.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: MATERIAL_PALETTE[m] }} />
                  {m}
                </span>
                <span className="mono" style={{ marginLeft: 12 }}>{(((data[hover][m] as number) || 0) / 1000).toFixed(2)}t</span>
              </div>
            ))}
            <div style={{
              borderTop: `1px solid color-mix(in srgb, var(--color-text-inverse) 15%, transparent)`,
              marginTop: 6, paddingTop: 6,
              display: 'flex', justifyContent: 'space-between', gap: 12,
            }}>
              <span>Tổng</span>
              <span className="mono">{(totals[hover] / 1000).toFixed(2)}t</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Top suppliers card ───────────────────────────────────────────────────────

function TopSuppliersCard({ onNav }: { onNav: (id: string) => void }) {
  const max = Math.max(...TOP_SUPPLIERS.map(s => s.kg));
  return (
    <Card title="Top nhà cung cấp" action={
      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>30 ngày</span>
    }>
      {TOP_SUPPLIERS.map((s, i) => {
        const pct = (s.kg / max) * 100;
        return (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < TOP_SUPPLIERS.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div className="mono" style={{ width: 18, fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'right', flexShrink: 0 }}>{i + 1}.</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{
                  fontSize: 13, color: 'var(--color-text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}>{s.short}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {(s.kg / 1000).toFixed(0)} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>tấn</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent)', opacity: 0.7 + (1 - i / TOP_SUPPLIERS.length) * 0.3 }} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                  {s.count} lượt · {s.plots} lô
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={() => onNav('suppliers')} style={{
        marginTop: 10, width: '100%',
        background: 'transparent', border: 'none', padding: 8,
        fontSize: 12, color: 'var(--color-accent)',
        cursor: 'pointer', fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        Xem tất cả nhà cung cấp <Icon name="arrow-right" size={12} />
      </button>
    </Card>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {ACTIVITY.map((a, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '10px 0',
          borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--color-border)' : 'none',
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1,
          }}>
            <Icon name={
              a.kind === 'completed' ? 'check' :
              a.kind === 'cancelled' ? 'x'     :
              a.kind === 'waiting'   ? 'clock'  :
              'arrow-right'
            } size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{a.text}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{a.meta}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }} className="mono">{fmtTime(a.t)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Plot risk summary ────────────────────────────────────────────────────────

function RiskRow({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }} className="mono">{count}/{total}</span>
      <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, width: 36, textAlign: 'right' }} className="mono">
        {((count / total) * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function PlotRiskSummary({ onNav }: { onNav: (id: string) => void }) {
  const counts = { low: 0, medium: 0, high: 0 };
  PLOTS.forEach(p => counts[p.risk]++);
  const total = PLOTS.length;
  const totalArea = PLOTS.reduce((acc, p) => acc + p.area, 0);
  return (
    <Card title="Hồ sơ rừng" action={
      <button onClick={() => onNav('plots')} style={{
        background: 'transparent', border: 'none', fontSize: 12,
        color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        Mở danh sách <Icon name="arrow-right" size={12} />
      </button>
    }>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>lô rừng đăng ký</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }} className="mono">{totalArea.toFixed(1)} ha</span>
      </div>
      <div style={{
        height: 8, borderRadius: 4, overflow: 'hidden',
        display: 'flex', border: '1px solid var(--color-border)',
        background: 'var(--color-bg-subtle)',
      }}>
        <div style={{ width: `${(counts.low    / total) * 100}%`, background: 'var(--color-success)' }} />
        <div style={{ width: `${(counts.medium / total) * 100}%`, background: 'var(--color-warning)' }} />
        <div style={{ width: `${(counts.high   / total) * 100}%`, background: 'var(--color-danger)'  }} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RiskRow color="var(--color-success)" label="Rủi ro thấp" count={counts.low}    total={total} />
        <RiskRow color="var(--color-warning)" label="Rủi ro vừa"  count={counts.medium} total={total} />
        <RiskRow color="var(--color-danger)"  label="Rủi ro cao"  count={counts.high}   total={total} />
      </div>
      {counts.high > 0 && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 6,
          background: 'var(--color-danger-subtle)', color: 'var(--color-danger-strong)',
          fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="alert-triangle" size={13} />
          <span><span className="mono" style={{ fontWeight: 500 }}>{counts.high}</span> lô cần xác minh trước lượt giao kế.</span>
        </div>
      )}
    </Card>
  );
}

// ─── Screen home ──────────────────────────────────────────────────────────────

interface ScreenHomeProps {
  activePlant: MockPlant;
  onNav: (id: string) => void;
  onOpenCargo?: () => void;
}

export function ScreenHome({ activePlant, onNav }: ScreenHomeProps) {
  const [period, setPeriod] = useState('30d');

  const todayLabel = (() => {
    const d = new Date();
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  })();

  const netTodayKg = CARGO
    .filter(c => c.status === 'completed' && c.grossKg && c.tareKg)
    .reduce((acc, c) => acc + (c.grossKg! - c.tareKg!), 0);

  return (
    <div data-screen-label="home" style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <span className="mono">{todayLabel}</span>
            <span style={{ margin: '0 8px' }}>·</span>
            {activePlant.name}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            Tổng quan hôm nay
          </h1>
        </div>
        <Button icon="plus" variant="primary" onClick={() => onNav('weighing')}>Tạo phiếu cân</Button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <MetricCard label="Chờ lượt"           value={DASH_STATS.waiting}                         tone="warning" delta={+8}  sparkValues={[3,4,3,5,6,5,7]} />
        <MetricCard label="Đang xử lý"         value={DASH_STATS.inProgress}                      tone="info"    delta={-3}  sparkValues={[6,5,7,8,6,7,6]} />
        <MetricCard label="Hoàn thành hôm nay" value={DASH_STATS.completed}                       tone="success" delta={+12} sparkValues={[8,9,7,10,9,11,12]} />
        <MetricCard label="KL tịnh hôm nay"    value={(netTodayKg / 1000).toFixed(1)} suffix="tấn" tone="success" delta={+9}  sparkValues={[110,95,120,140,118,135,142]} />
      </div>

      <MaterialAccumulationCard period={period} setPeriod={setPeriod} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, marginBottom: 12 }}>
        <DailyIntakeCard />
        <TopSuppliersCard onNav={onNav} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
        <Card title="Hoạt động gần đây" action={
          <button onClick={() => onNav('cargo')} style={{
            background: 'transparent', border: 'none', fontSize: 12,
            color: 'var(--color-accent)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500,
          }}>
            Xem tất cả <Icon name="arrow-right" size={12} />
          </button>
        }>
          <ActivityFeed />
        </Card>
        <PlotRiskSummary onNav={onNav} />
      </div>
    </div>
  );
}
