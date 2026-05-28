'use client';

// Atoms: Icon, Badge, Button, Input, Tabs, etc.
// Also exports table primitives: Th, Td, Row, EmptyState (used across screens).

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { STATUS } from './data';

// ─── Lucide CDN type declaration ───────────────────────────────────────────────
declare global {
  interface Window {
    lucide?: {
      createElement: (icon: unknown) => SVGElement;
      icons: Record<string, unknown>;
    };
  }
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

function toCamel(kebab: string): string {
  return kebab.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
}

export function Icon({ name, size = 16, strokeWidth = 1.75, style, className }: IconProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const svg = window.lucide.createElement(window.lucide.icons[toCamel(name)] || window.lucide.icons['Circle']);
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      svg.setAttribute('stroke-width', String(strokeWidth));
      ref.current.appendChild(svg);
    }
  }, [name, size, strokeWidth]);
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, ...style }}
      aria-hidden="true"
    />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
}

export function Badge({ tone = 'neutral', children, dot = false, style }: BadgeProps) {
  const tones: Record<string, { bg: string; text: string; dot: string }> = {
    neutral: { bg: 'var(--color-bg-subtle)',      text: 'var(--color-text-secondary)', dot: 'var(--color-text-tertiary)' },
    success: { bg: 'var(--color-success-subtle)', text: 'var(--color-success-strong)', dot: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-subtle)', text: 'var(--color-warning-strong)', dot: 'var(--color-warning)' },
    danger:  { bg: 'var(--color-danger-subtle)',  text: 'var(--color-danger-strong)',  dot: 'var(--color-danger)' },
    info:    { bg: 'var(--color-info-subtle)',    text: 'var(--color-info-strong)',    dot: 'var(--color-accent)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999,
      background: t.bg, color: t.text,
      fontSize: 11, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }} />}
      {children}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  statusId: string;
}

export function StatusBadge({ statusId }: StatusBadgeProps) {
  const s = STATUS[statusId];
  if (!s) return null;
  return <Badge tone={s.tone as BadgeProps['tone']} dot>{s.label}</Badge>;
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconRight?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
}

export function Button({
  variant = 'secondary', size = 'md', icon, iconRight,
  children, onClick, type = 'button', disabled, style, loading,
}: ButtonProps) {
  const variants: Record<string, { bg: string; color: string; border: string; hoverBg?: string; hoverBorder?: string }> = {
    primary: {
      bg: 'var(--color-accent)', color: 'var(--color-text-inverse)', border: '1px solid var(--color-accent)',
      hoverBg: 'var(--color-accent-hover)', hoverBorder: 'var(--color-accent-hover)',
    },
    secondary: {
      bg: 'transparent', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)',
      hoverBg: 'var(--color-bg-subtle)', hoverBorder: 'var(--color-border-strong)',
    },
    ghost: {
      bg: 'transparent', color: 'var(--color-text-primary)', border: '1px solid transparent',
      hoverBg: 'var(--color-accent-subtle)',
    },
    destructive: {
      bg: 'var(--color-danger)', color: 'var(--color-text-inverse)', border: '1px solid var(--color-danger)',
      hoverBg: 'color-mix(in srgb, var(--color-danger) 80%, black)',
      hoverBorder: 'color-mix(in srgb, var(--color-danger) 80%, black)',
    },
  };
  const v = variants[variant];
  const [hover, setHover] = useState(false);
  const heights: Record<string, string> = { sm: 'var(--btn-h-sm)', md: 'var(--btn-h)', lg: 'var(--btn-h-lg)' };
  const pads: Record<string, string>   = { sm: '0 10px', md: '0 12px', lg: '0 14px' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: heights[size], padding: pads[size],
        background: hover && !disabled && v.hoverBg ? v.hoverBg : v.bg,
        color: v.color,
        border: hover && v.hoverBorder ? `1px solid ${v.hoverBorder}` : v.border,
        borderRadius: 8,
        fontSize: 14, fontWeight: 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease-out, border-color 150ms ease-out',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading && <Icon name="loader-2" size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {!loading && icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  label: string;
  size?: string | number;
  style?: React.CSSProperties;
  active?: boolean;
}

export function IconButton({ icon, onClick, label, size, style, active }: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const dim = size || 'var(--btn-h)';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: dim, height: dim, padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--color-accent-subtle)' : (hover ? 'var(--color-bg-subtle)' : 'transparent'),
        color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
        border: '1px solid transparent',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'background 150ms ease-out',
        ...style,
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  action?: React.ReactNode;
}

export function Field({ label, hint, error, children, htmlFor, action }: FieldProps) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {label && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>}
          {action}
        </div>
      )}
      {children}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{hint}</span>}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="alert-circle" size={12} /> {error}
        </span>
      )}
    </label>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps {
  value: string | number;
  onChange?: (val: string) => void;
  placeholder?: string;
  mono?: boolean;
  id?: string;
  type?: string;
  style?: React.CSSProperties;
  leftIcon?: string;
  rightSlot?: React.ReactNode;
  large?: boolean;
}

export function TextInput({ value, onChange, placeholder, mono, id, type = 'text', style, leftIcon, rightSlot, large }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: large ? 56 : 36, padding: leftIcon ? '0 12px 0 10px' : '0 12px',
      gap: 8,
      background: 'var(--color-bg-surface)',
      border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 2px var(--color-ring)' : 'none',
      transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
      ...style,
    }}>
      {leftIcon && <Icon name={leftIcon} size={14} style={{ color: 'var(--color-text-tertiary)' }} />}
      <input
        id={id} type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={mono ? 'mono' : ''}
        style={{
          flex: 1, minWidth: 0, height: '100%',
          border: 'none', outline: 'none', background: 'transparent',
          padding: 0, color: 'var(--color-text-primary)',
          fontSize: large ? 28 : 14,
          fontWeight: large ? 500 : 400,
        }}
      />
      {rightSlot}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange?: (val: string) => void;
  options: (SelectOption | string)[];
  id?: string;
  style?: React.CSSProperties;
}

export function Select({ value, onChange, options, id, style }: SelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative', height: 36,
      background: 'var(--color-bg-surface)',
      border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 2px var(--color-ring)' : 'none',
      ...style,
    }}>
      <select
        id={id} value={value}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          width: '100%', height: '100%',
          border: 'none', outline: 'none', background: 'transparent',
          padding: '0 32px 0 12px',
          fontSize: 14, color: 'var(--color-text-primary)',
        }}
      >
        {options.map(o => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
      <Icon name="chevron-down" size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  padding?: number;
  style?: React.CSSProperties;
}

export function Card({ children, title, action, padding = 16, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding,
      ...style,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {title && <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            style={{
              position: 'relative',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 150ms ease-out',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.icon && <Icon name={t.icon} size={14} />}
            {t.label}
            {typeof t.count === 'number' && (
              <span style={{
                fontSize: 11, color: 'var(--color-text-tertiary)',
                background: 'var(--color-bg-subtle)',
                padding: '1px 6px', borderRadius: 999,
                marginLeft: 2,
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  active?: boolean;
  label: string;
  count?: number;
  onClick?: () => void;
  tone?: string;
}

export function FilterChip({ active, label, count, onClick, tone }: FilterChipProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        height: 'var(--chip-h)', padding: '0 12px',
        background: active ? 'var(--color-accent-subtle)' : (hover ? 'var(--color-bg-subtle)' : 'transparent'),
        color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 999,
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
      }}
    >
      {tone && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: tone === 'info' ? 'var(--color-accent)' : `var(--color-${tone})`,
        }} />
      )}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span style={{
          fontSize: 11,
          color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
          background: active ? 'transparent' : 'var(--color-bg-subtle)',
          padding: '1px 6px', borderRadius: 999,
          minWidth: 18, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

// ─── Popover ──────────────────────────────────────────────────────────────────

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: 'start' | 'end';
  offset?: number;
  width?: number;
}

export function Popover({ open, onClose, anchorRef, children, align = 'start', offset = 6, width }: PopoverProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + offset, left: align === 'end' ? r.right : r.left });
  }, [open, align, offset, anchorRef]);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);
  if (!open) return null;
  return (
    <div ref={ref} style={{
      position: 'fixed', zIndex: 100,
      top: pos.top, left: align === 'end' ? undefined : pos.left,
      right: align === 'end' ? `calc(100vw - ${pos.left}px)` : undefined,
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      boxShadow: `0 4px 16px color-mix(in srgb, var(--color-text-primary) 6%, transparent)`,
      width,
      animation: 'popIn 150ms ease-out',
    }}>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastData {
  message: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
  undo?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;
  const tone = toast.tone || 'info';
  const colors: Record<string, string> = {
    success: 'var(--color-success)', warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',   info: 'var(--color-accent)',
  };
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 200,
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderLeft: `2px solid ${colors[tone]}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 280, maxWidth: 420,
      fontSize: 13,
      animation: 'toastIn 200ms ease-out',
    }}>
      <span style={{ color: 'var(--color-text-primary)' }}>{toast.message}</span>
      {toast.undo && (
        <button onClick={toast.undo} style={{
          background: 'transparent', border: 'none', color: 'var(--color-accent)',
          fontSize: 13, cursor: 'pointer', padding: 0, marginLeft: 'auto',
        }}>Hoàn tác</button>
      )}
    </div>
  );
}

// ─── Table primitives (shared across screens) ─────────────────────────────────

interface ThProps {
  children?: React.ReactNode;
  onClick?: () => void;
  sort?: { col: string; dir: 'asc' | 'desc' };
  col?: string;
  width?: number;
  flex?: boolean;
  align?: 'left' | 'right';
}

export function Th({ children, onClick, sort, col, width, align }: ThProps) {
  const isSorted = sort && col && sort.col === col;
  return (
    <th
      onClick={onClick}
      style={{
        position: 'sticky', top: 0, zIndex: 1,
        background: 'var(--color-table-header-bg)',
        textAlign: align || 'left',
        padding: 'var(--th-pad-y) var(--cell-pad-x)',
        fontWeight: 500, fontSize: 12, color: 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-border)',
        width, minWidth: width,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start', width: '100%',
      }}>
        {children}
        {onClick && (
          <Icon
            name={isSorted ? (sort!.dir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'}
            size={11}
            style={{ color: isSorted ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
          />
        )}
      </span>
    </th>
  );
}

interface TdProps {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}

export function Td({ children, align, style }: TdProps) {
  return (
    <td style={{
      padding: 'var(--cell-pad-y) var(--cell-pad-x)',
      borderBottom: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
      textAlign: align || 'left',
      verticalAlign: 'middle',
      fontSize: 'var(--cell-fs)',
      ...style,
    }}>{children}</td>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}

export function Row({ label, children, last }: RowProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  message: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, message, action, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '40px 20px', color: 'var(--color-text-tertiary)',
    }}>
      <Icon name={icon} size={40} strokeWidth={1.25} />
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{message}</div>
      {action && <Button variant="secondary" onClick={onAction}>{action}</Button>}
    </div>
  );
}

// ─── Keyframe injection ───────────────────────────────────────────────────────

export function MockupKeyframes() {
  useEffect(() => {
    if (document.getElementById('mockup-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'mockup-keyframes';
    el.textContent = `
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes popIn   { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
@keyframes panelIn { from { transform: translateX(100%); }           to { transform: translateX(0); } }
@keyframes fadeIn  { from { opacity: 0; }                            to { opacity: 1; } }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}
