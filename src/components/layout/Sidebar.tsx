'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Truck,
  Scale,
  Trees,
  Building2,
  Package,
  BarChart2,
  UserRound,
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  CircleHelp,
} from 'lucide-react';

const STORAGE_KEY = 'hsls:sidebarCollapsed';

// ─── Nav item definitions (PRD §4 — Information Architecture) ─────────────────

interface NavItem {
  id: string;
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  gated?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      href: '/',          label: 'Trang chủ',    Icon: Home      },
  { id: 'cargo',     href: '/cargo',     label: 'Xe hàng',      Icon: Truck     },
  { id: 'weighing',  href: '/weighing',  label: 'Phiếu cân',    Icon: Scale     },
  { id: 'plots',     href: '/plots',     label: 'Hồ sơ rừng',   Icon: Trees     },
  { id: 'suppliers', href: '/suppliers', label: 'Nhà cung cấp', Icon: Building2 },
  { id: 'materials', href: '/materials', label: 'Nguyên liệu',  Icon: Package   },
  { id: 'reports',   href: '/reports',   label: 'Báo cáo',      Icon: BarChart2 },
  { id: 'drivers',   href: '/drivers',   label: 'Tài xế',       Icon: UserRound },
  { id: 'settings',  href: '/settings',  label: 'Cài đặt',      Icon: Settings, gated: true },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  // Auto-collapse on tablet widths.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) {
        setCollapsed(true);
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside
      style={{
        width: collapsed ? 56 : 240,
        transition: 'width var(--duration-normal) var(--ease-out)',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        style={{
          height: 56,
          padding: collapsed ? '0 12px' : '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--color-border)',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'var(--color-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-inverse)',
                flexShrink: 0,
              }}
            >
              <Trees size={14} strokeWidth={2} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Hồ sơ nguyên liệu
            </span>
          </div>
        )}
        <CollapseButton collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '8px 6px' : '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.id}
              item={item}
              active={active}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* Help footer — only in expanded state */}
      {!collapsed && (
        <div style={{ padding: 10, borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderRadius: 6,
              background: 'var(--color-bg-subtle)',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            <CircleHelp size={14} />
            <span>Trợ giúp · phím tắt</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ?
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 36,
        padding: collapsed ? 0 : '0 10px',
        paddingLeft: collapsed ? 0 : 8,
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active
          ? 'var(--color-accent-subtle)'
          : hovered
          ? 'var(--color-bg-subtle)'
          : 'transparent',
        borderLeft: active
          ? '2px solid var(--color-accent)'
          : '2px solid transparent',
        borderRadius: active ? '0 6px 6px 0' : 6,
        color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        textDecoration: 'none',
        transition: 'background var(--duration-fast) var(--ease-out)',
        opacity: item.gated ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      <item.Icon size={16} strokeWidth={1.75} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

// ─── Collapse toggle button ───────────────────────────────────────────────────

function CollapseButton({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      onClick={onToggle}
      aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
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
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}
