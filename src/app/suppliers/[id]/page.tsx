'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Building2, User, Pencil, MoreHorizontal, Download, Plus, X, Check } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Supplier, SecondarySupplier } from '@/types/index';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Local-only secondary (for inline add; no addSecondary on repo yet)
interface LocalSecondary extends SecondarySupplier {
  _local?: true;
}

type SupplierFormState = {
  ten: string;
  cccd_mst: string;
  so_dien_thoai: string;
  dia_chi: string;
};

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [secondaries, setSecondaries] = useState<LocalSecondary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit hero card
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SupplierFormState>({ ten: '', cccd_mst: '', so_dien_thoai: '', dia_chi: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inline add secondary
  const [newName, setNewName] = useState('');
  const [newCccd, setNewCccd] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addingSecondary, setAddingSecondary] = useState(false);

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
    setFormError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!supplier) return;
    const ten = form.ten.trim();
    const cccd_mst = form.cccd_mst.trim();
    const dia_chi = form.dia_chi.trim();
    if (!ten) { setFormError('Tên không được để trống.'); return; }
    if (!cccd_mst) { setFormError(supplier.hinh_thuc === 'Công ty' ? 'Mã số thuế không được để trống.' : 'CCCD không được để trống.'); return; }
    if (!dia_chi) { setFormError('Địa chỉ không được để trống.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const repo = getRepository('supplier');
      const updated = await repo.update(activePlantId, supplier.id, {
        ten, cccd_mst, dia_chi,
        so_dien_thoai: form.so_dien_thoai.trim() || undefined,
      });
      setSupplier(updated);
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  }

  function handleAddSecondary() {
    const name = newName.trim();
    const cccd = newCccd.trim();
    if (!name || !cccd) return;
    setAddingSecondary(true);
    const local: LocalSecondary = {
      id: `ncp-local-${Date.now()}`,
      ten: name,
      hinh_thuc: 'Cá nhân',
      cccd_mst: cccd,
      so_dien_thoai: newPhone.trim() || undefined,
      nha_cung_cap_chinh_id: id,
      _local: true,
    };
    setSecondaries(prev => [...prev, local]);
    setNewName(''); setNewCccd(''); setNewPhone('');
    setAddingSecondary(false);
  }

  if (loading) return <LoadingState />;
  if (notFound || !supplier) return <NotFoundState />;

  const isCompany = supplier.hinh_thuc === 'Công ty';
  const idLabel = isCompany ? 'Mã số thuế' : 'Số CCCD';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Breadcrumb ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
      }}>
        <Link href="/suppliers" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          Nhà cung cấp
        </Link>
        <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        <span style={{ color: 'var(--color-text-primary)' }}>{supplier.ten}</span>
      </div>

      {/* ── Hero card ── */}
      <div style={{
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)', overflow: 'hidden',
        padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>

          {/* Left: identity + KV grid */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            {/* Identity row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent-subtle)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-accent)', flexShrink: 0,
              }}>
                {isCompany ? <Building2 size={18} strokeWidth={1.75} /> : <User size={18} strokeWidth={1.75} />}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {editing ? (
                    <input
                      type="text"
                      value={form.ten}
                      onChange={e => setForm(f => ({ ...f, ten: e.target.value }))}
                      disabled={saving}
                      style={inlineInputStyle}
                      autoFocus
                    />
                  ) : supplier.ten}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{supplier.cccd_mst}</span>
                  <span>·</span>
                  <StatusBadge />
                </div>
              </div>
            </div>

            {/* KV grid */}
            {editing ? (
              <EditForm
                supplier={supplier}
                form={form}
                onChange={patch => setForm(f => ({ ...f, ...patch }))}
                error={formError}
                saving={saving}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginTop: 16, fontSize: 13 }}>
                <KV label={idLabel} value={<span style={{ fontFamily: 'var(--font-mono)' }}>{supplier.cccd_mst}</span>} />
                <KV label="Hình thức" value={supplier.hinh_thuc} />
                <KV label="Số điện thoại" value={supplier.so_dien_thoai ? <span style={{ fontFamily: 'var(--font-mono)' }}>{supplier.so_dien_thoai}</span> : '—'} />
                <KV label="Ngày đăng ký" value={<span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(supplier.created_at)}</span>} />
                <KV label="Địa chỉ" value={supplier.dia_chi} span={2} />
              </div>
            )}
          </div>

          {/* Right: action buttons + mini stats */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                      <Check size={14} strokeWidth={2} />
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button onClick={() => { setEditing(false); setFormError(null); }} disabled={saving} style={secondaryBtnStyle}>
                      <X size={14} strokeWidth={2} />
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEditing} style={secondaryBtnStyle}>
                      <Pencil size={14} strokeWidth={1.75} />
                      Sửa thông tin
                    </button>
                    <button style={iconBtnStyle} title="Thêm tùy chọn">
                      <MoreHorizontal size={14} strokeWidth={1.75} />
                    </button>
                  </>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, minWidth: 320 }}>
              <MiniStat label="Lượt giao 30N" value="—" />
              <MiniStat label="Khối lượng 30N" value="—" />
              <MiniStat label="NCC phụ" value={String(secondaries.length)} />
            </div>
          </div>
        </div>

        {formError && (
          <p style={{ margin: '12px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
            {formError}
          </p>
        )}
      </div>

      {/* ── Secondary suppliers card ── */}
      <div style={{
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Nhà cung cấp phụ
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Các hộ rừng cá nhân thuộc {supplier.ten} ·{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{secondaries.length}</span> thành viên
            </div>
          </div>
          <button style={ghostBtnStyle}>
            <Download size={13} strokeWidth={1.75} />
            Xuất danh sách
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-table-header-bg)' }}>
              <Th flex>Họ tên</Th>
              <Th>CCCD</Th>
              <Th>Số điện thoại</Th>
              {canEdit && <Th width={48} />}
            </tr>
          </thead>
          <tbody>
            {secondaries.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 4 : 3} style={{
                  padding: '24px 20px', textAlign: 'center',
                  color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)',
                }}>
                  Chưa có nhà cung cấp phụ nào.
                </td>
              </tr>
            )}
            {secondaries.map((s, i) => (
              <SecondaryRow key={s.id} supplier={s} showEdit={canEdit} isLast={i === secondaries.length - 1} />
            ))}

            {/* Inline add row */}
            {canEdit && (
              <tr>
                <td colSpan={4} style={{
                  padding: '12px 16px',
                  borderTop: secondaries.length > 0 ? '1px solid var(--color-border)' : undefined,
                  background: 'var(--color-bg-subtle)',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Họ và tên"
                      style={{ ...addInputStyle, flex: 1 }}
                    />
                    <input
                      type="text"
                      value={newCccd}
                      onChange={e => setNewCccd(e.target.value)}
                      placeholder="Số CCCD (12 số)"
                      style={{ ...addInputStyle, width: 180, fontFamily: 'var(--font-mono)' }}
                    />
                    <input
                      type="text"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      style={{ ...addInputStyle, width: 150, fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      onClick={handleAddSecondary}
                      disabled={addingSecondary || !newName.trim() || !newCccd.trim()}
                      style={secondaryBtnStyle}
                    >
                      <Plus size={13} strokeWidth={2} />
                      Thêm
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EditForm({
  supplier, form, onChange, error, saving,
}: {
  supplier: Supplier;
  form: SupplierFormState;
  onChange: (patch: Partial<SupplierFormState>) => void;
  error: string | null;
  saving: boolean;
}) {
  const idLabel = supplier.hinh_thuc === 'Công ty' ? 'Mã số thuế (MST)' : 'Số CCCD';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: 16 }}>
      <LabeledInput label={idLabel} value={form.cccd_mst} onChange={v => onChange({ cccd_mst: v })} disabled={saving} mono />
      <LabeledInput label="Số điện thoại" value={form.so_dien_thoai} onChange={v => onChange({ so_dien_thoai: v })} disabled={saving} />
      <div style={{ gridColumn: '1 / -1' }}>
        <LabeledInput label="Địa chỉ" value={form.dia_chi} onChange={v => onChange({ dia_chi: v })} disabled={saving} />
      </div>
      {error && (
        <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SecondaryRow({
  supplier: s, showEdit, isLast,
}: {
  supplier: LocalSecondary;
  showEdit: boolean;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <td style={tdStyle}>
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.ten}</span>
        {s._local && (
          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
            chưa lưu
          </span>
        )}
      </td>
      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
        {s.cccd_mst}
      </td>
      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
        {s.so_dien_thoai ?? '—'}
      </td>
      {showEdit && (
        <td style={{ ...tdStyle, textAlign: 'right', width: 48 }}>
          <button style={rowEditBtnStyle} title="Chỉnh sửa">
            <Pencil size={12} strokeWidth={1.75} />
          </button>
        </td>
      )}
    </tr>
  );
}

function StatusBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--color-success)', flexShrink: 0,
      }} />
      <span style={{ color: 'var(--color-success-strong)', fontWeight: 500, fontSize: 'var(--font-size-xs)' }}>
        Đang hoạt động
      </span>
    </span>
  );
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function KV({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '8px 12px',
      background: 'var(--color-bg-subtle)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      textAlign: 'right',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
        color: 'var(--color-text-primary)', marginTop: 2,
      }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, flex, width }: { children?: React.ReactNode; flex?: boolean; width?: number }) {
  return (
    <th style={{
      padding: '10px 16px', textAlign: 'left',
      fontSize: 'var(--font-size-xs)', fontWeight: 500,
      color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
      width: flex ? undefined : (width ?? undefined),
    }}>
      {children}
    </th>
  );
}

function LabeledInput({
  label, value, onChange, disabled, mono = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  disabled: boolean; mono?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11,
        color: 'var(--color-text-tertiary)', marginBottom: 4,
      }}>
        {label}
      </label>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', height: 34, padding: '0 10px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
          background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
      Đang tải...
    </div>
  );
}

function NotFoundState() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
        Không tìm thấy nhà cung cấp này.
      </p>
      <Link href="/suppliers" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', textDecoration: 'none' }}>
        ← Quay lại danh sách
      </Link>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const tdStyle: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-primary)',
  verticalAlign: 'middle',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer', flexShrink: 0,
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34,
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 32, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
};

const rowEditBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28,
  borderRadius: 'var(--radius-sm)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
};

const addInputStyle: React.CSSProperties = {
  height: 32, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', outline: 'none', boxSizing: 'border-box',
};

const inlineInputStyle: React.CSSProperties = {
  height: 28, padding: '0 8px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 18, fontWeight: 500, outline: 'none',
  minWidth: 240,
};
