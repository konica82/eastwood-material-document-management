// Atoms: Icon, Badge, Button, Input, Tabs, etc.

const { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } = React;

function Icon({ name, size = 16, strokeWidth = 1.75, style, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const svg = window.lucide.createElement(window.lucide.icons[toCamel(name)] || window.lucide.icons.Circle);
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('stroke-width', strokeWidth);
      ref.current.appendChild(svg);
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, ...style }} aria-hidden="true" />;
}
function toCamel(kebab) {
  return kebab.split('-').map((p, i) => i === 0 ? p[0].toUpperCase() + p.slice(1) : p[0].toUpperCase() + p.slice(1)).join('');
}

function Badge({ tone = 'neutral', children, dot = false, style }) {
  const tones = {
    neutral: { bg: 'var(--surface-tint)',  text: 'var(--text-2)', dot: 'var(--text-3)' },
    success: { bg: 'var(--success-bg)',    text: 'var(--success-text)', dot: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)',    text: 'var(--warning-text)', dot: 'var(--warning)' },
    danger:  { bg: 'var(--danger-bg)',     text: 'var(--danger-text)',  dot: 'var(--danger)' },
    info:    { bg: 'var(--info-bg)',       text: 'var(--info-text)',    dot: 'var(--accent)' },
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

function StatusBadge({ statusId }) {
  const s = STATUS[statusId];
  if (!s) return null;
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

function Button({ variant = 'secondary', size = 'md', icon, iconRight, children, onClick, type = 'button', disabled, style, loading }) {
  const variants = {
    primary: {
      bg: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
      hoverBg: 'var(--accent-hover)', hoverBorder: 'var(--accent-hover)',
    },
    secondary: {
      bg: 'transparent', color: 'var(--text-1)', border: '1px solid var(--border)',
      hoverBg: 'var(--surface-tint)', hoverBorder: 'var(--border-strong)',
    },
    ghost: {
      bg: 'transparent', color: 'var(--text-1)', border: '1px solid transparent',
      hoverBg: 'var(--accent-tint)',
    },
    destructive: {
      bg: 'var(--danger)', color: '#fff', border: '1px solid var(--danger)',
      hoverBg: '#B91C1C', hoverBorder: '#B91C1C',
    },
  };
  const v = variants[variant];
  const [hover, setHover] = useState(false);
  const heights = { sm: 'var(--btn-h-sm)', md: 'var(--btn-h)', lg: 'var(--btn-h-lg)' };
  const pads = { sm: '0 10px', md: '0 12px', lg: '0 14px' };
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
        background: hover && !disabled ? v.hoverBg : v.bg,
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

function IconButton({ icon, onClick, label, size, style, active }) {
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
        background: active ? 'var(--accent-tint)' : (hover ? 'var(--surface-tint)' : 'transparent'),
        color: active ? 'var(--accent)' : 'var(--text-1)',
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

function Field({ label, hint, error, children, htmlFor, action }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {label && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>}
          {action}
        </div>
      )}
      {children}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{hint}</span>}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="alert-circle" size={12} /> {error}
        </span>
      )}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, mono, id, type = 'text', style, leftIcon, rightSlot, large }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: large ? 56 : 36, padding: leftIcon ? '0 12px 0 10px' : '0 12px',
      gap: 8,
      background: 'var(--surface)',
      border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 2px var(--accent-ring)' : 'none',
      transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
      ...style,
    }}>
      {leftIcon && <Icon name={leftIcon} size={14} style={{ color: 'var(--text-3)' }} />}
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
          padding: 0, color: 'var(--text-1)',
          fontSize: large ? 28 : 14,
          fontWeight: large ? 500 : 400,
        }}
      />
      {rightSlot}
    </div>
  );
}

function Select({ value, onChange, options, id, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative', height: 36,
      background: 'var(--surface)',
      border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 2px var(--accent-ring)' : 'none',
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
          fontSize: 14, color: 'var(--text-1)',
        }}
      >
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <Icon name="chevron-down" size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
    </div>
  );
}

function Card({ children, title, action, padding = 16, style }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: 12,
      padding,
      ...style,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {title && <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" style={{
      display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
    }}>
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
              color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 150ms ease-out',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.icon && <Icon name={t.icon} size={14} />}
            {t.label}
            {typeof t.count === 'number' && (
              <span style={{
                fontSize: 11, color: 'var(--text-3)',
                background: 'var(--surface-tint)',
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

function FilterChip({ active, label, count, onClick, tone }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        height: 'var(--chip-h)', padding: '0 12px',
        background: active ? 'var(--accent-tint)' : (hover ? 'var(--surface-tint)' : 'transparent'),
        color: active ? 'var(--accent)' : 'var(--text-1)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 999,
        fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
      }}
    >
      {tone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--${tone === 'info' ? 'accent' : tone})` }} />}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span style={{
          fontSize: 11,
          color: active ? 'var(--accent)' : 'var(--text-3)',
          background: active ? 'transparent' : 'var(--surface-tint)',
          padding: '1px 6px', borderRadius: 999,
          minWidth: 18, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

function Popover({ open, onClose, anchorRef, children, align = 'start', offset = 6, width }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + offset,
      left: align === 'end' ? r.right : r.left,
    });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target) && !anchorRef.current?.contains(e.target)) {
        onClose();
      }
    }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div ref={ref} style={{
      position: 'fixed', zIndex: 100,
      top: pos.top, left: align === 'end' ? undefined : pos.left,
      right: align === 'end' ? `calc(100vw - ${pos.left}px)` : undefined,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      width,
      animation: 'popIn 150ms ease-out',
    }}>
      {children}
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.tone || 'info';
  const colors = {
    success: 'var(--success)', warning: 'var(--warning)',
    danger: 'var(--danger)', info: 'var(--accent)',
  };
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 200,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `2px solid ${colors[tone]}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 280, maxWidth: 420,
      fontSize: 13,
      animation: 'toastIn 200ms ease-out',
    }}>
      <span style={{ color: 'var(--text-1)' }}>{toast.message}</span>
      {toast.undo && (
        <button onClick={toast.undo} style={{
          background: 'transparent', border: 'none', color: 'var(--accent)',
          fontSize: 13, cursor: 'pointer', padding: 0, marginLeft: 'auto',
        }}>Hoàn tác</button>
      )}
    </div>
  );
}

Object.assign(window, { Icon, Badge, StatusBadge, Button, IconButton, Field, TextInput, Select, Card, Tabs, FilterChip, Popover, Toast });

// Inject extra keyframes
const _kf = document.createElement('style');
_kf.textContent = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes popIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes panelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(_kf);
