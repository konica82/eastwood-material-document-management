'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Building2, User, Pencil, MoreHorizontal,
  Download, Plus, Check, X,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Supplier, SecondarySupplier, LoaiHinhCongTy } from '@/types/index';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

type ChipFilter = 'all' | LoaiHinhCongTy;

// Local-only secondary (for inline-add before repo supports addSecondary)
interface LocalSecondary extends SecondarySupplier {
  _local?: true;
}

type EditForm = {
  ten: string; cccd_mst: string; so_dien_thoai: string;
  nguoi_dai_dien: string; dia_chi: string;
};

export default function SuppliersPage() {
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  // ── Data ──
  const [primaries, setPrimaries] = useState<Supplier[]>([]);
  const [allSecondaries, setAllSecondaries] = useState<SecondarySupplier[]>([]);
  const [loading, setLoading] = useState(true);

  // ── List state ──
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<ChipFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Detail: secondary list (per-selected supplier) ──
  const [detailSecondaries, setDetailSecondaries] = useState<LocalSecondary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Detail: edit state ──
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    ten: '', cccd_mst: '', so_dien_thoai: '', nguoi_dai_dien: '', dia_chi: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Detail: inline add secondary ──
  const [newName, setNewName] = useState('');
  const [newCccd, setNewCccd] = useState('');

  // ── Load primaries + all secondaries ──
  useEffect(() => {
    setLoading(true);
    const repo = getRepository('supplier');
    repo.list(activePlantId).then(async ps => {
      setPrimaries(ps);
      const nested = await Promise.all(ps.map(p => repo.listSecondary(activePlantId, p.id)));
      setAllSecondaries(nested.flat());
      if (ps.length > 0) setSelectedId(prev => prev ?? ps[0].id);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlantId]);

  // ── Load secondaries for selected supplier ──
  useEffect(() => {
    if (!selectedId) { setDetailSecondaries([]); return; }
    setDetailLoading(true);
    setEditing(false);
    setFormError(null);
    const repo = getRepository('supplier');
    repo.listSecondary(activePlantId, selectedId).then(secs => {
      setDetailSecondaries(secs);
      setDetailLoading(false);
    });
  }, [activePlantId, selectedId]);

  // ── Filter chip counts ──
  const chipCounts = useMemo(() => {
    const c: Record<LoaiHinhCongTy, number> = { HTX: 0, CP: 0, TNHH: 0, 'Cá nhân': 0 };
    primaries.forEach(p => { c[p.loai_hinh] = (c[p.loai_hinh] ?? 0) + 1; });
    return c;
  }, [primaries]);

  // ── Filtered list ──
  const filteredPrimaries = useMemo(() => {
    let list = primaries;
    if (chip !== 'all') list = list.filter(p => p.loai_hinh === chip);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.ten.toLowerCase().includes(q) || p.cccd_mst.toLowerCase().includes(q),
      );
    }
    return list;
  }, [primaries, chip, search]);

  // ── Selected supplier ──
  const selected = useMemo(
    () => primaries.find(p => p.id === selectedId) ?? null,
    [primaries, selectedId],
  );

  // ── Secondary count per supplier (for list items) ──
  const secCountMap = useMemo(() => {
    const m = new Map<string, number>();
    allSecondaries.forEach(s => m.set(s.nha_cung_cap_chinh_id, (m.get(s.nha_cung_cap_chinh_id) ?? 0) + 1));
    return m;
  }, [allSecondaries]);

  // ── Edit handlers ──
  function startEditing() {
    if (!selected) return;
    setForm({
      ten: selected.ten, cccd_mst: selected.cccd_mst,
      so_dien_thoai: selected.so_dien_thoai ?? '',
      nguoi_dai_dien: selected.nguoi_dai_dien ?? '',
      dia_chi: selected.dia_chi,
    });
    setFormError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!selected) return;
    if (!form.ten.trim()) { setFormError('Tên không được để trống.'); return; }
    if (!form.cccd_mst.trim()) { setFormError('Mã số không được để trống.'); return; }
    if (!form.dia_chi.trim()) { setFormError('Địa chỉ không được để trống.'); return; }
    setSaving(true); setFormError(null);
    try {
      const repo = getRepository('supplier');
      const updated = await repo.update(activePlantId, selected.id, {
        ten: form.ten.trim(), cccd_mst: form.cccd_mst.trim(),
        so_dien_thoai: form.so_dien_thoai.trim() || undefined,
        nguoi_dai_dien: form.nguoi_dai_dien.trim() || undefined,
        dia_chi: form.dia_chi.trim(),
      });
      setPrimaries(ps => ps.map(p => p.id === updated.id ? updated : p));
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
    if (!name || !cccd || !selectedId) return;
    const local: LocalSecondary = {
      id: `ncp-local-${Date.now()}`,
      ten: name, hinh_thuc: 'Cá nhân',
      cccd_mst: cccd, nha_cung_cap_chinh_id: selectedId, _local: true,
    };
    setDetailSecondaries(prev => [...prev, local]);
    setAllSecondaries(prev => [...prev, local]);
    setNewName(''); setNewCccd('');
  }

  const totalSecondaries = allSecondaries.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 'var(--space-4)', gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
            Nhà cung cấp
          </h1>
          {!loading && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              {primaries.length} nhà cung cấp chính · {totalSecondaries} nhà cung cấp phụ
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button style={ghostBtnStyle}>
            <Download size={13} strokeWidth={1.75} />
            Xuất Excel
          </button>
          <button style={primaryBtnStyle}>
            <Plus size={13} strokeWidth={2} />
            Thêm nhà cung cấp
          </button>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

        {/* ── Left panel ── */}
        <div style={{
          width: 316, flexShrink: 0,
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)', overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Tìm theo tên, mã, MST..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 32, paddingLeft: 28, paddingRight: 10,
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div style={{
            padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <Chip active={chip === 'all'} onClick={() => setChip('all')}>
              Tất cả {primaries.length}
            </Chip>
            {chipCounts.HTX > 0 && (
              <Chip active={chip === 'HTX'} onClick={() => setChip('HTX')}>HTX {chipCounts.HTX}</Chip>
            )}
            {chipCounts.CP > 0 && (
              <Chip active={chip === 'CP'} onClick={() => setChip('CP')}>CP {chipCounts.CP}</Chip>
            )}
            {chipCounts.TNHH > 0 && (
              <Chip active={chip === 'TNHH'} onClick={() => setChip('TNHH')}>TNHH {chipCounts.TNHH}</Chip>
            )}
            {chipCounts['Cá nhân'] > 0 && (
              <Chip active={chip === 'Cá nhân'} onClick={() => setChip('Cá nhân')}>Cá nhân {chipCounts['Cá nhân']}</Chip>
            )}
          </div>

          {/* List */}
          {loading ? (
            <ListSkeleton />
          ) : filteredPrimaries.length === 0 ? (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)',
            }}>
              Không tìm thấy kết quả.
            </div>
          ) : filteredPrimaries.map(s => (
            <SupplierListItem
              key={s.id}
              supplier={s}
              secCount={secCountMap.get(s.id) ?? 0}
              active={s.id === selectedId}
              onClick={() => setSelectedId(s.id)}
            />
          ))}
        </div>

        {/* ── Right panel ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ ...cardStyle, padding: 20 }}><DetailSkeleton /></div>
          ) : !selected ? (
            <div style={{
              ...cardStyle, padding: 40, textAlign: 'center',
              color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)',
            }}>
              Chọn nhà cung cấp để xem chi tiết.
            </div>
          ) : (
            <>
              {/* Hero card */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 16,
                }}>
                  {/* Identity */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--color-accent-subtle)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-accent)', flexShrink: 0,
                    }}>
                      {selected.hinh_thuc === 'Công ty'
                        ? <Building2 size={18} strokeWidth={1.75} />
                        : <User size={18} strokeWidth={1.75} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)',
                        lineHeight: 1.3, marginBottom: 6,
                      }}>
                        {selected.ten}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          color: 'var(--color-text-tertiary)',
                          background: 'var(--color-bg-subtle)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '1px 6px',
                        }}>
                          {selected.id.toUpperCase()}
                        </span>
                        <StatusBadge />
                        {selected.chung_chi && <CertBadge label={selected.chung_chi} />}
                      </div>
                    </div>
                  </div>

                  {/* Actions + mini stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {editing ? (
                          <>
                            <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                              <Check size={13} strokeWidth={2} />
                              {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              onClick={() => { setEditing(false); setFormError(null); }}
                              disabled={saving} style={secondaryBtnStyle}
                            >
                              <X size={13} strokeWidth={2} />
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={startEditing} style={secondaryBtnStyle}>
                              <Pencil size={13} strokeWidth={1.75} />
                              Sửa thông tin
                            </button>
                            <button style={iconBtnStyle}>
                              <MoreHorizontal size={14} strokeWidth={1.75} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <MiniStat label="Lượt giao 30N" value="—" />
                      <MiniStat label="Khối lượng 30N" value="—" />
                      <MiniStat label="Lô rừng" value={
                        detailSecondaries.reduce((a, s) => a + (s.lo_rung ?? 0), 0) > 0
                          ? String(detailSecondaries.reduce((a, s) => a + (s.lo_rung ?? 0), 0))
                          : '—'
                      } />
                    </div>
                  </div>
                </div>

                {/* KV grid */}
                <div style={{ marginTop: 16 }}>
                  {editing ? (
                    <EditFields form={form} onChange={p => setForm(f => ({ ...f, ...p }))} saving={saving} />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', fontSize: 13 }}>
                      <KV label="Mã số thuế" value={<span style={{ fontFamily: 'var(--font-mono)' }}>{selected.cccd_mst}</span>} />
                      <KV label="Người đại diện" value={selected.nguoi_dai_dien ?? '—'} />
                      <KV label="Số điện thoại" value={<span style={{ fontFamily: 'var(--font-mono)' }}>{selected.so_dien_thoai ?? '—'}</span>} />
                      <KV label="Ngày đăng ký" value={<span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(selected.created_at)}</span>} />
                      <KV label="Địa chỉ" value={selected.dia_chi} span={2} />
                    </div>
                  )}
                </div>

                {formError && (
                  <p style={{ margin: '12px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
                    {formError}
                  </p>
                )}
              </div>

              {/* Secondary suppliers card */}
              <div style={{ ...cardStyle, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        Nhà cung cấp phụ
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-full)', padding: '1px 7px',
                        color: 'var(--color-text-tertiary)',
                      }}>
                        {detailSecondaries.length}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      Các hộ rừng cá nhân thuộc {selected.ten} · tổng cổ phần{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 500 }}>
                        {detailSecondaries.reduce((a, s) => a + (s.co_phan_phan_tram ?? 0), 0)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={ghostBtnStyle}>
                      <Download size={12} strokeWidth={1.75} />
                      Xuất danh sách
                    </button>
                    {canEdit && (
                      <button style={ghostBtnStyle}>
                        <Plus size={12} strokeWidth={2} />
                        Thêm nhanh
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                {detailLoading ? (
                  <div style={{
                    padding: '24px 20px', textAlign: 'center',
                    fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)',
                  }}>
                    Đang tải...
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-table-header-bg)' }}>
                        <Th flex>Họ tên</Th>
                        <Th>CCCD</Th>
                        <Th>Tham gia</Th>
                        <Th align="right" width={110}>Cổ phần</Th>
                        <Th align="right" width={72}>Lô rừng</Th>
                        {canEdit && <Th width={44} />}
                      </tr>
                    </thead>
                    <tbody>
                      {detailSecondaries.length === 0 && (
                        <tr>
                          <td colSpan={canEdit ? 6 : 5} style={{
                            padding: '24px 20px', textAlign: 'center',
                            color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)',
                          }}>
                            Chưa có nhà cung cấp phụ nào.
                          </td>
                        </tr>
                      )}
                      {detailSecondaries.map(s => (
                        <SecondaryRow key={s.id} supplier={s} showEdit={canEdit} />
                      ))}

                      {/* Inline add row */}
                      {canEdit && (
                        <tr>
                          <td colSpan={canEdit ? 6 : 5} style={{
                            padding: '10px 16px',
                            borderTop: detailSecondaries.length > 0 ? '1px solid var(--color-border)' : undefined,
                            background: 'var(--color-bg-subtle)',
                          }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="text" value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSecondary()}
                                placeholder="Họ và tên"
                                style={{ ...addInputStyle, flex: 1 }}
                              />
                              <input
                                type="text" value={newCccd}
                                onChange={e => setNewCccd(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSecondary()}
                                placeholder="Số CCCD (12 số)"
                                style={{ ...addInputStyle, width: 180, fontFamily: 'var(--font-mono)' }}
                              />
                              <button
                                onClick={handleAddSecondary}
                                disabled={!newName.trim() || !newCccd.trim()}
                                style={secondaryBtnStyle}
                              >
                                <Plus size={12} strokeWidth={2} />
                                Thêm
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Left panel components ────────────────────────────────────────────────────

function SupplierListItem({
  supplier: s, secCount, active, onClick,
}: {
  supplier: Supplier; secCount: number; active: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left', border: 'none',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 12px',
        background: active
          ? 'var(--color-accent-subtle)'
          : hovered ? 'var(--color-bg-subtle)' : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-md)',
        background: active ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
        border: active ? 'none' : '1px solid var(--color-border)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
        flexShrink: 0,
      }}>
        {s.hinh_thuc === 'Công ty'
          ? <Building2 size={14} strokeWidth={1.75} />
          : <User size={14} strokeWidth={1.75} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 'var(--font-size-sm)', fontWeight: 500,
          color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {s.ten}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {s.id.toUpperCase()} · {secCount} NCC phụ
        </div>
      </div>
    </button>
  );
}

function Chip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: 26, padding: '0 10px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
        background: active ? 'var(--color-accent-subtle)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        fontSize: 12, fontWeight: active ? 500 : 400,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all var(--duration-fast) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Detail sub-components ────────────────────────────────────────────────────

function EditFields({
  form, onChange, saving,
}: {
  form: EditForm; onChange: (patch: Partial<EditForm>) => void; saving: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
      <LabeledInput label="Mã số thuế / CCCD" value={form.cccd_mst} onChange={v => onChange({ cccd_mst: v })} disabled={saving} mono />
      <LabeledInput label="Người đại diện" value={form.nguoi_dai_dien} onChange={v => onChange({ nguoi_dai_dien: v })} disabled={saving} />
      <LabeledInput label="Số điện thoại" value={form.so_dien_thoai} onChange={v => onChange({ so_dien_thoai: v })} disabled={saving} />
      <div style={{ gridColumn: '1 / -1' }}>
        <LabeledInput label="Địa chỉ" value={form.dia_chi} onChange={v => onChange({ dia_chi: v })} disabled={saving} />
      </div>
    </div>
  );
}

function SecondaryRow({ supplier: s, showEdit }: { supplier: LocalSecondary; showEdit: boolean }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={13} strokeWidth={1.75} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.ten}</span>
          {s._local && (
            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
              chưa lưu
            </span>
          )}
        </div>
      </td>
      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', fontSize: 12 }}>
        {s.cccd_mst}
      </td>
      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {s.ngay_tham_gia ? fmtDate(s.ngay_tham_gia) : '—'}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {s.co_phan_phan_tram !== undefined ? (
          <ShareBar value={s.co_phan_phan_tram} />
        ) : '—'}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
        {s.lo_rung ?? '—'}
      </td>
      {showEdit && (
        <td style={{ ...tdStyle, textAlign: 'right', width: 44 }}>
          <button style={rowEditBtnStyle} title="Chỉnh sửa">
            <Pencil size={12} strokeWidth={1.75} />
          </button>
        </td>
      )}
    </tr>
  );
}

function ShareBar({ value }: { value: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', width: 90 }}>
      <div style={{
        flex: 1, height: 5, borderRadius: 3,
        background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: 'var(--color-accent)' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)', width: 30, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

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
      padding: '7px 12px', minWidth: 86,
      background: 'var(--color-bg-subtle)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      textAlign: 'right',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
      <span style={{ color: 'var(--color-success-strong)', fontWeight: 500 }}>Đang hoạt động</span>
    </span>
  );
}

function CertBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      color: 'var(--color-text-secondary)',
      background: 'var(--color-bg-subtle)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '1px 6px',
    }}>
      {label}
    </span>
  );
}

function Th({ children, flex, align, width }: {
  children?: React.ReactNode; flex?: boolean; align?: 'right'; width?: number;
}) {
  return (
    <th style={{
      padding: '10px 16px', textAlign: align ?? 'left',
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
      <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', height: 32, padding: '0 10px',
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

function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          height: 60, borderBottom: '1px solid var(--color-border)',
          background: i % 2 === 0 ? 'var(--color-bg-surface)' : 'var(--color-bg-subtle)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          height: 20, marginBottom: 12,
          background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)',
          width: ['60%', '40%', '80%'][i],
        }} />
      ))}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-surface)',
};

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
  height: 32, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer', flexShrink: 0,
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 32, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32,
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};

const rowEditBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28,
  borderRadius: 'var(--radius-sm)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
};

const addInputStyle: React.CSSProperties = {
  height: 30, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', outline: 'none', boxSizing: 'border-box',
};
