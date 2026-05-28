'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, Pencil, X, Check } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Material } from '@/types/index';

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ten: '', ten_khoa_hoc: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    const repo = getRepository('material');
    repo.get(activePlantId, id).then(m => {
      if (!m) {
        setNotFound(true);
      } else {
        setMaterial(m);
        setForm({ ten: m.ten, ten_khoa_hoc: m.ten_khoa_hoc });
      }
      setLoading(false);
    });
  }, [activePlantId, id]);

  function startEditing() {
    if (!material) return;
    setForm({ ten: material.ten, ten_khoa_hoc: material.ten_khoa_hoc });
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    if (!material) return;
    const ten = form.ten.trim();
    const ten_khoa_hoc = form.ten_khoa_hoc.trim();
    if (!ten) { setError('Tên nguyên liệu không được để trống.'); return; }
    if (!ten_khoa_hoc) { setError('Tên khoa học không được để trống.'); return; }

    setSaving(true);
    setError(null);
    try {
      const repo = getRepository('material');
      const updated = await repo.update(activePlantId, material.id, { ten, ten_khoa_hoc });
      setMaterial(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
        Đang tải...
      </div>
    );
  }

  if (notFound || !material) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
          Không tìm thấy nguyên liệu này.
        </p>
        <Link href="/materials" style={linkStyle}>← Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Link href="/materials" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Nguyên liệu
      </Link>

      {/* Card */}
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
          overflow: 'hidden',
        }}
      >
        {/* Image */}
        <div
          style={{
            height: 240,
            background: 'var(--color-bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {material.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={material.image}
              alt={material.ten}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Package size={48} strokeWidth={1} style={{ color: 'var(--color-text-tertiary)' }} />
          )}
        </div>

        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '0 0 var(--space-1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {material.ten}
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              {material.ten_khoa_hoc}
            </p>
          </div>

          {canEdit && !editing && (
            <button onClick={startEditing} style={editBtnStyle}>
              <Pencil size={14} strokeWidth={1.75} />
              Chỉnh sửa
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
          {editing ? (
            <EditForm
              form={form}
              onChange={patch => setForm(f => ({ ...f, ...patch }))}
              onSave={handleSave}
              onCancel={cancelEditing}
              saving={saving}
              error={error}
            />
          ) : (
            <ReadView material={material} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Read view ────────────────────────────────────────────────────────────────

function ReadView({ material }: { material: Material }) {
  return (
    <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Field label="Tên nguyên liệu" value={material.ten} />
      <Field label="Tên khoa học" value={material.ten_khoa_hoc} italic />
    </dl>
  );
}

function Field({ label, value, italic = false }: { label: string; value: string; italic?: boolean }) {
  return (
    <div>
      <dt
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-primary)',
          fontStyle: italic ? 'italic' : 'normal',
          margin: 0,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  form: { ten: string; ten_khoa_hoc: string };
  onChange: (patch: Partial<{ ten: string; ten_khoa_hoc: string }>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}

function EditForm({ form, onChange, onSave, onCancel, saving, error }: EditFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <LabeledInput
        label="Tên nguyên liệu"
        value={form.ten}
        onChange={v => onChange({ ten: v })}
        disabled={saving}
      />
      <LabeledInput
        label="Tên khoa học"
        value={form.ten_khoa_hoc}
        onChange={v => onChange({ ten_khoa_hoc: v })}
        disabled={saving}
        italic
      />

      {error && (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
        <button onClick={onSave} disabled={saving} style={saveBtnStyle}>
          <Check size={14} strokeWidth={2} />
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button onClick={onCancel} disabled={saving} style={cancelBtnStyle}>
          <X size={14} strokeWidth={2} />
          Hủy
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  disabled,
  italic = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  italic?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          height: 38,
          padding: '0 var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-base)',
          fontStyle: italic ? 'italic' : 'normal',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const linkStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
};

const editBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 34,
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  flexShrink: 0,
};

const saveBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 34,
  padding: '0 var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-accent)',
  color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 34,
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
};
