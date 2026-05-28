'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Check, X, Building2, User } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Supplier, SecondarySupplier } from '@/types/index';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [secondaries, setSecondaries] = useState<SecondarySupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ten: '', cccd_mst: '', so_dien_thoai: '', dia_chi: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    const repo = getRepository('supplier');
    repo.get(activePlantId, id).then(async s => {
      if (!s) { setNotFound(true); setLoading(false); return; }
      setSupplier(s);
      setForm({ ten: s.ten, cccd_mst: s.cccd_mst, so_dien_thoai: s.so_dien_thoai ?? '', dia_chi: s.dia_chi });
      const secs = await repo.listSecondary(activePlantId, id);
      setSecondaries(secs);
      setLoading(false);
    });
  }, [activePlantId, id]);

  function startEditing() {
    if (!supplier) return;
    setForm({ ten: supplier.ten, cccd_mst: supplier.cccd_mst, so_dien_thoai: supplier.so_dien_thoai ?? '', dia_chi: supplier.dia_chi });
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!supplier) return;
    const ten = form.ten.trim();
    const cccd_mst = form.cccd_mst.trim();
    const dia_chi = form.dia_chi.trim();
    if (!ten) { setError('Tên không được để trống.'); return; }
    if (!cccd_mst) { setError(supplier.hinh_thuc === 'Công ty' ? 'Mã số thuế không được để trống.' : 'CCCD không được để trống.'); return; }
    if (supplier.hinh_thuc === 'Cá nhân' && !form.so_dien_thoai.trim()) { setError('Số điện thoại không được để trống.'); return; }
    if (!dia_chi) { setError('Địa chỉ không được để trống.'); return; }

    setSaving(true);
    setError(null);
    try {
      const repo = getRepository('supplier');
      const updated = await repo.update(activePlantId, supplier.id, {
        ten,
        cccd_mst,
        so_dien_thoai: form.so_dien_thoai.trim() || undefined,
        dia_chi,
      });
      setSupplier({ ...updated, secondarySuppliers: secondaries });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (notFound || !supplier) return <NotFoundState />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href="/suppliers" style={backLinkStyle}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Nhà cung cấp
      </Link>

      {/* Main card */}
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <EntityBadge type={supplier.hinh_thuc} />
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
              supplier={supplier}
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

      {/* Secondary suppliers */}
      {secondaries.length > 0 && (
        <div style={{ marginTop: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 var(--space-3)' }}>
            Nhà cung cấp phụ ({secondaries.length})
          </h2>
          <div style={cardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-table-header-bg)' }}>
                  <Th>Họ tên</Th>
                  <Th>CCCD</Th>
                  <Th>Số điện thoại</Th>
                </tr>
              </thead>
              <tbody>
                {secondaries.map((s, i) => (
                  <SecondaryRow key={s.id} supplier={s} isLast={i === secondaries.length - 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Read view ────────────────────────────────────────────────────────────────

function ReadFields({ supplier: s }: { supplier: Supplier }) {
  const idLabel = s.hinh_thuc === 'Công ty' ? 'Mã số thuế (MST)' : 'Số CCCD';
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
      <Field label="Tên nhà cung cấp" value={s.ten} span />
      <Field label={idLabel} value={s.cccd_mst} mono />
      {s.hinh_thuc === 'Cá nhân' && <Field label="Số điện thoại" value={s.so_dien_thoai ?? '—'} />}
      <Field label="Địa chỉ" value={s.dia_chi} span />
      <Field label="Ngày đăng ký" value={fmtDate(s.created_at)} />
      <Field label="Cập nhật lần cuối" value={fmtDate(s.updated_at)} />
    </dl>
  );
}

function Field({ label, value, mono = false, span = false }: { label: string; value: string; mono?: boolean; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <dt style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)' }}>
        {label}
      </dt>
      <dd style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

type SupplierFormState = { ten: string; cccd_mst: string; so_dien_thoai: string; dia_chi: string };

interface EditFormProps {
  supplier: Supplier;
  form: SupplierFormState;
  onChange: (patch: Partial<SupplierFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}

function EditForm({ supplier, form, onChange, onSave, onCancel, saving, error }: EditFormProps) {
  const idLabel = supplier.hinh_thuc === 'Công ty' ? 'Mã số thuế (MST)' : 'Số CCCD';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <LabeledInput label="Tên nhà cung cấp" value={form.ten} onChange={v => onChange({ ten: v })} disabled={saving} span />
        <LabeledInput label={idLabel} value={form.cccd_mst} onChange={v => onChange({ cccd_mst: v })} disabled={saving} mono />
        {supplier.hinh_thuc === 'Cá nhân' && (
          <LabeledInput label="Số điện thoại" value={form.so_dien_thoai} onChange={v => onChange({ so_dien_thoai: v })} disabled={saving} />
        )}
        <LabeledInput label="Địa chỉ" value={form.dia_chi} onChange={v => onChange({ dia_chi: v })} disabled={saving} span />
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

// ─── Secondary row ────────────────────────────────────────────────────────────

function SecondaryRow({ supplier: s, isLast }: { supplier: SecondarySupplier; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        borderBottom: isLast ? 'none' : undefined,
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <td style={tdStyle}>
        <Link href={`/suppliers/secondary/${s.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
          {s.ten}
        </Link>
      </td>
      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{s.cccd_mst}</td>
      <td style={tdStyle}>{s.so_dien_thoai ?? '—'}</td>
    </tr>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

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
          width: '100%',
          height: 38,
          padding: '0 var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-base)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}

function EntityBadge({ type }: { type: string }) {
  const isCompany = type === 'Công ty';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 9999,
        border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-subtle)', whiteSpace: 'nowrap',
      }}
    >
      {isCompany ? <Building2 size={11} strokeWidth={1.75} /> : <User size={11} strokeWidth={1.75} />}
      {type}
    </span>
  );
}

function LoadingState() {
  return <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Đang tải...</div>;
}

function NotFoundState() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
        Không tìm thấy nhà cung cấp này.
      </p>
      <Link href="/suppliers" style={backLinkStyle}>← Quay lại danh sách</Link>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
  textDecoration: 'none', marginBottom: 'var(--space-5)',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-surface)',
  overflow: 'hidden',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-primary)', verticalAlign: 'middle',
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
