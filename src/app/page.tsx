'use client';

/**
 * Trang chủ — operational dashboard
 *
 * Sections:
 *   1. Page header — date · plant name · "Tạo phiếu cân" CTA
 *   2. KPI strip — 4 metric cards with delta chips + sparklines
 *   3. Material accumulation — period-switched table (7N / 30N / 90N)
 *   4. Two-column: Daily intake stacked chart + Top suppliers
 *   5. Two-column: Activity feed + Plot risk summary
 *
 * Token mapping (prototype → codebase):
 *   --text-1        → var(--color-text-primary)
 *   --text-2        → var(--color-text-secondary)
 *   --text-3        → var(--color-text-tertiary)
 *   --surface-tint  → var(--color-bg-subtle)
 *   --success-bg    → var(--color-success-subtle)
 *   --success-text  → var(--color-success-strong)
 *   --warning-bg    → var(--color-warning-subtle)
 *   --danger-bg     → var(--color-danger-subtle)
 *   --danger-text   → var(--color-danger-strong)
 *   --tooltip-bg    → var(--color-bg-tooltip)
 *   .mono           → fontFamily: 'var(--font-mono)'
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Package2, BarChart3, TrendingUp, TrendingDown, Minus,
  Check, X, Clock, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaterialStat {
  name: string;
  kg: number;
  count: number;
  delta: number;
  color: string;
  spark: number[];
}

interface DayIntake {
  day: number;
  date: Date;
  [material: string]: number | Date;
}

interface SupplierSummary {
  name: string;
  short: string;
  kg: number;
  count: number;
  plots: number;
}

interface ActivityItem {
  kind: 'completed' | 'cancelled' | 'waiting' | 'inProgress';
  text: string;
  meta: string;
  t: Date;
}

interface PlotEntry {
  id: string;
  risk: 'low' | 'medium' | 'high';
  area: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MATERIAL_PALETTE: Record<string, string> = {
  'Keo lai':    'var(--color-accent)',
  'Cao su':     '#059669',
  'Điều':       '#D97706',
  'Tràm nước':  '#0891B2',
  'Bạch đàn':   '#7C3AED',
  'Mùn cưa':    '#BE185D',
  'Dăm gỗ keo': '#475569',
};

const MATERIAL_NAMES = Object.keys(MATERIAL_PALETTE);

function makeSpark(seed: number, days = 14): number[] {
  return Array.from({ length: days }, (_, i) => {
    const v = (Math.sin(i * 0.6 + seed * 1.7) + 1) / 2 * 0.7
            + (Math.cos(i * 1.2 + seed * 2.3) + 1) / 2 * 0.3;
    return Math.max(0.05, v);
  });
}

const MATERIAL_STATS_BASE: Omit<MaterialStat, 'kg' | 'count'>[] = [
  { name: 'Keo lai',    delta: +12, color: MATERIAL_PALETTE['Keo lai'],    spark: makeSpark(1) },
  { name: 'Cao su',     delta:  +6, color: MATERIAL_PALETTE['Cao su'],     spark: makeSpark(2) },
  { name: 'Điều',       delta:  -3, color: MATERIAL_PALETTE['Điều'],       spark: makeSpark(3) },
  { name: 'Tràm nước',  delta:  +9, color: MATERIAL_PALETTE['Tràm nước'],  spark: makeSpark(4) },
  { name: 'Bạch đàn',   delta:  +2, color: MATERIAL_PALETTE['Bạch đàn'],   spark: makeSpark(5) },
  { name: 'Mùn cưa',    delta: +14, color: MATERIAL_PALETTE['Mùn cưa'],    spark: makeSpark(6) },
  { name: 'Dăm gỗ keo', delta:  -1, color: MATERIAL_PALETTE['Dăm gỗ keo'], spark: makeSpark(7) },
];

const KG30: Record<string, number> = {
  'Keo lai': 624500, 'Cao su': 412300, 'Điều': 198400,
  'Tràm nước': 167200, 'Bạch đàn': 124800, 'Mùn cưa': 96400, 'Dăm gỗ keo': 73200,
};
const COUNT30: Record<string, number> = {
  'Keo lai': 86, 'Cao su': 41, 'Điều': 28,
  'Tràm nước': 23, 'Bạch đàn': 19, 'Mùn cưa': 14, 'Dăm gỗ keo': 11,
};

const MATERIAL_STATS: Record<string, MaterialStat[]> = {
  '7d':  MATERIAL_STATS_BASE.map(m => ({ ...m, kg: Math.round(KG30[m.name] * 0.24), count: Math.round(COUNT30[m.name] * 0.25) })),
  '30d': MATERIAL_STATS_BASE.map(m => ({ ...m, kg: KG30[m.name], count: COUNT30[m.name] })),
  '90d': MATERIAL_STATS_BASE.map(m => ({ ...m, kg: Math.round(KG30[m.name] * 2.85), count: Math.round(COUNT30[m.name] * 2.92) })),
};

const DAILY_INTAKE_14D: DayIntake[] = Array.from({ length: 14 }, (_, idx) => {
  const d = 13 - idx;
  const dayFactor = 0.70 + (Math.sin(d * 0.5) + 1) / 2 * 0.55;
  const date = new Date(Date.now() - d * 86_400_000);
  const dow = date.getDay();
  const weekend = (dow === 0 || dow === 6) ? 0.55 : 1;
  const entry: DayIntake = { day: d, date };
  MATERIAL_NAMES.forEach((m, i) => {
    const base = KG30[m] / 30;
    const wobble = 0.6 + ((Math.sin(d * 1.1 + i * 2.3) + 1) / 2) * 0.8;
    (entry as Record<string, unknown>)[m] = Math.round(base * dayFactor * weekend * wobble);
  });
  return entry;
});

const TOP_SUPPLIERS: SupplierSummary[] = [
  { name: 'Hợp tác xã Lâm nghiệp Bến Hải',    short: 'HTX Bến Hải',    kg: 487000, count: 38, plots: 5 },
  { name: 'Công ty CP Nguyên liệu Phước Sơn', short: 'CP Phước Sơn',   kg: 342000, count: 24, plots: 3 },
  { name: 'Công ty TNHH Lâm sản Tây Nguyên',  short: 'TN Tây Nguyên',  kg: 298500, count: 22, plots: 4 },
  { name: 'HTX Lâm nghiệp Đại Lộc',           short: 'HTX Đại Lộc',    kg: 187200, count: 16, plots: 2 },
  { name: 'HTX Trồng rừng Cẩm Lệ',            short: 'HTX Cẩm Lệ',     kg: 144000, count: 12, plots: 2 },
];

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

const ACTIVITY: ActivityItem[] = [
  { t: hoursAgo(0.15), text: 'Cân ra hoàn tất',       meta: '43C-219.84 · 14.380 kg net',      kind: 'completed'  },
  { t: hoursAgo(0.4),  text: 'Xe vào trạm cân',        meta: '75H-002.41 · Gỗ keo tròn',        kind: 'inProgress' },
  { t: hoursAgo(0.7),  text: 'Phiếu cân tạo mới',      meta: '92A-117.65 · HTX Bến Hải',        kind: 'waiting'    },
  { t: hoursAgo(1.2),  text: 'Hủy lượt cân',           meta: '51F-806.22 · Thiếu giấy tờ rừng', kind: 'cancelled'  },
  { t: hoursAgo(1.6),  text: 'Cập nhật hồ sơ rừng',    meta: 'KH-2024-17 · Cẩm Lệ',            kind: 'inProgress' },
  { t: hoursAgo(2.1),  text: 'Cân ra hoàn tất',         meta: '38C-441.07 · 12.910 kg net',      kind: 'completed'  },
  { t: hoursAgo(2.8),  text: 'Hình ảnh QC bổ sung',    meta: '47B-359.18 · 4 ảnh',              kind: 'inProgress' },
  { t: hoursAgo(3.4),  text: 'Xe vào trạm cân',         meta: '29H-712.04 · Dăm gỗ keo',         kind: 'inProgress' },
  { t: hoursAgo(4.2),  text: 'Phiếu cân tạo mới',       meta: '82D-100.95 · CP Phước Sơn',       kind: 'waiting'    },
  { t: hoursAgo(5.1),  text: 'Cân ra hoàn tất',          meta: '61C-228.50 · 15.620 kg net',      kind: 'completed'  },
];

const PLOTS: PlotEntry[] = [
  { id: 'KH-2024-03', risk: 'low',    area: 4.2  },
  { id: 'KH-2024-08', risk: 'medium', area: 1.8  },
  { id: 'KH-2024-12', risk: 'low',    area: 7.6  },
  { id: 'KH-2024-17', risk: 'high',   area: 3.1  },
  { id: 'KH-2024-21', risk: 'low',    area: 5.4  },
  { id: 'KH-2024-26', risk: 'medium', area: 11.0 },
  { id: 'KH-2024-29', risk: 'low',    area: 2.3  },
  { id: 'KH-2024-34', risk: 'high',   area: 0.9  },
];

// Derived dashboard stats
const DASH_STATS = { waiting: 6, inProgress: 8, completed: 12, netTodayKg: 102400 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ─── Spark ────────────────────────────────────────────────────────────────────

function Spark({
  values,
  width = 60,
  height = 20,
  stroke = 'var(--color-accent)',
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 2) - 1}`)
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({
  children,
  padding = 16,
  style,
}: {
  children: React.ReactNode;
  padding?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              color: 'var(--color-accent)',
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

type ToneKey = 'warning' | 'info' | 'success' | 'danger';

const TONE_COLORS: Record<ToneKey, string> = {
  warning: 'var(--color-warning)',
  info:    'var(--color-accent)',
  success: 'var(--color-success)',
  danger:  'var(--color-danger)',
};

function MetricCard({
  label,
  value,
  suffix,
  tone,
  delta,
  sparkValues,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: ToneKey;
  delta?: number;
  sparkValues?: number[];
}) {
  return (
    <Card padding={16}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          {label}
        </div>
        {tone && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: TONE_COLORS[tone],
              marginTop: 8,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-2)',
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.1,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            {suffix}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-2)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        {delta !== undefined ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color:
                delta > 0
                  ? 'var(--color-success)'
                  : delta < 0
                  ? 'var(--color-danger)'
                  : 'var(--color-text-tertiary)',
              fontWeight: 500,
            }}
          >
            {delta > 0 ? (
              <TrendingUp size={12} strokeWidth={1.75} />
            ) : delta < 0 ? (
              <TrendingDown size={12} strokeWidth={1.75} />
            ) : (
              <Minus size={12} strokeWidth={1.75} />
            )}
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {delta > 0 ? '+' : ''}{delta}%
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
              vs hôm qua
            </span>
          </span>
        ) : (
          <span />
        )}
        {sparkValues && <Spark values={sparkValues} width={64} height={20} />}
      </div>
    </Card>
  );
}

// ─── MaterialAccumulationCard ─────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';

function MaterialAccumulationCard({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
}) {
  const stats = MATERIAL_STATS[period];
  const total = stats.reduce((acc, m) => acc + m.kg, 0);
  const totalCount = stats.reduce((acc, m) => acc + m.count, 0);
  const max = Math.max(...stats.map(m => m.kg));

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-3)',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span style={{ display: 'inline-flex', color: 'var(--color-accent)' }}>
              <Package2 size={14} strokeWidth={1.75} />
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              Sản lượng nguyên liệu nhập vào
            </span>
          </div>

          {/* Headline number row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 500,
                lineHeight: 1,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {(total / 1000).toFixed(1)}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
              }}
            >
              tấn
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success-subtle)',
                color: 'var(--color-success-strong)',
                fontSize: 11,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <TrendingUp size={11} strokeWidth={2} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>+8.4%</span>
            </span>
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--space-1)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)' }}>{totalCount}</span>
            {' '}lượt giao · {stats.length} loại nguyên liệu · trung bình{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {(total / totalCount / 1000).toFixed(1)}
            </span>
            {' '}tấn/lượt
          </div>
        </div>

        {/* Period segmented control */}
        <div
          style={{
            display: 'inline-flex',
            padding: 2,
            background: 'var(--color-bg-subtle)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: period === p ? 500 : 400,
                color: period === p ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: period === p ? 'var(--color-bg-surface)' : 'transparent',
                boxShadow: period === p ? '0 0 0 1px var(--color-border) inset' : 'none',
                transition: `background var(--duration-fast), color var(--duration-fast)`,
              }}
            >
              {p === '7d' ? '7N' : p === '30d' ? '30N' : '90N'}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 110px 100px 90px 80px',
          gap: 'var(--space-4)',
          padding: '8px 0',
          fontSize: 11,
          color: 'var(--color-text-tertiary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>Nguyên liệu</div>
        <div>Tỷ trọng</div>
        <div style={{ textAlign: 'right' }}>Khối lượng</div>
        <div style={{ textAlign: 'right' }}>Lượt giao</div>
        <div style={{ textAlign: 'right' }}>Thay đổi</div>
        <div style={{ textAlign: 'right' }}>14N</div>
      </div>

      {/* Table rows */}
      {stats.map(m => {
        const sharePct = (m.kg / total) * 100;
        const barPct = (m.kg / max) * 100;
        return (
          <div
            key={m.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 110px 100px 90px 80px',
              gap: 'var(--space-4)',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {/* Material name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: m.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.name}
              </span>
            </div>

            {/* Share bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--color-bg-subtle)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: '100%',
                    background: m.color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  minWidth: 42,
                  textAlign: 'right',
                }}
              >
                {sharePct.toFixed(1)}%
              </span>
            </div>

            {/* Khối lượng */}
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {(m.kg / 1000).toFixed(1)}
              </span>
              <span
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: 11,
                  marginLeft: 4,
                }}
              >
                tấn
              </span>
            </div>

            {/* Lượt giao */}
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--color-text-primary)' }}>{m.count}</span>
              <span
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: 11,
                  marginLeft: 4,
                }}
              >
                lượt
              </span>
            </div>

            {/* Delta */}
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  color:
                    m.delta > 0
                      ? 'var(--color-success)'
                      : m.delta < 0
                      ? 'var(--color-danger)'
                      : 'var(--color-text-tertiary)',
                }}
              >
                {m.delta > 0 ? (
                  <TrendingUp size={11} strokeWidth={2} />
                ) : m.delta < 0 ? (
                  <TrendingDown size={11} strokeWidth={2} />
                ) : (
                  <Minus size={11} strokeWidth={2} />
                )}
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {m.delta > 0 ? '+' : ''}{m.delta}%
                </span>
              </span>
            </div>

            {/* Sparkline */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Spark values={m.spark} width={72} height={22} stroke={m.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DailyIntakeCard ──────────────────────────────────────────────────────────

function DailyIntakeCard() {
  const [hover, setHover] = useState<number | null>(null);
  const data = DAILY_INTAKE_14D;

  const totals = data.map(d =>
    MATERIAL_NAMES.reduce((acc, m) => acc + ((d[m] as number) || 0), 0)
  );
  const maxTotal = Math.max(...totals);

  const W = 560, H = 200;
  const P = { l: 36, r: 12, t: 16, b: 28 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const barW = innerW / data.length;

  return (
    <Card padding={20}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ display: 'inline-flex', color: 'var(--color-accent)' }}>
              <BarChart3 size={14} strokeWidth={1.75} />
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              Sản lượng theo ngày · 14 ngày
            </span>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 4,
            }}
          >
            Phân tách theo loại nguyên liệu
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'flex-end',
            maxWidth: 280,
          }}
        >
          {MATERIAL_NAMES.map(m => (
            <div
              key={m}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: MATERIAL_PALETTE[m],
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Gridlines + Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <g key={i}>
              <line
                x1={P.l}
                x2={P.l + innerW}
                y1={P.t + innerH * (1 - f)}
                y2={P.t + innerH * (1 - f)}
                stroke="var(--color-border)"
                strokeDasharray={f === 0 ? undefined : '2 4'}
              />
              <text
                x={P.l - 8}
                y={P.t + innerH * (1 - f) + 3}
                fontSize="10"
                fill="var(--color-text-tertiary)"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {((maxTotal / 1000) * f).toFixed(0)}t
              </text>
            </g>
          ))}

          {/* Stacked bars */}
          {data.map((d, i) => {
            const x = P.l + i * barW + barW * 0.15;
            const w = barW * 0.7;
            let acc = 0;
            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                style={{ cursor: 'default' }}
              >
                {/* invisible hit area */}
                <rect
                  x={P.l + i * barW}
                  y={P.t}
                  width={barW}
                  height={innerH}
                  fill="transparent"
                />
                {MATERIAL_NAMES.map((m, mi) => {
                  const v = (d[m] as number) || 0;
                  const h = (v / maxTotal) * innerH;
                  const y = P.t + innerH - acc - h;
                  acc += h;
                  const isTop = mi === MATERIAL_NAMES.length - 1;
                  return (
                    <rect
                      key={m}
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill={MATERIAL_PALETTE[m]}
                      opacity={hover === null || hover === i ? 1 : 0.4}
                      rx={isTop ? 2 : 0}
                    />
                  );
                })}
                {/* X-axis label every 2 days */}
                {i % 2 === 0 && (
                  <text
                    x={x + w / 2}
                    y={H - 8}
                    fontSize="10"
                    fill="var(--color-text-tertiary)"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {pad((d.date as Date).getDate())}/{pad((d.date as Date).getMonth() + 1)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hover !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${((P.l + hover * barW + barW / 2) / W) * 100}%`,
              top: 0,
              transform: 'translateX(-50%)',
              background: 'var(--color-bg-tooltip)',
              color: '#fff',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                marginBottom: 4,
                opacity: 0.7,
              }}
            >
              {pad((data[hover].date as Date).getDate())}/
              {pad((data[hover].date as Date).getMonth() + 1)}
            </div>
            {MATERIAL_NAMES.map(m => (
              <div
                key={m}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 1,
                      background: MATERIAL_PALETTE[m],
                      flexShrink: 0,
                    }}
                  />
                  {m}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 12 }}>
                  {(((data[hover][m] as number) || 0) / 1000).toFixed(2)}t
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.15)',
                marginTop: 6,
                paddingTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>Tổng</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {(totals[hover] / 1000).toFixed(2)}t
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── TopSuppliersCard ─────────────────────────────────────────────────────────

function TopSuppliersCard({ onNav }: { onNav: (route: string) => void }) {
  const max = Math.max(...TOP_SUPPLIERS.map(s => s.kg));
  return (
    <Card padding={16}>
      <CardHeader
        title="Top nhà cung cấp"
        action={
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            30 ngày
          </span>
        }
      />
      {TOP_SUPPLIERS.map((s, i) => {
        const pct = (s.kg / max) * 100;
        return (
          <div
            key={s.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '10px 0',
              borderBottom:
                i < TOP_SUPPLIERS.length - 1
                  ? '1px solid var(--color-border)'
                  : 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                width: 18,
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {i + 1}.
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.short}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(s.kg / 1000).toFixed(0)}
                  {' '}
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--color-text-tertiary)',
                      fontWeight: 400,
                    }}
                  >
                    tấn
                  </span>
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: 'var(--color-bg-subtle)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--color-accent)',
                      opacity: 0.7 + (1 - i / TOP_SUPPLIERS.length) * 0.3,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.count} lượt · {s.plots} lô
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => onNav('suppliers')}
        style={{
          marginTop: 10,
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 8,
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-accent)',
          cursor: 'pointer',
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        Xem tất cả nhà cung cấp{' '}
        <span style={{ display: 'inline-flex' }}>
          <ArrowRight size={12} strokeWidth={2} />
        </span>
      </button>
    </Card>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {ACTIVITY.map((a, i) => {
        const icon =
          a.kind === 'completed'  ? <Check size={13} strokeWidth={2} /> :
          a.kind === 'cancelled'  ? <X size={13} strokeWidth={2} /> :
          a.kind === 'waiting'    ? <Clock size={13} strokeWidth={2} /> :
                                    <ArrowRight size={13} strokeWidth={2} />;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: '10px 0',
              borderBottom:
                i < ACTIVITY.length - 1 ? '1px solid var(--color-border)' : 'none',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {a.text}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 1,
                }}
              >
                {a.meta}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
                marginTop: 1,
              }}
            >
              {fmtTime(a.t)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PlotRiskSummary ──────────────────────────────────────────────────────────

function RiskRow({
  color,
  label,
  count,
  total,
}: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {count}/{total}
      </span>
      <span
        style={{
          color: 'var(--color-text-tertiary)',
          fontSize: 11,
          width: 36,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {((count / total) * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function PlotRiskSummary({ onNav }: { onNav: (route: string) => void }) {
  const counts = { low: 0, medium: 0, high: 0 };
  PLOTS.forEach(p => counts[p.risk]++);
  const total = PLOTS.length;
  const totalArea = PLOTS.reduce((acc, p) => acc + p.area, 0);

  return (
    <Card padding={16}>
      <CardHeader
        title="Hồ sơ rừng"
        action={
          <button
            onClick={() => onNav('plots')}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
            }}
          >
            Mở danh sách{' '}
            <span style={{ display: 'inline-flex' }}>
              <ArrowRight size={12} strokeWidth={2} />
            </span>
          </button>
        }
      />

      {/* Headline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-3)',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {total}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          lô rừng đăng ký
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {totalArea.toFixed(1)} ha
        </span>
      </div>

      {/* Stacked risk bar */}
      <div
        style={{
          height: 8,
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-subtle)',
        }}
      >
        <div
          style={{
            width: `${(counts.low / total) * 100}%`,
            background: 'var(--color-success)',
          }}
        />
        <div
          style={{
            width: `${(counts.medium / total) * 100}%`,
            background: 'var(--color-warning)',
          }}
        />
        <div
          style={{
            width: `${(counts.high / total) * 100}%`,
            background: 'var(--color-danger)',
          }}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <RiskRow color="var(--color-success)" label="Rủi ro thấp" count={counts.low}    total={total} />
        <RiskRow color="var(--color-warning)" label="Rủi ro vừa"  count={counts.medium} total={total} />
        <RiskRow color="var(--color-danger)"  label="Rủi ro cao"  count={counts.high}   total={total} />
      </div>

      {/* High-risk alert */}
      {counts.high > 0 && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-strong)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>
            <AlertTriangle size={13} strokeWidth={2} />
          </span>
          <span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{counts.high}</span>
            {' '}lô cần xác minh trước lượt giao kế.
          </span>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { activePlant } = usePlant();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('30d');

  function onNav(route: string) {
    router.push(`/${route}`);
  }

  const netTodayTonnes = (DASH_STATS.netTodayKg / 1000).toFixed(1);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{todayLabel()}</span>
            <span style={{ margin: '0 8px', color: 'var(--color-border-strong)' }}>·</span>
            {activePlant?.name ?? 'Nhà máy'}
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 500,
              margin: '4px 0 0',
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            Tổng quan hôm nay
          </h1>
        </div>

        <button
          onClick={() => onNav('weighing')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            height: 36,
            padding: '0 var(--space-4)',
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            cursor: 'pointer',
            flexShrink: 0,
            transition: `background var(--duration-fast)`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
          }}
        >
          <span style={{ display: 'inline-flex' }}>
            <Plus size={15} strokeWidth={2.25} />
          </span>
          Tạo phiếu cân
        </button>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <MetricCard
          label="Chờ lượt"
          value={DASH_STATS.waiting}
          tone="warning"
          delta={+8}
          sparkValues={[3, 4, 3, 5, 6, 5, 7]}
        />
        <MetricCard
          label="Đang xử lý"
          value={DASH_STATS.inProgress}
          tone="info"
          delta={-3}
          sparkValues={[6, 5, 7, 8, 6, 7, 6]}
        />
        <MetricCard
          label="Hoàn thành hôm nay"
          value={DASH_STATS.completed}
          tone="success"
          delta={+12}
          sparkValues={[8, 9, 7, 10, 9, 11, 12]}
        />
        <MetricCard
          label="KL tịnh hôm nay"
          value={netTodayTonnes}
          suffix="tấn"
          tone="success"
          delta={+9}
          sparkValues={[110, 95, 120, 140, 118, 135, 142]}
        />
      </div>

      {/* ── Material accumulation ────────────────────────────────────────────── */}
      <MaterialAccumulationCard period={period} setPeriod={setPeriod} />

      {/* ── Row: daily chart + top suppliers ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <DailyIntakeCard />
        <TopSuppliersCard onNav={onNav} />
      </div>

      {/* ── Row: activity + plot risk ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 'var(--space-3)',
        }}
      >
        {/* Activity feed */}
        <Card padding={16}>
          <CardHeader
            title="Hoạt động gần đây"
            action={
              <button
                onClick={() => onNav('cargo')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Xem tất cả{' '}
                <span style={{ display: 'inline-flex' }}>
                  <ArrowRight size={12} strokeWidth={2} />
                </span>
              </button>
            }
          />
          <ActivityFeed />
        </Card>

        {/* Plot risk summary */}
        <PlotRiskSummary onNav={onNav} />
      </div>
    </div>
  );
}
