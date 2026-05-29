'use client';

/**
 * Cài đặt — Settings (admin-only)
 *
 * Two-column layout: sticky left sub-nav (5 sections) + right content panel.
 * V1 implements only the "Nguồn dữ liệu" section fully; the other four
 * sections render a "Sắp triển khai" placeholder.
 *
 * Token mapping (prototype → codebase):
 *   --surface-tint   → var(--color-bg-subtle)
 *   --accent-tint    → var(--color-accent-subtle)   (#EFF6FF)
 *   --danger-bg      → var(--color-danger-subtle)
 *   --danger-text    → var(--color-danger-strong)
 *   --success-bg     → var(--color-success-subtle)
 *   --success-text   → var(--color-success-strong)
 *   --card-bg        → var(--color-bg-surface)
 *   .mono            → fontFamily: 'var(--font-mono)'
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Database, RefreshCcw, Users, Bell, History,
  ShieldCheck, AlertTriangle, Check, Info,
  Scale, Map, Building2, Package, UserRound,
  Link, ExternalLink, Copy, PlugZap, MoreHorizontal, AlertCircle,
} from 'lucide-react';
import { PLANTS } from '@/lib/plants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceStatusKind = 'ok' | 'error' | 'empty';

interface DataSource {
  url: string;
  tab: string;
  range: string;
  lastSync: Date | null;
  status: SourceStatusKind;
  error?: string | null;
}

type DatasetKey = 'cargo' | 'plots' | 'suppliers' | 'materials' | 'drivers';

type PlantSources = Record<DatasetKey, DataSource>;

type SourcesState = Record<string, PlantSources>;

interface DatasetMeta {
  name: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number }>;
  desc: string;
}

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANT_LIST = Object.values(PLANTS); // NMQM, NMXH, NMCT

const DATASET_META: Record<DatasetKey | 'users', DatasetMeta> = {
  cargo:     { name: 'Xe hàng & phiếu cân',  Icon: Scale,    desc: 'Lượt cân, ảnh đồng hồ, dữ liệu giám sát' },
  plots:     { name: 'Hồ sơ rừng',           Icon: Map,      desc: 'Lô rừng, ranh giới, mức rủi ro' },
  suppliers: { name: 'Nhà cung cấp',         Icon: Building2, desc: 'Nhà cung cấp chính và phụ' },
  materials: { name: 'Nguyên liệu',          Icon: Package,  desc: 'Danh mục loại nguyên liệu' },
  drivers:   { name: 'Tài xế',               Icon: UserRound, desc: 'Hồ sơ tài xế và phương tiện' },
  users:     { name: 'Danh sách người dùng', Icon: Users,    desc: 'Tài khoản, email, vai trò ở từng nhà máy' },
};

const DATASET_KEYS: DatasetKey[] = ['cargo', 'plots', 'suppliers', 'materials', 'drivers'];

const SETTINGS_SECTIONS = [
  { id: 'sources', label: 'Nguồn dữ liệu',        Icon: Database   },
  { id: 'sync',    label: 'Đồng bộ',               Icon: RefreshCcw },
  { id: 'users',   label: 'Người dùng & vai trò',  Icon: Users      },
  { id: 'alerts',  label: 'Cảnh báo & thông báo',  Icon: Bell       },
  { id: 'audit',   label: 'Nhật ký phiên',         Icon: History    },
];

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function gid(seed: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  let s = ''; let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 44; i++) { h = (h * 1103515245 + 12345) >>> 0; s += chars[h % chars.length]; }
  return s;
}

function sheetUrl(seed: string): string {
  return `https://docs.google.com/spreadsheets/d/${gid(seed)}/edit`;
}

function minsAgo(m: number): Date {
  return new Date(Date.now() - m * 60_000);
}

// ─── Default seed data ────────────────────────────────────────────────────────

const DEFAULT_SOURCES: SourcesState = {
  NMXH: {
    cargo:     { url: sheetUrl('NMXH-cargo'),     tab: 'PhieuCan',   range: 'A2:AC', lastSync: minsAgo(3),  status: 'ok' },
    plots:     { url: sheetUrl('NMXH-plots'),     tab: 'HoSoRung',   range: 'A2:N',  lastSync: minsAgo(11), status: 'ok' },
    suppliers: { url: sheetUrl('NMXH-suppliers'), tab: 'NhaCungCap', range: 'A2:M',  lastSync: minsAgo(11), status: 'ok' },
    materials: { url: sheetUrl('NMXH-materials'), tab: 'NguyenLieu', range: 'A2:F',  lastSync: minsAgo(11), status: 'ok' },
    drivers:   { url: sheetUrl('NMXH-drivers'),   tab: 'TaiXe',      range: 'A2:K',  lastSync: minsAgo(11), status: 'ok' },
  },
  NMQM: {
    cargo:     { url: sheetUrl('NMQM-cargo'),     tab: 'PhieuCan',   range: 'A2:AC', lastSync: minsAgo(6),  status: 'ok' },
    plots:     { url: sheetUrl('NMQM-plots'),     tab: 'HoSoRung',   range: 'A2:N',  lastSync: minsAgo(72), status: 'error', error: 'Không thể đọc trang tính: kiểm tra quyền chia sẻ' },
    suppliers: { url: sheetUrl('NMQM-suppliers'), tab: 'NhaCungCap', range: 'A2:M',  lastSync: minsAgo(14), status: 'ok' },
    materials: { url: sheetUrl('NMQM-materials'), tab: 'NguyenLieu', range: 'A2:F',  lastSync: minsAgo(14), status: 'ok' },
    drivers:   { url: '',                          tab: 'TaiXe',      range: 'A2:K',  lastSync: null,        status: 'empty' },
  },
  NMCT: {
    cargo:     { url: sheetUrl('NMCT-cargo'),     tab: 'PhieuCan',   range: 'A2:AC', lastSync: minsAgo(2),  status: 'ok' },
    plots:     { url: sheetUrl('NMCT-plots'),     tab: 'HoSoRung',   range: 'A2:N',  lastSync: minsAgo(9),  status: 'ok' },
    suppliers: { url: sheetUrl('NMCT-suppliers'), tab: 'NhaCungCap', range: 'A2:M',  lastSync: minsAgo(9),  status: 'ok' },
    materials: { url: sheetUrl('NMCT-materials'), tab: 'NguyenLieu', range: 'A2:F',  lastSync: minsAgo(9),  status: 'ok' },
    drivers:   { url: sheetUrl('NMCT-drivers'),   tab: 'TaiXe',      range: 'A2:K',  lastSync: minsAgo(9),  status: 'ok' },
  },
};

const DEFAULT_SHARED_USERS: DataSource = {
  url: sheetUrl('SHARED-users'), tab: 'NguoiDung', range: 'A2:G',
  lastSync: minsAgo(5), status: 'ok',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAgo(d: Date | null): string {
  if (!d) return 'Chưa đồng bộ';
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ ${mins % 60} phút trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill-shaped status badge */
function Badge({
  tone,
  dot,
  children,
}: {
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  dot?: boolean;
  children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: 'var(--color-success-subtle)', color: 'var(--color-success-strong)' },
    info:    { background: 'var(--color-accent-subtle)',  color: 'var(--color-accent)' },
    warning: { background: 'var(--color-warning-subtle)', color: 'var(--color-warning-strong)' },
    danger:  { background: 'var(--color-danger-subtle)',  color: 'var(--color-danger-strong)' },
    neutral: { background: 'var(--color-bg-subtle)',      color: 'var(--color-text-secondary)' },
  };
  const dotColors: Record<string, string> = {
    success: 'var(--color-success)', info: 'var(--color-accent)',
    warning: 'var(--color-warning)', danger: 'var(--color-danger)',
    neutral: 'var(--color-text-tertiary)',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: dot ? 5 : 0,
      padding: '2px 9px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--font-size-xs)', fontWeight: 500,
      lineHeight: 1.4, whiteSpace: 'nowrap',
      ...styles[tone],
    }}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: dotColors[tone], flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

/** Status badge for a data source */
function SourceStatus({ source, dirty }: { source: DataSource; dirty: boolean }) {
  if (dirty) return <Badge tone="info">Chưa lưu</Badge>;
  if (source.status === 'empty') return <Badge tone="neutral">Chưa cấu hình</Badge>;
  if (source.status === 'error') return <Badge tone="danger" dot>Lỗi đồng bộ</Badge>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Badge tone="success" dot>Đồng bộ</Badge>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--color-text-tertiary)',
      }}>
        {fmtAgo(source.lastSync)}
      </span>
    </div>
  );
}

/** Label + input wrapper */
function SubField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</span>
      {children}
    </label>
  );
}

/** 36px text input */
function TextInput({
  value,
  onChange,
  placeholder,
  mono,
  style,
  leftIcon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  style?: React.CSSProperties;
  leftIcon?: boolean;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      {leftIcon && (
        <span style={{
          position: 'absolute', left: 10,
          display: 'inline-flex', alignItems: 'center',
          color: 'var(--color-text-tertiary)', pointerEvents: 'none',
        }}>
          <Link size={13} strokeWidth={1.75} />
        </span>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          width: '100%',
          height: 36,
          padding: leftIcon ? '0 12px 0 32px' : '0 12px',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          transition: `border-color var(--duration-fast)`,
          boxSizing: 'border-box',
        }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-accent)'; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)'; }}
      />
    </div>
  );
}

/** Square icon button (36×36) */
function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.FC<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 36, height: 36,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'var(--color-bg-subtle)' : 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: `background var(--duration-fast)`,
      }}
    >
      <Icon size={14} strokeWidth={1.75} />
    </button>
  );
}

/** Standard button */
function Btn({
  children,
  variant = 'secondary',
  icon: BtnIcon,
  loading,
  onClick,
  style,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.FC<{ size?: number; strokeWidth?: number }>;
  loading?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 36, padding: '0 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)', fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    border: 'none',
    transition: `background var(--duration-fast), color var(--duration-fast)`,
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
    ...style,
  };
  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { background: hover ? 'var(--color-accent-hover)' : 'var(--color-accent)', color: 'var(--color-text-inverse)', border: 'none' },
    secondary: { background: hover ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
    ghost:     { background: hover ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-secondary)', border: 'none' },
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      style={{ ...base, ...variantStyles[variant] }}
    >
      {BtnIcon && !loading && <BtnIcon size={13} strokeWidth={2} />}
      {loading && (
        <span style={{
          width: 13, height: 13, border: '1.5px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

// ─── SourceRow ────────────────────────────────────────────────────────────────

function SourceRow({
  datasetKey,
  source,
  dirty,
  testing,
  onChange,
  onTest,
  onSync,
  meta,
  noContainer,
}: {
  datasetKey: DatasetKey | 'users';
  source: DataSource;
  dirty: boolean;
  testing: boolean;
  onChange: (patch: Partial<DataSource>) => void;
  onTest: () => void;
  onSync: () => void;
  meta?: DatasetMeta;
  noContainer?: boolean;
}) {
  const m = meta ?? DATASET_META[datasetKey];
  const { Icon: DatasetIcon } = m;

  const wrapStyle: React.CSSProperties = noContainer ? {} : {
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    padding: 14,
    background: source.status === 'error'
      ? 'color-mix(in srgb, var(--color-danger-subtle) 60%, transparent)'
      : 'var(--color-bg-surface)',
  };

  return (
    <div style={wrapStyle}>
      {/* Row 1: header — icon + name/desc + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <DatasetIcon size={15} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {m.name}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {m.desc}
          </div>
        </div>
        <SourceStatus source={source} dirty={dirty} />
      </div>

      {/* Row 2: URL input + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={source.url}
          onChange={v => onChange({ url: v })}
          mono
          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          leftIcon
          style={{ flex: 1 }}
        />
        <IconButton
          icon={ExternalLink}
          label="Mở trong tab mới"
          onClick={() => { if (source.url) window.open(source.url, '_blank'); }}
        />
        <IconButton
          icon={Copy}
          label="Sao chép URL"
          onClick={() => { if (source.url) navigator.clipboard?.writeText(source.url); }}
        />
        <Btn variant="secondary" icon={PlugZap} loading={testing} onClick={onTest}>
          Kiểm tra
        </Btn>
      </div>

      {/* Row 3: tab + range sub-fields + sync buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10 }}>
        <SubField label="Tab">
          <TextInput
            value={source.tab}
            onChange={v => onChange({ tab: v })}
            mono
            style={{ width: 160 }}
          />
        </SubField>
        <SubField label="Khoảng ô">
          <TextInput
            value={source.range}
            onChange={v => onChange({ range: v })}
            mono
            style={{ width: 110 }}
          />
        </SubField>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon={RefreshCcw} onClick={onSync}>Đồng bộ ngay</Btn>
        <MoreBtn />
      </div>

      {/* Row 4: error banner */}
      {source.status === 'error' && source.error && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-danger-subtle)',
          color: 'var(--color-danger-strong)',
          fontSize: 'var(--font-size-xs)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>
            <AlertCircle size={12} strokeWidth={2} />
          </span>
          <span>{source.error}</span>
        </div>
      )}
    </div>
  );
}

/** ⋯ button — placeholder for future advanced options */
function MoreBtn() {
  const [hover, setHover] = useState(false);
  return (
    <button
      aria-label="Tùy chọn nâng cao"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 36, height: 36, borderRadius: 8,
        background: hover ? 'var(--color-bg-subtle)' : 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: `background var(--duration-fast)`,
      }}
    >
      <MoreHorizontal size={14} strokeWidth={1.75} />
    </button>
  );
}

// ─── Left nav item ────────────────────────────────────────────────────────────

function SettingsNavItem({
  item,
  active,
  warn,
  onClick,
}: {
  item: { id: string; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> };
  active: boolean;
  warn?: number | null;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: active
          ? 'var(--color-accent-subtle)'
          : hover ? 'var(--color-bg-subtle)' : 'transparent',
        /* left border — use outline-offset trick to avoid layout shift */
        borderLeft: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        cursor: 'pointer',
        color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
        fontFamily: 'var(--font-sans)',
        fontWeight: active ? 500 : 400,
        fontSize: 'var(--font-size-sm)',
        transition: `background var(--duration-fast)`,
        width: '100%',
      }}
    >
      <span style={{
        display: 'inline-flex',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        flexShrink: 0,
      }}>
        <item.Icon size={14} strokeWidth={1.75} />
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {warn != null && warn > 0 && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10, fontWeight: 500,
          padding: '1px 6px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger-subtle)',
          color: 'var(--color-danger-strong)',
        }}>
          {warn}
        </span>
      )}
    </button>
  );
}

// ─── Section placeholder ──────────────────────────────────────────────────────

function SectionPlaceholder({
  section,
}: {
  section: { id: string; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> };
}) {
  return (
    <div style={{ maxWidth: 920 }}>
      <h2 style={{
        fontSize: 'var(--font-size-lg)', fontWeight: 500,
        margin: '0 0 4px', color: 'var(--color-text-primary)',
      }}>
        {section.label}
      </h2>
      <p style={{
        fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
        margin: '0 0 var(--space-4)',
      }}>
        Phần này sẽ kế thừa cấu trúc tương tự Nguồn dữ liệu.
      </p>
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 'var(--space-3)',
          color: 'var(--color-text-tertiary)',
        }}>
          <section.Icon size={40} strokeWidth={1.25} />
          <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
            Sắp triển khai.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data sources section ─────────────────────────────────────────────────────

function DataSourcesSection({
  plantId,
  setPlantId,
  sources,
  updatePlantSource,
  shared,
  updateShared,
  dirty,
  testing,
  testConnection,
  syncOne,
  syncAll,
  errorCount,
  userRoleByPlant,
}: {
  plantId: string;
  setPlantId: (id: string) => void;
  sources: SourcesState;
  updatePlantSource: (plant: string, dataset: DatasetKey, patch: Partial<DataSource>) => void;
  shared: DataSource;
  updateShared: (patch: Partial<DataSource>) => void;
  dirty: Set<string>;
  testing: string | null;
  testConnection: (key: string) => void;
  syncOne: (plant: string, dataset: DatasetKey) => void;
  syncAll: () => void;
  errorCount: number;
  userRoleByPlant: Record<string, string>;
}) {
  const plantSources = sources[plantId] ?? sources['NMXH'];
  const activeRole = userRoleByPlant[plantId] ?? 'Manager';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 920 }}>

      {/* Sub-header */}
      <div>
        <h2 style={{
          fontSize: 'var(--font-size-lg)', fontWeight: 500,
          margin: 0, color: 'var(--color-text-primary)',
        }}>
          Nguồn dữ liệu
        </h2>
        <p style={{
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
          margin: '4px 0 0', maxWidth: 680,
        }}>
          Mỗi nhà máy có một bộ Google Sheets riêng cho từng loại dữ liệu. Riêng{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>danh sách người dùng</span>
          {' '}là một trang tính dùng chung cho cả ba nhà máy.
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: errorCount > 0 ? 'var(--color-danger-subtle)' : 'var(--color-success-subtle)',
              color: errorCount > 0 ? 'var(--color-danger-strong)' : 'var(--color-success-strong)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {errorCount > 0
                ? <AlertTriangle size={16} strokeWidth={2} />
                : <Check size={16} strokeWidth={2} />
              }
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {errorCount > 0
                  ? `${errorCount} nguồn dữ liệu đang gặp lỗi`
                  : 'Tất cả nguồn đang hoạt động'
                }
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Đồng bộ tự động mỗi{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>15</span>
                {' '}phút · áp dụng cho 3 nhà máy
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Btn variant="secondary" icon={RefreshCcw} onClick={syncAll}>
            Đồng bộ tất cả ngay
          </Btn>
        </div>
      </div>

      {/* Plant tabs card */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 4px',
        }}>
          {PLANT_LIST.map(plant => {
            const errCount = Object.values(sources[plant.id] ?? {}).filter(
              s => (s as DataSource).status === 'error'
            ).length;
            const isActive = plantId === plant.id;
            return (
              <PlantTab
                key={plant.id}
                label={plant.name}
                active={isActive}
                errCount={errCount}
                onClick={() => setPlantId(plant.id)}
              />
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Role info row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)',
          }}>
            <span style={{ display: 'inline-flex', color: 'var(--color-text-tertiary)' }}>
              <Info size={12} strokeWidth={1.75} />
            </span>
            <span>Vai trò của bạn tại nhà máy này:</span>
            <Badge tone="info">{activeRole}</Badge>
          </div>

          {/* Source rows */}
          {DATASET_KEYS.map(k => (
            <SourceRow
              key={`${plantId}.${k}`}
              datasetKey={k}
              source={plantSources[k]}
              dirty={dirty.has(`${plantId}.${k}`)}
              testing={testing === `${plantId}.${k}`}
              onChange={patch => updatePlantSource(plantId, k, patch)}
              onTest={() => testConnection(`${plantId}.${k}`)}
              onSync={() => syncOne(plantId, k)}
            />
          ))}
        </div>
      </div>

      {/* Shared users section */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)',
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-base)', fontWeight: 500,
            margin: 0, color: 'var(--color-text-primary)',
          }}>
            Dùng chung cho cả ba nhà máy
          </h3>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11, padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}>
            SHARED
          </span>
        </div>
        <p style={{
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)',
          margin: '0 0 var(--space-3)',
        }}>
          Một bảng người dùng chung quản lý quyền truy cập vào toàn bộ hệ thống.
        </p>
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}>
          <SourceRow
            datasetKey="users"
            meta={DATASET_META['users']}
            source={shared}
            dirty={dirty.has('shared.users')}
            testing={testing === 'shared.users'}
            onChange={updateShared}
            onTest={() => testConnection('shared.users')}
            onSync={() => updateShared({ lastSync: new Date(), status: 'ok' })}
            noContainer
          />
        </div>
      </div>
    </div>
  );
}

/** Underline-style plant tab */
function PlantTab({
  label,
  active,
  errCount,
  onClick,
}: {
  label: string;
  active: boolean;
  errCount: number;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
        marginBottom: -1,
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 500 : 400,
        color: active
          ? 'var(--color-text-primary)'
          : hover ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        transition: `color var(--duration-fast), border-bottom-color var(--duration-fast)`,
      }}
    >
      {label}
      {errCount > 0 && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10, fontWeight: 500,
          padding: '1px 5px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger-subtle)',
          color: 'var(--color-danger-strong)',
        }}>
          {errCount}
        </span>
      )}
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  const toneStyle: Record<string, React.CSSProperties> = {
    success: { background: 'var(--color-success)' },
    info:    { background: 'var(--color-accent)' },
    warning: { background: 'var(--color-warning)' },
  };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 200, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          ...toneStyle[t.tone],
          color: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 16px',
          fontSize: 'var(--font-size-sm)',
          maxWidth: 360,
          animation: 'panelIn var(--duration-fast) var(--ease-out)',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [section, setSection] = useState('sources');
  const [plantId, setPlantId] = useState('NMXH');
  const [sources, setSources] = useState<SourcesState>(DEFAULT_SOURCES);
  const [shared, setShared] = useState<DataSource>(DEFAULT_SHARED_USERS);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let toastIdRef = 0;

  // Derived
  const errorCount = useMemo(() => {
    let n = 0;
    Object.values(sources).forEach(p =>
      Object.values(p).forEach(s => { if ((s as DataSource).status === 'error') n++; })
    );
    return n;
  }, [sources]);

  // Toast helper
  const showToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastIdRef;
    setToasts(prev => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dirty tracking
  function markDirty(key: string) {
    setDirty(prev => { const n = new Set(prev); n.add(key); return n; });
  }

  // Mutations
  function updatePlantSource(plant: string, dataset: DatasetKey, patch: Partial<DataSource>) {
    setSources(prev => ({
      ...prev,
      [plant]: { ...prev[plant], [dataset]: { ...prev[plant][dataset], ...patch } },
    }));
    markDirty(`${plant}.${dataset}`);
  }

  function updateShared(patch: Partial<DataSource>) {
    setShared(prev => ({ ...prev, ...patch }));
    markDirty('shared.users');
  }

  function testConnection(key: string) {
    setTesting(key);
    setTimeout(() => {
      setTesting(null);
      showToast(`Kết nối thành công · ${key}`, 'success');
    }, 1200);
  }

  function syncOne(plant: string, dataset: DatasetKey) {
    setSources(prev => ({
      ...prev,
      [plant]: {
        ...prev[plant],
        [dataset]: { ...prev[plant][dataset], lastSync: new Date(), status: 'ok', error: null },
      },
    }));
    showToast(`Đã đồng bộ ${DATASET_META[dataset].name} · ${plant}.`, 'success');
  }

  function syncAll() {
    const now = new Date();
    setSources(prev => {
      const out: SourcesState = {};
      Object.entries(prev).forEach(([p, ds]) => {
        out[p] = {} as PlantSources;
        (Object.entries(ds) as [DatasetKey, DataSource][]).forEach(([k, s]) => {
          out[p][k] = s.url ? { ...s, lastSync: now, status: 'ok', error: null } : s;
        });
      });
      return out;
    });
    setShared(s => ({ ...s, lastSync: now, status: 'ok' }));
    showToast('Đã đồng bộ tất cả nguồn dữ liệu.', 'success');
  }

  // Per-plant role (mock — in production derive from user session)
  const userRoleByPlant: Record<string, string> = { NMXH: 'Quản lý', NMQM: 'Vận hành cân', NMCT: 'Kiểm soát chất lượng' };

  const activeSection = SETTINGS_SECTIONS.find(s => s.id === section)!;

  return (
    <>
      {/* Spin keyframe for loading spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Cài đặt
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-xl)', fontWeight: 500,
            margin: '4px 0 0', color: 'var(--color-text-primary)', lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}>
            Cấu hình hệ thống
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginTop: 6, fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
          }}>
            <span style={{ display: 'inline-flex' }}>
              <ShieldCheck size={12} strokeWidth={1.75} />
            </span>
            <span>Khu vực dành cho quản trị viên · các thay đổi áp dụng ngay khi lưu</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}>
          {/* Left sub-nav */}
          <nav style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            position: 'sticky', top: 72,
          }}>
            {SETTINGS_SECTIONS.map(s => (
              <SettingsNavItem
                key={s.id}
                item={s}
                active={section === s.id}
                warn={s.id === 'sources' ? errorCount : null}
                onClick={() => setSection(s.id)}
              />
            ))}
          </nav>

          {/* Right content */}
          <div style={{ minWidth: 0 }}>
            {section === 'sources' ? (
              <DataSourcesSection
                plantId={plantId}
                setPlantId={setPlantId}
                sources={sources}
                updatePlantSource={updatePlantSource}
                shared={shared}
                updateShared={updateShared}
                dirty={dirty}
                testing={testing}
                testConnection={testConnection}
                syncOne={syncOne}
                syncAll={syncAll}
                errorCount={errorCount}
                userRoleByPlant={userRoleByPlant}
              />
            ) : (
              <SectionPlaceholder section={activeSection} />
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
