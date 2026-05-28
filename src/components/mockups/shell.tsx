'use client';

// App shell: Sidebar + Header + PlantSwitcher

import React, { useState, useEffect, useRef } from 'react';
import { PLANTS, NAV_ITEMS, MockPlant } from './data';
import { Icon, IconButton, Popover } from './ui';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  activeNav: string;
  onNav: (id: string) => void;
  onToggle: () => void;
}

export function Sidebar({ collapsed, activeNav, onNav, onToggle }: SidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <aside style={{
      width: collapsed ? 56 : 240,
      transition: 'width 200ms ease-out',
      borderRight: '1px solid var(--color-border)',
      background: 'var(--color-bg-surface)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky', top: 0,
    }}>
      <div style={{
        height: 56, padding: collapsed ? '0' : '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--color-border)',
        gap: 8,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'var(--color-accent)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-inverse)', flexShrink: 0,
            }}>
              <Icon name="trees" size={14} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hồ sơ nguyên liệu
            </div>
          </div>
        )}
        <IconButton icon={collapsed ? 'panel-left-open' : 'panel-left-close'} label="Thu gọn thanh điều hướng" onClick={onToggle} />
      </div>

      <nav style={{
        flex: 1, padding: collapsed ? '8px 6px' : '8px',
        display: 'flex', flexDirection: 'column', gap: 1,
        overflow: 'auto',
      }} data-screen-label="sidebar">
        {NAV_ITEMS.map(item => {
          const isActive = activeNav === item.id;
          const isHover = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              title={collapsed ? item.label : undefined}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10,
                height: 'var(--sidebar-item-h)',
                padding: collapsed ? '0' : '0 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'var(--color-accent-subtle)' : (isHover ? 'var(--color-bg-subtle)' : 'transparent'),
                border: 'none',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                paddingLeft: collapsed ? 0 : 8,
                borderRadius: isActive ? '0 6px 6px 0' : '6px',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'background 150ms ease-out',
                opacity: item.gated ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={item.icon} size={16} strokeWidth={1.75} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: 10, borderTop: '1px solid var(--color-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 8, borderRadius: 6,
            background: 'var(--color-bg-subtle)',
            fontSize: 12, color: 'var(--color-text-secondary)',
          }}>
            <Icon name="circle-help" size={14} />
            <span>Trợ giúp · phím tắt</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)' }}>?</span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── PlantSwitcher ────────────────────────────────────────────────────────────

interface PlantSwitcherProps {
  activePlant: MockPlant;
  onSwitch: (plant: MockPlant) => void;
}

export function PlantSwitcher({ activePlant, onSwitch }: PlantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const single = PLANTS.length === 1;
  return (
    <>
      <button
        ref={anchor}
        onClick={() => !single && setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 32, padding: '0 4px 0 12px',
          background: open ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
          border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 999,
          fontSize: 13, fontWeight: 500,
          color: 'var(--color-text-primary)',
          cursor: single ? 'default' : 'pointer',
          transition: 'all 150ms ease-out',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
        <span>{activePlant.id}</span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12, fontWeight: 400 }}>·</span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 400 }}>{activePlant.role}</span>
        {!single && (
          <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            <Icon name="chevrons-up-down" size={13} />
          </span>
        )}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchor} width={280}>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', padding: '6px 8px' }}>
            Bạn có quyền truy cập 3 nhà máy
          </div>
          {PLANTS.map(p => {
            const isActive = p.id === activePlant.id;
            return (
              <button
                key={p.id}
                onClick={() => { onSwitch(p); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: 'transparent', border: 'none',
                  borderRadius: 6, cursor: 'pointer',
                  transition: 'background 150ms ease-out',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'var(--color-bg-subtle)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                }} className="mono">{p.id.slice(2)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.role}</div>
                </div>
                {isActive && <Icon name="check" size={14} style={{ color: 'var(--color-accent)' }} />}
              </button>
            );
          })}
        </div>
      </Popover>
    </>
  );
}

// ─── GlobalSearch ─────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 32, padding: '0 10px',
      width: focused ? 360 : 260,
      background: 'var(--color-bg-surface)',
      border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 2px var(--color-ring)' : 'none',
      transition: 'all 200ms ease-out',
    }}>
      <Icon name="search" size={14} style={{ color: 'var(--color-text-tertiary)' }} />
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Tìm biển số, phiếu, nhà cung cấp…"
        style={{
          flex: 1, minWidth: 0, height: '100%',
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, color: 'var(--color-text-primary)',
        }}
      />
      <span className="mono" style={{
        fontSize: 10, color: 'var(--color-text-tertiary)',
        padding: '2px 5px', borderRadius: 4,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-subtle)',
      }}>⌘K</span>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  activePlant: MockPlant;
  onSwitchPlant: (plant: MockPlant) => void;
  theme: string;
  onToggleTheme: () => void;
}

export function Header({ activePlant, onSwitchPlant, theme, onToggleTheme }: HeaderProps) {
  const userAnchor   = useRef<HTMLButtonElement>(null);
  const notifAnchor  = useRef<HTMLButtonElement>(null);
  const [userOpen,  setUserOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 56, padding: '0 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <PlantSwitcher activePlant={activePlant} onSwitch={onSwitchPlant} />

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <GlobalSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label="Chuyển chế độ tối/sáng" onClick={onToggleTheme} />

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            ref={notifAnchor}
            onClick={() => setNotifOpen(o => !o)}
            style={{
              width: 32, height: 32, padding: 0, position: 'relative',
              background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon name="bell" size={16} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 999,
              background: 'var(--color-danger)', color: 'var(--color-text-inverse)',
              fontSize: 10, fontWeight: 500, lineHeight: '16px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--color-bg-surface)',
            }}>3</span>
          </button>
          <Popover open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={notifAnchor} align="end" width={340}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Thông báo</div>
              <button style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer' }}>Đánh dấu đã đọc</button>
            </div>
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              {([
                { t: 'Phiếu cân chưa hoàn tất',    sub: '47B-359.18 · còn 18 phút',         kind: 'warning', time: '5 phút'  },
                { t: 'Hồ sơ rừng cần xác nhận',    sub: 'KH-2024-17 · rủi ro cao',           kind: 'danger',  time: '32 phút' },
                { t: 'Báo cáo tuần đã sẵn sàng',   sub: 'Tải về định dạng CSV',              kind: 'info',    time: '1 giờ'   },
              ] as const).map((n, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: n.kind === 'danger' ? 'var(--color-danger)' : n.kind === 'warning' ? 'var(--color-warning)' : 'var(--color-accent)',
                    marginTop: 7, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{n.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{n.sub}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{n.time}</div>
                </div>
              ))}
            </div>
          </Popover>
        </div>

        {/* User menu */}
        <button
          ref={userAnchor}
          onClick={() => setUserOpen(o => !o)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 32, padding: '0 8px 0 4px',
            background: 'transparent', border: 'none', borderRadius: 999,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500,
          }}>TH</div>
          <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>Thuận Hồ</span>
          <Icon name="chevron-down" size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        </button>
        <Popover open={userOpen} onClose={() => setUserOpen(false)} anchorRef={userAnchor} align="end" width={220}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Thuận Hồ</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>thuan.ho@congtylamsan.vn</div>
          </div>
          <div style={{ padding: 4 }}>
            {([
              { label: 'Hồ sơ cá nhân',              icon: 'user'     },
              { label: 'Cài đặt tài khoản',          icon: 'settings' },
              { label: 'Quản lý phiên đăng nhập',    icon: 'shield'   },
            ] as const).map(m => (
              <button key={m.label} style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'transparent', border: 'none', borderRadius: 6,
                fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <Icon name={m.icon} size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <span>{m.label}</span>
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            <button style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: 'transparent', border: 'none', borderRadius: 6,
              fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-subtle)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <Icon name="log-out" size={14} style={{ color: 'var(--color-text-secondary)' }} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </Popover>
      </div>
    </header>
  );
}
