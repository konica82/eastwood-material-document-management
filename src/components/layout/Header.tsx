'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronsUpDown,
  Check,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { usePlant } from '../../contexts/PlantContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { PlantConfig } from '../../lib/plants/config';

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      <PlantSwitcher />

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <GlobalSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Theme toggle */}
        <IconBtn
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
        </IconBtn>

        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

// ─── Plant switcher ───────────────────────────────────────────────────────────

function PlantSwitcher() {
  const { activePlant, activePlantId, availablePlants, setActivePlant, roleAtPlant } = usePlant();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const single = availablePlants.length === 1;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={anchorRef}
        onClick={() => !single && setOpen(o => !o)}
        aria-label={`Nhà máy đang hoạt động: ${activePlant.name}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 4px 0 12px',
          background: open ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
          border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 9999,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          cursor: single ? 'default' : 'pointer',
          transition: 'all var(--duration-fast) var(--ease-out)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Accent dot */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            flexShrink: 0,
          }}
        />
        <span>{activePlant.displayName}</span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12, fontWeight: 400 }}>·</span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 400 }}>
          {roleAtPlant(activePlantId)}
        </span>
        {!single && (
          <span
            style={{
              width: 24,
              height: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronsUpDown size={13} />
          </span>
        )}
      </button>

      <Dropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        width={288}
        align="start"
      >
        <div style={{ padding: 8 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-tertiary)',
              padding: '4px 8px 8px',
            }}
          >
            {availablePlants.length === 1
              ? 'Bạn có quyền truy cập 1 nhà máy'
              : `Bạn có quyền truy cập ${availablePlants.length} nhà máy`}
          </div>
          <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {availablePlants.map(plant => (
              <PlantOption
                key={plant.id}
                plant={plant}
                active={plant.id === activePlantId}
                role={roleAtPlant(plant.id)}
                onSelect={() => { setActivePlant(plant.id); setOpen(false); }}
              />
            ))}
          </ul>
        </div>
      </Dropdown>
    </div>
  );
}

function PlantOption({
  plant, active, role, onSelect,
}: {
  plant: PlantConfig;
  active: boolean;
  role: string;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <li role="option" aria-selected={active}>
      <button
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'background var(--duration-fast) var(--ease-out)',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: active ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 500,
            color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {plant.id.slice(2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {plant.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{role}</div>
        </div>
        {active && <Check size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
      </button>
    </li>
  );
}

// ─── Global search ────────────────────────────────────────────────────────────

function GlobalSearch() {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && focused) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 32,
        padding: '0 10px',
        width: focused ? 360 : 260,
        background: 'var(--color-bg-surface)',
        border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 6,
        boxShadow: focused ? '0 0 0 2px var(--color-ring)' : 'none',
        transition: 'width var(--duration-normal) var(--ease-out), border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
      }}
    >
      <Search size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Tìm biển số, phiếu, nhà cung cấp…"
        aria-label="Tìm kiếm toàn cục"
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 13,
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
        }}
      />
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary)',
          padding: '2px 5px',
          borderRadius: 4,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-subtle)',
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
        }}
      >
        ⌘K
      </span>
    </div>
  );
}

// ─── Notification bell ────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Phiếu cân chưa hoàn tất',
    sub: '47B-359.18 · còn 18 phút',
    kind: 'warning' as const,
    time: '5 phút',
  },
  {
    id: '2',
    title: 'Hồ sơ rừng cần xác nhận',
    sub: 'KH-2024-17 · rủi ro cao',
    kind: 'danger' as const,
    time: '32 phút',
  },
  {
    id: '3',
    title: 'Báo cáo tuần đã sẵn sàng',
    sub: 'Tải về định dạng CSV',
    kind: 'info' as const,
    time: '1 giờ',
  },
] as const;

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const unread = MOCK_NOTIFICATIONS.length;

  const kindColor = (kind: 'warning' | 'danger' | 'info') =>
    kind === 'danger'
      ? 'var(--color-danger)'
      : kind === 'warning'
      ? 'var(--color-warning)'
      : 'var(--color-accent)';

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={anchorRef}
        onClick={() => setOpen(o => !o)}
        aria-label={`Thông báo (${unread} chưa đọc)`}
        aria-expanded={open}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 32,
          height: 32,
          padding: 0,
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
          transition: 'background var(--duration-fast) var(--ease-out)',
        }}
      >
        <Bell size={16} strokeWidth={1.75} />
        {unread > 0 && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 9999,
              background: 'var(--color-danger)',
              color: 'var(--color-text-inverse)',
              fontSize: 10,
              fontWeight: 500,
              lineHeight: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-bg-surface)',
            }}
          >
            {unread}
          </span>
        )}
      </button>

      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={340} align="end">
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>Thông báo</span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 12,
              color: 'var(--color-accent)',
              cursor: 'pointer',
            }}
          >
            Đánh dấu đã đọc
          </button>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {MOCK_NOTIFICATIONS.map((n, i) => (
            <div
              key={n.id}
              style={{
                padding: '10px 12px',
                borderBottom: i < MOCK_NOTIFICATIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: kindColor(n.kind),
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{n.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                {n.time}
              </div>
            </div>
          ))}
        </div>
      </Dropdown>
    </div>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user } = usePlant();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Not yet loaded — render nothing so the header layout doesn't shift.
  if (!user) return null;

  // Derive initials (up to 2 chars) from the user's name.
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const menuItems = [
    { label: 'Hồ sơ cá nhân',           Icon: User     },
    { label: 'Cài đặt tài khoản',        Icon: Settings },
    { label: 'Quản lý phiên đăng nhập',  Icon: Shield   },
  ] as const;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={anchorRef}
        onClick={() => setOpen(o => !o)}
        aria-label={`Tài khoản: ${user.name}`}
        aria-expanded={open}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 8px 0 4px',
          background: hovered || open ? 'var(--color-bg-subtle)' : 'transparent',
          border: 'none',
          borderRadius: 9999,
          cursor: 'pointer',
          transition: 'background var(--duration-fast) var(--ease-out)',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {initials}
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{user.name}</span>
        <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>

      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={220} align="end">
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{user.email}</div>
        </div>
        <div style={{ padding: 4 }}>
          {menuItems.map(m => (
            <DropdownItem key={m.label} Icon={m.Icon} label={m.label} onClick={() => setOpen(false)} />
          ))}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
          <DropdownItem Icon={LogOut} label="Đăng xuất" onClick={() => setOpen(false)} />
        </div>
      </Dropdown>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function IconBtn({
  children,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: 'var(--color-text-primary)',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

function DropdownItem({
  Icon,
  label,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <Icon size={14} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  );
}

// ─── Dropdown / Popover ───────────────────────────────────────────────────────

interface DropdownProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  width?: number;
  align?: 'start' | 'end';
}

function Dropdown({ open, onClose, anchorRef, children, width = 240, align = 'start' }: DropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside.
  const handleOutside = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      anchorRef.current &&
      !anchorRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  }, [onClose, anchorRef]);

  // Close on Escape.
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleOutside, handleEscape]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [align === 'end' ? 'right' : 'left']: 0,
        width,
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        zIndex: 100,
        boxShadow: 'none',
        animation: 'panelIn 150ms ease-out',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
