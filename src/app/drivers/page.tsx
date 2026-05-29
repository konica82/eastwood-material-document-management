'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, CircleCheck, ClockAlert, UserX, Search, Download, UserPlus,
  Info, IdCard, Truck, History, Pencil, Unlock, Ban, X,
  ChevronsUpDown, ChevronUp, ChevronDown, UserRound,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { driverApi } from '@/lib/api-client';
import type { Driver, DriverStatus, LicenseClass } from '@/types/index';

// ─── Local display types ──────────────────────────────────────────────────────

type SortCol = 'name' | 'expiry' | 'trips30' | 'kg30';
type SortDir = 'asc' | 'desc';
type FilterKey = 'all' | DriverStatus;

interface DriverDisplay extends Driver {
  _gplx: string;
  _hang_gplx: LicenseClass;
  _han_gplx: string;
  _khu_vuc: string;
  _ngay_vao: string;
  _status: DriverStatus;
  _expDays: number;
  _trips30: number;
  _kg30: number;
  _totalTrips: number;
  _plates: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<DriverStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  active:    { label: 'Đang hoạt động',   color: 'var(--color-success-strong)', bgColor: 'var(--color-success-subtle)', dotColor: 'var(--color-success)' },
  expiring:  { label: 'GPLX sắp hết hạn', color: 'var(--color-warning-strong)', bgColor: 'var(--color-warning-subtle)', dotColor: 'var(--color-warning)' },
  suspended: { label: 'Tạm khóa',          color: 'var(--color-danger-strong)',  bgColor: 'var(--color-danger-subtle)',  dotColor: 'var(--color-danger)' },
  pending:   { label: 'Chờ duyệt hồ sơ',   color: 'var(--color-text-secondary)', bgColor: 'var(--color-bg-subtle)',     dotColor: 'var(--color-text-tertiary)' },
};

const CLASS_INFO: Record<LicenseClass, string> = {
  B2: 'Xe tải < 3,5 tấn',
  C:  'Xe tải ≥ 3,5 tấn',
  E:  'Xe khách > 30 chỗ',
  FC: 'Xe tải kéo rơ-moóc',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColors(name: string): [string, string] {
  const palette: [string, string][] = [
    ['rgba(30,64,175,0.10)',  'var(--color-accent)'],
    ['rgba(22,163,74,0.10)',  '#16A34A'],
    ['rgba(217,119,6,0.10)',  '#D97706'],
    ['rgba(124,58,237,0.10)', '#7C3AED'],
    ['rgba(8,145,178,0.10)',  '#0891B2'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function fmtDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(isoDate).getTime() - today.getTime()) / 86_400_000);
}

function toDisplay(d: Driver): DriverDisplay {
  const expDays = d.han_gplx ? daysUntil(d.han_gplx) : 999;
  return {
    ...d,
    _gplx:       d.gplx       ?? '—',
    _hang_gplx:  d.hang_gplx  ?? 'C',
    _han_gplx:   d.han_gplx   ?? '',
    _khu_vuc:    d.khu_vuc    ?? '—',
    _ngay_vao:   d.ngay_vao   ?? d.created_at.slice(0, 10),
    _status:     d.trang_thai_tai_xe ?? 'active',
    _expDays:    expDays,
    _trips30:    d.trips30    ?? 0,
    _kg30:       d.kg30       ?? 0,
    _totalTrips: d.totalTrips ?? d.completedDeliveries,
    _plates:     d.all_plates?.length ? d.all_plates : [d.so_xe],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DriverAvatar({ name, size = 34 }: { name: string; size?: number }) {
  const [bg, fg] = avatarColors(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 44 ? 15 : 12, fontWeight: 600,
      flexShrink: 0, letterSpacing: '0.02em',
      userSelect: 'none',
    }}>
      {initials(name)}
    </div>
  );
}

function ClassBadge({ cls }: { cls: LicenseClass }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 20, padding: '0 7px',
      borderRadius: 5,
      background: 'var(--color-bg-subtle)',
      border: '1px solid var(--color-border)',
      fontSize: 11, fontWeight: 500,
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-mono)',
    }}>
      {cls}
    </span>
  );
}

function ExpiryCell({ isoDate, days }: { isoDate: string; days: number }) {
  if (!isoDate) return <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>—</span>;
  let color = 'var(--color-text-secondary)';
  let label: string | null = null;
  if (days < 0)       { color = 'var(--color-danger)';  label = 'Đã hết hạn'; }
  else if (days <= 30) { color = 'var(--color-danger)';  label = `Còn ${days} ngày`; }
  else if (days <= 90) { color = 'var(--color-warning)'; label = `Còn ${days} ngày`; }
  return (
    <div>
      <div style={{ fontSize: 12, color, fontFamily: 'var(--font-mono)' }}>{fmtDate(isoDate)}</div>
      {label && <div style={{ fontSize: 11, color, marginTop: 1 }}>{label}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: DriverStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 'var(--radius-full)',
      background: s.bgColor, fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dotColor, flexShrink: 0 }} />
      <span style={{ color: s.color }}>{s.label}</span>
    </span>
  );
}

function SortIcon({ col, sortBy }: { col: SortCol; sortBy: { col: SortCol; dir: SortDir } }) {
  if (sortBy.col !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.35, flexShrink: 0 }} />;
  return sortBy.dir === 'asc'
    ? <ChevronUp size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
    : <ChevronDown size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />;
}

function Th({
  children, flex, width, align = 'left', sortCol, sortBy,
  onSort,
}: {
  children: React.ReactNode;
  flex?: boolean;
  width?: number;
  align?: 'left' | 'right';
  sortCol?: SortCol;
  sortBy?: { col: SortCol; dir: SortDir };
  onSort?: (col: SortCol) => void;
}) {
  const sortable = !!sortCol && !!onSort;
  return (
    <th
      onClick={sortable ? () => onSort!(sortCol!) : undefined}
      style={{
        padding: '10px 14px',
        textAlign: align,
        fontSize: 12, fontWeight: 500,
        color: 'var(--color-text-secondary)',
        background: 'var(--color-table-header-bg)',
        borderBottom: '1px solid var(--color-border)',
        whiteSpace: 'nowrap',
        position: 'sticky', top: 0, zIndex: 1,
        width: flex ? undefined : (width ?? 'auto'),
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortable && sortBy && <SortIcon col={sortCol!} sortBy={sortBy} />}
      </div>
    </th>
  );
}

function Td({ children, align = 'left', mono }: {
  children: React.ReactNode; align?: 'left' | 'right'; mono?: boolean;
}) {
  return (
    <td style={{
      padding: '12px 14px',
      textAlign: align,
      borderBottom: '1px solid var(--color-border)',
      fontSize: 13,
      color: 'var(--color-text-primary)',
      verticalAlign: 'middle',
      fontFamily: mono ? 'var(--font-mono)' : undefined,
    }}>
      {children}
    </td>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

type Tone = 'accent' | 'success' | 'warning' | 'danger';

const TONE_COLORS: Record<Tone, string> = {
  accent:  'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
};

function DriverStatTile({
  icon: Icon, label, value, sub, tone, active, onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: number | string;
  sub?: string;
  tone: Tone;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = TONE_COLORS[tone];
  const iconBg = tone === 'accent'
    ? 'var(--color-accent-subtle)'
    : `color-mix(in srgb, ${color} 12%, transparent)`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, minWidth: 140, textAlign: 'left',
        background: hovered && !active ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
        border: active ? `1px solid ${color}` : '1px solid var(--color-border)',
        boxShadow: active ? `0 0 0 1px ${color}` : 'none',
        borderRadius: 10, padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color var(--duration-fast), box-shadow var(--duration-fast), background var(--duration-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: iconBg, color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} strokeWidth={1.75} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500,
          color: 'var(--color-text-primary)', lineHeight: 1,
        }}>
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{sub}</span>
        )}
      </div>
    </button>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label, count, active, tone, onClick,
}: {
  label: string; count: number; active: boolean;
  tone?: 'success' | 'warning' | 'danger'; onClick: () => void;
}) {
  const dotColor = tone ? TONE_COLORS[tone] : undefined;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 32, padding: '0 12px',
        borderRadius: 'var(--radius-full)',
        border: active ? `1.5px solid var(--color-accent)` : '1px solid var(--color-border)',
        background: active ? 'var(--color-accent-subtle)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all var(--duration-fast) var(--ease-out)',
      }}
    >
      {dotColor && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      )}
      {label}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
        marginLeft: 2,
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Drawer components ────────────────────────────────────────────────────────

function DrawerStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: 'var(--color-bg-subtle)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '8px 10px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 500,
        color: 'var(--color-text-primary)', marginTop: 2,
      }}>
        {value}
      </div>
    </div>
  );
}

function DrawerSection({
  title, icon: Icon, action, children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'inline-flex' }}>
            <Icon size={14} strokeWidth={1.75} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DrawerRow({ label, children, last }: {
  label: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12,
      alignItems: 'center', padding: '9px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)' }}>{children}</span>
    </div>
  );
}

// ─── Driver drawer ────────────────────────────────────────────────────────────

function DriverDrawer({
  driver, onClose, onToast,
}: {
  driver: DriverDisplay | null;
  onClose: () => void;
  onToast: (msg: string, tone?: 'info' | 'success' | 'warning') => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && driver) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [driver, onClose]);

  if (!driver) return null;
  const st = STATUS_MAP[driver._status];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.32)',
          zIndex: 150,
          animation: 'fadeIn var(--duration-fast) var(--ease-out)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(460px, 92vw)',
        background: 'var(--color-bg-page)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-8px 0 28px rgba(15,23,42,0.10)',
        zIndex: 151,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight var(--duration-normal) var(--ease-out)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <DriverAvatar name={driver.ten} size={48} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {driver.ten}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                  {driver.cccd}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={driver._status} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Đóng"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30,
                borderRadius: 'var(--radius-md)',
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* 3-up stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
            <DrawerStat label="Chuyến 30N" value={driver._trips30} />
            <DrawerStat label="KL tịnh 30N" value={`${Math.round(driver._kg30 / 1000)}t`} />
            <DrawerStat label="Tổng chuyến" value={driver._totalTrips} />
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 20,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* Giấy tờ & bằng lái */}
          <DrawerSection title="Giấy tờ & bằng lái" icon={IdCard}>
            <DrawerRow label="Giấy phép lái xe">
              <span style={{ fontFamily: 'var(--font-mono)' }}>{driver._gplx}</span>
            </DrawerRow>
            <DrawerRow label="Hạng">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ClassBadge cls={driver._hang_gplx} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{CLASS_INFO[driver._hang_gplx]}</span>
              </span>
            </DrawerRow>
            <DrawerRow label="Hạn GPLX">
              <ExpiryCell isoDate={driver._han_gplx} days={driver._expDays} />
            </DrawerRow>
            <DrawerRow label="Số CCCD">
              <span style={{ fontFamily: 'var(--font-mono)' }}>{driver.cccd}</span>
            </DrawerRow>
            <DrawerRow label="Điện thoại">
              <span style={{ fontFamily: 'var(--font-mono)' }}>{driver.so_dien_thoai}</span>
            </DrawerRow>
            <DrawerRow label="Khu vực / Ngày vào" last>
              {driver._khu_vuc}
              <span style={{ color: 'var(--color-text-tertiary)' }}> · </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(driver._ngay_vao)}</span>
            </DrawerRow>
          </DrawerSection>

          {/* Phương tiện thường dùng */}
          <DrawerSection
            title="Phương tiện thường dùng"
            icon={Truck}
            action={
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {driver._plates.length} xe
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {driver._plates.map((plate) => (
                <div key={plate} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: 'var(--color-bg-subtle)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-secondary)', flexShrink: 0,
                  }}>
                    <Truck size={14} strokeWidth={1.75} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 13 }}>{plate}</span>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Chuyến gần đây — placeholder until cargo repo is joined */}
          <DrawerSection
            title="Chuyến gần đây"
            icon={History}
            action={
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {driver._totalTrips} tổng
              </span>
            }
          >
            <div style={{
              padding: '14px 16px', textAlign: 'center',
              color: 'var(--color-text-tertiary)', fontSize: 13,
              border: '1px dashed var(--color-border)',
              borderRadius: 8,
            }}>
              Dữ liệu chuyến sẽ hiển thị sau khi tích hợp API.
            </div>
          </DrawerSection>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={() => onToast('Mở biểu mẫu chỉnh sửa hồ sơ tài xế.', 'info')}
            style={{ ...secondaryBtnStyle, flex: 1 }}
          >
            <Pencil size={13} strokeWidth={1.75} />
            Sửa hồ sơ
          </button>
          {driver._status === 'suspended' ? (
            <button
              onClick={() => onToast(`Đã mở khóa tài xế ${driver.ten}.`, 'success')}
              style={primaryBtnStyle}
            >
              <Unlock size={13} strokeWidth={1.75} />
              Mở khóa
            </button>
          ) : (
            <button
              onClick={() => onToast(`Đã tạm khóa tài xế ${driver.ten}.`, 'warning')}
              style={secondaryBtnStyle}
            >
              <Ban size={13} strokeWidth={1.75} />
              Tạm khóa
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; tone: 'info' | 'success' | 'warning' }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  const toneStyle: Record<string, React.CSSProperties> = {
    info:    { background: 'var(--color-accent)' },
    success: { background: 'var(--color-success)' },
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
          fontSize: 13,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'panelIn var(--duration-fast) var(--ease-out)',
          maxWidth: 320,
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const { activePlantId } = usePlant();

  // List state
  const [filter, setFilter]   = useState<FilterKey>('all');
  const [q, setQ]             = useState('');
  const [sortBy, setSortBy]   = useState<{ col: SortCol; dir: SortDir }>({ col: 'name', dir: 'asc' });
  const [openDriver, setOpenDriver] = useState<DriverDisplay | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const { data: rawDriversRaw = [], isLoading: loading } = useQuery({
    queryKey: ['drivers', activePlantId],
    queryFn: () => driverApi.list(activePlantId),
  });
  const rawDrivers = rawDriversRaw.map(toDisplay);

  // Counts
  const counts = useMemo(() => ({
    all:       rawDrivers.length,
    active:    rawDrivers.filter(d => d._status === 'active').length,
    expiring:  rawDrivers.filter(d => d._status === 'expiring' || (d._expDays >= 0 && d._expDays <= 90)).length,
    suspended: rawDrivers.filter(d => d._status === 'suspended').length,
    pending:   rawDrivers.filter(d => d._status === 'pending').length,
  }), [rawDrivers]);

  const totalKg30 = useMemo(() => rawDrivers.reduce((a, d) => a + d._kg30, 0), [rawDrivers]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let rows = rawDrivers.slice();
    if (filter === 'active')    rows = rows.filter(d => d._status === 'active');
    if (filter === 'expiring')  rows = rows.filter(d => d._status === 'expiring' || (d._expDays >= 0 && d._expDays <= 90));
    if (filter === 'suspended') rows = rows.filter(d => d._status === 'suspended');
    if (filter === 'pending')   rows = rows.filter(d => d._status === 'pending');

    if (q.trim()) {
      const k = q.trim().toLowerCase();
      const kn = k.replace(/\s/g, '');
      rows = rows.filter(d =>
        d.ten.toLowerCase().includes(k) ||
        d.cccd.includes(k) ||
        d._gplx.includes(k) ||
        d.so_dien_thoai.replace(/\s/g, '').includes(kn) ||
        d._plates.some(p => p.toLowerCase().includes(k))
      );
    }

    rows.sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortBy.col === 'name')    { va = a.ten;      vb = b.ten; }
      else if (sortBy.col === 'expiry')  { va = a._expDays; vb = b._expDays; }
      else if (sortBy.col === 'trips30') { va = a._trips30;  vb = b._trips30; }
      else                               { va = a._kg30;     vb = b._kg30; }
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sortBy.dir === 'asc' ? r : -r;
    });

    return rows;
  }, [rawDrivers, filter, q, sortBy]);

  function toggleSort(col: SortCol) {
    setSortBy(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  const showToast = useCallback((message: string, tone: 'info' | 'success' | 'warning' = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Skeleton ──
  if (loading) {
    return (
      <div style={{ maxWidth: 1280 }}>
        <div style={{ height: 60, background: 'var(--color-bg-subtle)', borderRadius: 8, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 86, background: 'var(--color-bg-subtle)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
        <div style={{ height: 400, background: 'var(--color-bg-subtle)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: 1280 }}>

        {/* ── Page header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 16, gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tài xế</div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 500, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
              Danh sách tài xế
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtnStyle}>
              <Download size={13} strokeWidth={1.75} />
              Xuất Excel
            </button>
            <button style={primaryBtnStyle}>
              <UserPlus size={13} strokeWidth={1.75} />
              Thêm tài xế
            </button>
          </div>
        </div>

        {/* ── Stat tiles ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <DriverStatTile
            icon={Users} label="Tổng tài xế" value={counts.all} tone="accent"
            sub={`${Math.round(totalKg30 / 1000).toLocaleString('vi-VN')} tấn · 30N`}
            active={filter === 'all'} onClick={() => setFilter('all')}
          />
          <DriverStatTile
            icon={CircleCheck} label="Đang hoạt động" value={counts.active} tone="success"
            active={filter === 'active'} onClick={() => setFilter('active')}
          />
          <DriverStatTile
            icon={ClockAlert} label="GPLX sắp hết hạn" value={counts.expiring} tone="warning"
            sub="≤ 90 ngày"
            active={filter === 'expiring'} onClick={() => setFilter('expiring')}
          />
          <DriverStatTile
            icon={UserX} label="Tạm khóa / chờ duyệt" value={counts.suspended + counts.pending} tone="danger"
            active={filter === 'suspended' || filter === 'pending'}
            onClick={() => setFilter('suspended')}
          />
        </div>

        {/* ── Main card ── */}
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
          overflow: 'hidden',
        }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap',
          }}>
            <FilterChip label="Tất cả"      count={counts.all}       active={filter === 'all'}       onClick={() => setFilter('all')} />
            <FilterChip label="Hoạt động"   count={counts.active}    active={filter === 'active'}    tone="success" onClick={() => setFilter('active')} />
            <FilterChip label="Sắp hết hạn" count={counts.expiring}  active={filter === 'expiring'}  tone="warning" onClick={() => setFilter('expiring')} />
            <FilterChip label="Tạm khóa"    count={counts.suspended} active={filter === 'suspended'} tone="danger"  onClick={() => setFilter('suspended')} />
            <FilterChip label="Chờ duyệt"   count={counts.pending}   active={filter === 'pending'}   onClick={() => setFilter('pending')} />
            <div style={{ flex: 1 }} />
            {/* Search */}
            <div style={{ position: 'relative', width: 280 }}>
              <span style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                display: 'inline-flex',
              }}>
                <Search size={13} strokeWidth={1.75} />
              </span>
              <input
                type="text"
                placeholder="Tìm tên, CCCD, GPLX, biển số…"
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{
                  width: '100%', height: 34,
                  paddingLeft: 30, paddingRight: 10,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr>
                  <Th flex sortCol="name"    sortBy={sortBy} onSort={toggleSort}>Tài xế</Th>
                  <Th width={160}>GPLX</Th>
                  <Th width={140} sortCol="expiry"   sortBy={sortBy} onSort={toggleSort}>Hạn GPLX</Th>
                  <Th width={130}>Điện thoại</Th>
                  <Th width={160}>Phương tiện</Th>
                  <Th width={90}  align="right" sortCol="trips30"  sortBy={sortBy} onSort={toggleSort}>Chuyến 30N</Th>
                  <Th width={120} align="right" sortCol="kg30"     sortBy={sortBy} onSort={toggleSort}>KL tịnh 30N</Th>
                  <Th width={160}>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <DriverRow key={d.id} driver={d} onClick={() => setOpenDriver(d)} />
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 20px' }}>
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: 'var(--color-text-tertiary)', display: 'inline-flex' }}>
                          <UserRound size={40} strokeWidth={1.25} />
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                          Không có tài xế nào khớp với bộ lọc.
                        </span>
                        <button
                          onClick={() => { setFilter('all'); setQ(''); }}
                          style={secondaryBtnStyle}
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer bar */}
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
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{rawDrivers.length}</span>
              {' '}tài xế
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'inline-flex' }}><Info size={12} /></span>
              Nhấp vào một dòng để xem hồ sơ tài xế
            </span>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <DriverDrawer driver={openDriver} onClose={() => setOpenDriver(null)} onToast={showToast} />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </>
  );
}

// ─── Driver row (extracted to avoid re-creating on every render) ──────────────

function DriverRow({ driver: d, onClick }: { driver: DriverDisplay; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        transition: 'background 100ms ease-out',
      }}
    >
      {/* Tài xế */}
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DriverAvatar name={d.ten} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 13 }}>{d.ten}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
              {d.cccd} · {d._khu_vuc}
            </div>
          </div>
        </div>
      </Td>

      {/* GPLX */}
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ClassBadge cls={d._hang_gplx} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{d._gplx}</span>
        </div>
      </Td>

      {/* Hạn GPLX */}
      <Td>
        <ExpiryCell isoDate={d._han_gplx} days={d._expDays} />
      </Td>

      {/* Điện thoại */}
      <Td>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {d.so_dien_thoai}
        </span>
      </Td>

      {/* Phương tiện */}
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d._plates[0]}</span>
          {d._plates.length > 1 && (
            <span style={{
              fontSize: 11, color: 'var(--color-text-tertiary)',
              background: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '1px 7px',
              border: '1px solid var(--color-border)',
            }}>
              +{d._plates.length - 1}
            </span>
          )}
        </div>
      </Td>

      {/* Chuyến 30N */}
      <Td align="right">
        <span style={{ fontFamily: 'var(--font-mono)' }}>{d._trips30}</span>
      </Td>

      {/* KL tịnh 30N */}
      <Td align="right">
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {Math.round(d._kg30 / 1000).toLocaleString('vi-VN')}
          <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 3 }}>t</span>
        </span>
      </Td>

      {/* Trạng thái */}
      <Td>
        <StatusBadge status={d._status} />
      </Td>
    </tr>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
  transition: 'background var(--duration-fast)',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
  transition: 'background var(--duration-fast)',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
  transition: 'background var(--duration-fast)',
};
