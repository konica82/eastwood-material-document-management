'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronRight, Printer, Pencil, MoreHorizontal,
  Check, X, Minus,
  LayoutGrid, Scale, Image as ImageIcon, ShieldCheck,
  LogIn, LogOut, Package,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { cargoApi } from '@/lib/api-client';
import { fmtDateTime, fmtTime } from '@/lib/fmt';
import { useParams } from 'next/navigation';
import type { Cargo, CargoStatus } from '@/types/index';

// ─── Status colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CargoStatus, { bg: string; fg: string; border: string }> = {
  'Chờ lượt':   { bg: 'var(--color-warning-subtle)',  fg: 'var(--color-warning)',  border: 'var(--color-warning-muted)' },
  'Đang xử lý': { bg: 'var(--color-info-subtle)',     fg: 'var(--color-info)',     border: 'var(--color-info-muted)' },
  'Hoàn thành': { bg: 'var(--color-success-subtle)',  fg: 'var(--color-success)',  border: 'var(--color-success-muted)' },
  'Hủy lượt':   { bg: 'var(--color-danger-subtle)',   fg: 'var(--color-danger)',   border: 'var(--color-danger-muted)' },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'weighing' | 'photos' | 'monitor';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  getCount?: (c: Cargo) => number;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Tổng quan',             icon: <LayoutGrid  size={14} strokeWidth={1.75} /> },
  { id: 'weighing', label: 'Cân hàng',              icon: <Scale       size={14} strokeWidth={1.75} />,
    getCount: c => c.phieu_can ? (c.phieu_can.dlc_ngay_can_ra ? 2 : 1) : 0 },
  { id: 'photos',   label: 'Hình ảnh',              icon: <ImageIcon   size={14} strokeWidth={1.75} />,
    getCount: c => c.trang_thai === 'Hoàn thành' ? 8 : (c.phieu_can ? 3 : 0) },
  { id: 'monitor',  label: 'Giám sát & hoàn thành', icon: <ShieldCheck size={14} strokeWidth={1.75} /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CargoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: cargoData = null, isLoading: loading } = useQuery({
    queryKey: ['cargo', activePlantId, id],
    queryFn: () => cargoApi.get(activePlantId, id),
  });

  const [localCargo, setLocalCargo] = useState<Cargo | null>(null);
  const displayCargo = localCargo ?? cargoData;

  const statusMutation = useMutation({
    mutationFn: ({ status, ly_do_huy }: { status: CargoStatus; ly_do_huy?: string }) =>
      cargoApi.updateStatus(activePlantId, id, status, ly_do_huy),
    onSuccess: (updated) => {
      setLocalCargo(updated);
      queryClient.invalidateQueries({ queryKey: ['cargo', activePlantId] });
      setShowCancelModal(false);
      setCancelReason('');
    },
    onError: (err) => setCancelError(err instanceof Error ? err.message : 'Lỗi'),
  });

  const dossierMutation = useMutation({
    mutationFn: () => cargoApi.completeDossier(activePlantId, id),
    onSuccess: (updated) => {
      setLocalCargo(updated);
      queryClient.invalidateQueries({ queryKey: ['cargo', activePlantId] });
    },
  });

  const saving = statusMutation.isPending || dossierMutation.isPending;

  function handleUpdateStatus(status: CargoStatus, lyDoHuy?: string) {
    statusMutation.mutate({ status, ly_do_huy: lyDoHuy });
  }

  function handleCompleteDossier() {
    dossierMutation.mutate();
  }

  const notFound = !loading && !displayCargo;

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>Đang tải...</div>;
  }

  if (notFound || !displayCargo) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>Không tìm thấy chuyến xe này.</p>
        <Link href="/cargo" style={backLinkStyle}>← Danh sách lượt cân</Link>
      </div>
    );
  }

  const cargo = displayCargo!;
  const net = cargo.phieu_can?.dlc_trong_luong_hang ?? null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <Link href="/cargo" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Xe hàng</Link>
        <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{cargo.so_xe}</span>
      </div>

      {/* Summary header card */}
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {/* Left: id tag + plate + status + material */}
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
              Lượt cân · <span style={{ fontFamily: 'var(--font-mono)' }}>{cargo.id}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
              {cargo.so_xe}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <StatusBadge status={cargo.trang_thai} />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{cargo.nguyen_lieu?.ten ?? '—'}</span>
            </div>
          </div>

          {/* Summary stats */}
          <SummaryStat
            label="Tài xế"
            value={cargo.tai_xe?.ten ?? '—'}
            sub={cargo.tai_xe?.cccd ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{cargo.tai_xe.cccd}</span> : null}
          />
          <SummaryStat
            label="Cân vào"
            value={cargo.phieu_can ? fmtTime(cargo.phieu_can.dlc_ngay_can_vao) : '—'}
            mono
            sub={cargo.phieu_can
              ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  {cargo.phieu_can.dlc_can_vao.toLocaleString('vi-VN')} kg
                </span>
              : null}
          />
          <SummaryStat
            label="Cân ra"
            value={cargo.phieu_can?.dlc_ngay_can_ra ? fmtTime(cargo.phieu_can.dlc_ngay_can_ra) : '—'}
            mono
            sub={cargo.phieu_can?.dlc_can_ra != null
              ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  {cargo.phieu_can.dlc_can_ra.toLocaleString('vi-VN')} kg
                </span>
              : null}
          />
          <SummaryStat
            label="Khối lượng tịnh"
            value={net != null ? `${net.toLocaleString('vi-VN')} kg` : '—'}
            mono
            accent
          />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', marginLeft: 'auto' }}>
            <button style={secBtnStyle}><Printer size={14} strokeWidth={1.75} /> In phiếu</button>
            {canEdit && <button style={secBtnStyle}><Pencil size={14} strokeWidth={1.75} /> Sửa</button>}
            <button style={{ ...secBtnStyle, padding: '0 9px' }}><MoreHorizontal size={14} strokeWidth={1.75} /></button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
        {TABS.map(tab => {
          const count = tab.getCount ? tab.getCount(cargo) : undefined;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 14px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1,
                whiteSpace: 'nowrap',
                transition: 'color var(--duration-fast) var(--ease-out)',
              }}
            >
              {tab.icon}
              {tab.label}
              {count != null && count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 500, minWidth: 16, textAlign: 'center',
                  background: active ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  borderRadius: 9999, padding: '0 5px',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab cargo={cargo} />}
      {activeTab === 'weighing' && <WeighingTab cargo={cargo} />}
      {activeTab === 'photos'   && <PhotosTab cargo={cargo} />}
      {activeTab === 'monitor'  && (
        <MonitorTab
          cargo={cargo}
          canEdit={canEdit}
          saving={saving}
          onUpdateStatus={handleUpdateStatus}
          onCancel={() => setShowCancelModal(true)}
          onCompleteDossier={handleCompleteDossier}
        />
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <CancelModal
          reason={cancelReason}
          onChange={setCancelReason}
          error={cancelError}
          saving={saving}
          onConfirm={() => {
            if (!cancelReason.trim()) { setCancelError('Vui lòng nhập lý do hủy.'); return; }
            setCancelError(null);
            handleUpdateStatus('Hủy lượt', cancelReason.trim());
          }}
          onClose={() => { setShowCancelModal(false); setCancelReason(''); setCancelError(null); }}
        />
      )}
    </div>
  );
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

function SummaryStat({ label, value, sub, mono, accent }: {
  label: string; value: string; sub?: React.ReactNode; mono?: boolean; accent?: boolean;
}) {
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 16, fontWeight: 500,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
        lineHeight: 1.25,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CargoStatus }) {
  const col = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 500,
      padding: '2px 8px', borderRadius: 9999,
      background: col.bg, color: col.fg, border: `1px solid ${col.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col.fg, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ─── Card primitives ──────────────────────────────────────────────────────────

function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-surface)',
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)',
        }}>
          {title}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Row({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      gap: 16,
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ cargo }: { cargo: Cargo }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
      {/* Info card */}
      <Card title="Thông tin lượt cân">
        <Row label="Mã lượt cân">
          <span style={{ fontFamily: 'var(--font-mono)' }}>{cargo.id}</span>
        </Row>
        <Row label="Biển số xe">
          <span style={{ fontFamily: 'var(--font-mono)' }}>{cargo.so_xe}</span>
        </Row>
        <Row label="Tài xế">
          <span>
            {cargo.tai_xe?.ten ?? '—'}
            {cargo.tai_xe?.cccd && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                {cargo.tai_xe.cccd}
              </span>
            )}
          </span>
        </Row>
        <Row label="Nguyên liệu">{cargo.nguyen_lieu?.ten ?? '—'}</Row>
        <Row label="Nhà cung cấp chính">{cargo.nha_cung_cap?.ten ?? '—'}</Row>
        {cargo.nha_cung_cap_phu && (
          <Row label="Nhà cung cấp phụ">
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 11, fontWeight: 500,
              padding: '1px 6px', borderRadius: 9999,
              background: 'var(--color-info-subtle)', color: 'var(--color-info)',
              border: '1px solid var(--color-info-muted)',
            }}>
              1 đơn vị
            </span>
          </Row>
        )}
        <Row label="Lô rừng">
          <span style={{ fontFamily: 'var(--font-mono)' }}>{cargo.plot?.PlotID ?? '—'}</span>
        </Row>
        <Row label="Trạng thái"><StatusBadge status={cargo.trang_thai} /></Row>
        <Row label="Tạo lúc" last>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDateTime(cargo.created_at)}</span>
        </Row>
      </Card>

      {/* Timeline card */}
      <Card title="Dòng thời gian">
        <Timeline cargo={cargo} />
      </Card>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ cargo }: { cargo: Cargo }) {
  const weighInMs = cargo.phieu_can ? new Date(cargo.phieu_can.dlc_ngay_can_vao).getTime() : null;
  const weighOutMs = cargo.phieu_can?.dlc_ngay_can_ra ? new Date(cargo.phieu_can.dlc_ngay_can_ra).getTime() : null;

  const events = [
    {
      t: cargo.created_at,
      label: 'Tạo lượt cân', icon: 'plus', done: true,
    },
    {
      t: cargo.phieu_can?.dlc_ngay_can_vao ?? null,
      label: 'Cân vào', icon: 'scale', done: !!cargo.phieu_can,
    },
    {
      t: weighInMs ? new Date(weighInMs + 25 * 60_000).toISOString() : null,
      label: 'Kiểm tra QC', icon: 'shield',
      done: cargo.trang_thai === 'Hoàn thành' || cargo.trang_thai === 'Đang xử lý',
    },
    {
      t: cargo.phieu_can?.dlc_ngay_can_ra ?? null,
      label: 'Cân ra', icon: 'scale', done: !!cargo.phieu_can?.dlc_ngay_can_ra,
    },
    {
      t: weighOutMs ? new Date(weighOutMs + 5 * 60_000).toISOString() : null,
      label: 'Hoàn tất', icon: 'check', done: cargo.trang_thai === 'Hoàn thành',
    },
  ];

  return (
    <div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
          {/* Dot + connector line */}
          <div style={{ position: 'relative', width: 24, flexShrink: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: e.done ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
              color: e.done ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              border: `1px solid ${e.done ? 'var(--color-accent)' : 'var(--color-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {e.done
                ? <Check size={11} strokeWidth={2.5} />
                : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-border)' }} />
              }
            </div>
            {i < events.length - 1 && (
              <div style={{
                position: 'absolute', left: 11, top: 24, width: 2, height: 18,
                background: e.done ? 'var(--color-accent)' : 'var(--color-border)',
                opacity: e.done ? 0.3 : 1,
              }} />
            )}
          </div>

          {/* Label + time */}
          <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? 2 : 0 }}>
            <div style={{ fontSize: 13, color: e.done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
              {e.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
              {e.t ? fmtDateTime(e.t) : 'Chưa thực hiện'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Weighing tab ─────────────────────────────────────────────────────────────

function WeighingTab({ cargo }: { cargo: Cargo }) {
  const slip = cargo.phieu_can;
  const net = slip?.dlc_trong_luong_hang ?? null;

  if (!slip) {
    return (
      <Card>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Scale size={28} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            Chưa có lần cân nào cho lượt này.
          </p>
          <button style={secBtnSmStyle}>Tạo phiếu cân</button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      <WeighCard
        label="Cân vào"
        time={slip.dlc_ngay_can_vao}
        weight={slip.dlc_can_vao}
        status="done"
      />
      <WeighCard
        label="Cân ra"
        time={slip.dlc_ngay_can_ra}
        weight={slip.dlc_can_ra}
        status={slip.dlc_ngay_can_ra ? 'done' : 'pending'}
      />

      {/* Net weight card */}
      <div style={{
        border: `1px solid ${net != null ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        padding: 16,
      }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Khối lượng tịnh</div>
        {net != null ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--color-accent)' }}>
              {net.toLocaleString('vi-VN')}{' '}
              <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>kg</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {slip.dlc_can_vao.toLocaleString('vi-VN')} − {slip.dlc_can_ra!.toLocaleString('vi-VN')}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              —{' '}<span style={{ fontSize: 14 }}>kg</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              Chờ cân ra để tính khối lượng tịnh
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WeighCard({ label, time, weight, status }: {
  label: string; time: string | null; weight: number | null; status: 'done' | 'pending';
}) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-surface)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</div>
        {status === 'done'
          ? <DotBadge tone="success">Đã ghi</DotBadge>
          : <DotBadge tone="warning">Chờ</DotBadge>
        }
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: weight ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
        {weight ? weight.toLocaleString('vi-VN') : '—'}{' '}
        <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>kg</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
        {time ? fmtDateTime(time) : 'Chưa cân'}
      </div>
      <div style={{
        marginTop: 12, padding: '10px 12px',
        background: 'var(--color-bg-subtle)', borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'var(--color-text-secondary)',
      }}>
        <ImageIcon size={13} style={{ color: weight ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }} />
        <span>{weight ? 'Ảnh đồng hồ cân (1)' : 'Chưa có ảnh đồng hồ'}</span>
      </div>
    </div>
  );
}

// ─── Photos tab ───────────────────────────────────────────────────────────────

function PhotosTab({ cargo }: { cargo: Cargo }) {
  const isCompleted = cargo.trang_thai === 'Hoàn thành';
  const hasWeighIn = !!cargo.phieu_can;

  const groups = [
    { name: 'Ảnh xe vào',      count: 3,                        icon: <LogIn   size={14} strokeWidth={1.75} /> },
    { name: 'Ảnh đồng hồ cân', count: isCompleted ? 2 : (hasWeighIn ? 1 : 0), icon: <Scale   size={14} strokeWidth={1.75} /> },
    { name: 'Ảnh nguyên liệu', count: isCompleted ? 2 : 0,      icon: <Package size={14} strokeWidth={1.75} /> },
    { name: 'Ảnh xe ra',       count: isCompleted ? 1 : 0,      icon: <LogOut  size={14} strokeWidth={1.75} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map(g => (
        <div key={g.name}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{g.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{g.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                padding: '1px 6px', borderRadius: 9999,
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-tertiary)',
                border: '1px solid var(--color-border)',
              }}>{g.count}</span>
            </div>
            <button style={secBtnSmStyle}>
              <ImageIcon size={12} strokeWidth={1.75} />
              Thêm ảnh
            </button>
          </div>

          {g.count > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {Array.from({ length: g.count }).map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '4 / 3', borderRadius: 8,
                  background: 'repeating-linear-gradient(135deg, var(--color-bg-subtle) 0 6px, var(--color-bg-surface) 6px 12px)',
                  border: '1px solid var(--color-border)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <ImageIcon size={20} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10, color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-surface)', padding: '1px 5px', borderRadius: 4,
                    border: '1px solid var(--color-border)',
                  }}>
                    {fmtTime(new Date(new Date(cargo.created_at).getTime() + i * 5 * 60_000).toISOString())}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '20px', textAlign: 'center',
              border: '1px dashed var(--color-border)', borderRadius: 8,
              color: 'var(--color-text-tertiary)', fontSize: 13,
            }}>
              Chưa có ảnh trong nhóm này.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Monitor tab ──────────────────────────────────────────────────────────────

function MonitorTab({ cargo, canEdit, saving, onUpdateStatus, onCancel, onCompleteDossier }: {
  cargo: Cargo;
  canEdit: boolean;
  saving: boolean;
  onUpdateStatus: (status: CargoStatus) => void;
  onCancel: () => void;
  onCompleteDossier: () => void;
}) {
  const isCompleted  = cargo.trang_thai === 'Hoàn thành';
  const isInProgress = cargo.trang_thai === 'Đang xử lý';
  const isCancelled  = cargo.trang_thai === 'Hủy lượt';

  const checks: Array<{ label: string; ok: boolean; by: string; t: string | null }> = [
    { label: 'Giấy tờ rừng đầy đủ',      ok: true,         by: 'Lê Thị Hồng',   t: cargo.created_at },
    { label: 'Khối lượng cân khớp phiếu', ok: isCompleted,  by: 'Hệ thống',       t: cargo.phieu_can?.dlc_ngay_can_ra ?? null },
    { label: 'Nguyên liệu đúng loại',     ok: !isCancelled, by: 'Nguyễn Văn Đức', t: cargo.phieu_can?.dlc_ngay_can_vao ?? null },
    { label: 'Ảnh đồng hồ cân rõ nét',   ok: true,         by: 'Hệ thống',       t: cargo.phieu_can?.dlc_ngay_can_vao ?? null },
    { label: 'Tài xế ký xác nhận',        ok: isCompleted,  by: cargo.tai_xe?.ten ?? 'Tài xế', t: cargo.phieu_can?.dlc_ngay_can_ra ?? null },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
      {/* Checklist card */}
      <Card title="Danh sách kiểm tra hoàn tất">
        {checks.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderBottom: i < checks.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: c.ok ? 'var(--color-success-subtle)' : 'var(--color-bg-subtle)',
              color: c.ok ? 'var(--color-success)' : 'var(--color-text-tertiary)',
              border: `1px solid ${c.ok ? 'var(--color-success-muted)' : 'var(--color-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.ok
                ? <Check size={12} strokeWidth={2.5} />
                : <Minus size={12} strokeWidth={2} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: c.ok ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {c.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                {c.ok
                  ? <>Bởi {c.by}{c.t && <span style={{ fontFamily: 'var(--font-mono)' }}> · {fmtTime(c.t)}</span>}</>
                  : 'Đang chờ'
                }
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Conclusion card */}
      <Card title="Kết luận giám sát">
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          {isCompleted ? (
            <>Lượt cân đã được kiểm tra đầy đủ. Khối lượng và nguyên liệu khớp với phiếu đăng ký. Hồ sơ rừng nguồn gốc hợp lệ.</>
          ) : isCancelled ? (
            <>Lượt cân đã bị hủy. Lý do:{' '}
              <span style={{ color: 'var(--color-danger)' }}>{cargo.ly_do_huy ?? 'Không rõ'}</span>.
            </>
          ) : (
            <>Đang chờ hoàn tất các bước kiểm tra trước khi đóng lượt cân.</>
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isInProgress && (
              <button onClick={() => onUpdateStatus('Hoàn thành')} disabled={saving} style={primBtnStyle}>
                <Check size={13} strokeWidth={2} />
                Hoàn tất lượt cân
              </button>
            )}
            {(isInProgress || cargo.trang_thai === 'Chờ lượt') && (
              <button onClick={onCancel} disabled={saving} style={secBtnStyle}>
                <X size={13} strokeWidth={2} />
                Hủy lượt
              </button>
            )}
            {isCompleted && !cargo.hsls_hoan_thanh && (
              <button onClick={onCompleteDossier} disabled={saving} style={secBtnStyle}>
                <Check size={13} strokeWidth={2} />
                Xác nhận hồ sơ hoàn chỉnh
              </button>
            )}
            {isCompleted && (
              <button style={secBtnStyle}>
                Tải biên bản PDF
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({ reason, onChange, error, saving, onConfirm, onClose }: {
  reason: string; onChange: (v: string) => void;
  error: string | null; saving: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', padding: 16,
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        width: '100%', maxWidth: 440,
        padding: 24,
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>
          Hủy lượt xe
        </h2>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Lý do hủy <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => onChange(e.target.value)}
          disabled={saving}
          placeholder="Nhập lý do hủy lượt..."
          rows={3}
          style={{
            width: '100%', padding: 10,
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
            fontSize: 13, resize: 'vertical',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={secBtnStyle}>Không hủy</button>
          <button onClick={onConfirm} disabled={saving} style={dangerBtnStyle}>
            <X size={13} strokeWidth={2} />
            {saving ? 'Đang lưu...' : 'Xác nhận hủy lượt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dot badge ────────────────────────────────────────────────────────────────

function DotBadge({ tone, children }: { tone: 'success' | 'warning'; children: React.ReactNode }) {
  const fg     = tone === 'success' ? 'var(--color-success)'        : 'var(--color-warning)';
  const bg     = tone === 'success' ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)';
  const border = tone === 'success' ? 'var(--color-success-muted)'  : 'var(--color-warning-muted)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500,
      padding: '2px 7px', borderRadius: 9999,
      background: bg, color: fg, border: `1px solid ${border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg }} />
      {children}
    </span>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none',
};

const secBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer',
};

const primBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const dangerBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-danger)', color: 'white',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
};

const secBtnSmStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  height: 30, padding: '0 10px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)',
  fontSize: 12, cursor: 'pointer',
};
