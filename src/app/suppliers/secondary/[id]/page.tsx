'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Check, X } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { SecondarySupplier } from '@/types/index';

export default function SecondarySupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const [supplier, setSupplier] = useState<SecondarySupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ten: '', cccd_mst: '', so_dien_thoai: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getRepository('supplier')
      .getSecondary(activePlantId, id)
      .then(s => {
        if (!s) { setNotFound(true); setLoading(false); return; }
        setSupplier(s);
        setForm({ ten: s.ten, cccd_mst: s.cccd_mst, so_dien_thoai: s.so_dien_thoai ?? '' });
        setLoading(false);
      });
  }, [activePlantId, id]);

  function startEditing() {
    if (!supplier) return;
    setForm({ ten: supplier.ten, cccd_mst: supplier.cccd_mst, so_dien_thoai: supplier.so_dien_thoai ?? '' });
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!supplier) return;
    const ten = form.ten.trim();
    const cccd_mst = form.cccd_mst.trim();
    if (!ten) { setError('Họ tên không được để trống.'); return; }
    if (!cccd_mst) { setError('Số CCCD không được để trống.'); return; }
    if (!form.so_dien_thoai.trim()) { setError('Số điện thoại không được để trống.'); return; }

    setSaving(true);
    setError(null);
    try {
      const updated = await getRepository('supplier').updateSecondary(activePlantId, supplier.id, {
        ten,
        cccd_mst,
        so_dien_thoai: form.so_dien_thoai.trim(),
      });
      setSupplier({ ...updated, nha_cung_cap_chinh: supplier.nha_cung_cap_chinh });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Đang tải...</div>;
  }

  if (notFound || !supplier) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
          Không tìm thấy nhà cung cấp phụ này.
        </p>
        <Link href="/suppliers" style={backLinkStyle}>← Quay lại danh sách</Link>
      </div>
    );
  }

  const primaryName = supplier.nha_cung_cap_chinh?.ten ?? null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <Link href="/suppliers" style={backLinkStyle}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Nhà cung cấp
        </Link>
        {primaryName && (
          <>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>/</span>
            <Link href={`/suppliers/${supplier.nha_cung_cap_chinh_id}`} style={backLinkStyle}>
              {primaryName}
            </Link>
          </>
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)' }}>
              Nhà cung cấp phụ
            </div>
            <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {supplier.ten}
            </h1>
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
              onCancel={() => { setEditing(false); setError(null); }}
              saving={saving}
              error={error}
            />
          ) : (
            <ReadFields supplier={supplier} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Read view ────────────────────────────────────────────────────────────────

function ReadFields({ supplier: s }: { supplier: SecondarySupplier }) {
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
      <Field label="Họ tên" value={s.ten} span />
      <Field label="Số CCCD" value={s.cccd_mst} mono />
      <Field label="Số điện thoại" value={s.so_dien_thoai ?? '—'} />
      {s.nha_cung_cap_chinh && (
        <div style={{ gridColumn: '1 / -1' }}>
          <dt style={dtStyle}>Nhà cung cấp chính</dt>
          <dd style={{ margin: 0 }}>
            <Link
              href={`/suppliers/${s.nha_cung_cap_chinh_id}`}
              style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: 'var(--font-size-base)' }}
            >
              {s.nha_cung_cap_chinh.ten}
            </Link>
          </dd>
        </div>
      )}
    </dl>
  );
}

function Field({ label, value, mono = false, span = false }: { label: string; value: string; mono?: boolean; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <dt style={dtStyle}>{label}</dt>
      <dd style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
}: {
  form: { ten: string; cccd_mst: string; so_dien_thoai: string };
  onChange: (patch: Partial<typeof form>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <LabeledInput label="Họ tên" value={form.ten} onChange={v => onChange({ ten: v })} disabled={saving} span />
        <LabeledInput label="Số CCCD" value={form.cccd_mst} onChange={v => onChange({ cccd_mst: v })} disabled={saving} mono />
        <LabeledInput label="Số điện thoại" value={form.so_dien_thoai} onChange={v => onChange({ so_dien_thoai: v })} disabled={saving} />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
  label, value, onChange, disabled, mono = false, span = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  disabled: boolean; mono?: boolean; span?: boolean;
}) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', height: 38, padding: '0 var(--space-3)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
          background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-base)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textDecoration: 'none',
};

const dtStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)',
};

const editBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer', flexShrink: 0,
};

const saveBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 var(--space-4)',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
};
