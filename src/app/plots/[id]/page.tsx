'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronRight, Printer, ExternalLink, Pencil, Check, X, Copy,
  Info, Users, MapPin, FileText, Download, AlertTriangle,
  CheckCircle, AlertCircle, Clock, Minus, Trees,
} from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { plotApi } from '@/lib/api-client';
import { fmtDate } from '@/lib/fmt';
import type { PlotRegistry, DeforestationRiskStatus, PlotOwner, PolygonCoordinate, PlotDocument } from '@/types/index';

// ─── Risk helpers ─────────────────────────────────────────────────────────────

const RISK_LABEL: Record<DeforestationRiskStatus, string> = {
  'Thấp':           'Rủi ro thấp',
  'Trung bình':     'Rủi ro vừa',
  'Cao':            'Rủi ro cao',
  'Chưa đánh giá':  'Chưa đánh giá',
};

const RISK_TONE: Record<DeforestationRiskStatus, 'success' | 'warning' | 'danger'> = {
  'Thấp':           'success',
  'Trung bình':     'warning',
  'Cao':            'danger',
  'Chưa đánh giá':  'success',
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'owners' | 'boundary' | 'documents';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'info',      label: 'Thông tin',    icon: <Info     size={14} strokeWidth={1.75} /> },
  { id: 'owners',    label: 'Chủ sở hữu',  icon: <Users    size={14} strokeWidth={1.75} /> },
  { id: 'boundary',  label: 'Ranh giới',   icon: <MapPin   size={14} strokeWidth={1.75} /> },
  { id: 'documents', label: 'Tài liệu',    icon: <FileText size={14} strokeWidth={1.75} /> },
];

// ─── Edit form type ───────────────────────────────────────────────────────────

type EditForm = {
  LandTitle:               string;
  TreeSpecies:             string;
  DeforestationRiskStatus: DeforestationRiskStatus;
  certificate:             string;
  cert_id:                 string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activePlantId, roleAtPlant } = usePlant();
  const canEdit = roleAtPlant(activePlantId) !== 'User';

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState<EditForm>({ LandTitle: '', TreeSpecies: '', DeforestationRiskStatus: 'Thấp', certificate: '', cert_id: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: plotData = null, isLoading: loading } = useQuery({
    queryKey: ['plots', activePlantId, id],
    queryFn: () => plotApi.getWithDetails(activePlantId, id),
  });
  const [localPlot, setLocalPlot] = useState<PlotRegistry | null>(null);
  const displayPlot = localPlot ?? plotData;

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<PlotRegistry>) => plotApi.update(activePlantId, id, patch),
    onSuccess: (updated) => {
      setLocalPlot(prev => prev ? { ...prev, ...updated } : (displayPlot ? { ...displayPlot, ...updated } : updated));
      queryClient.invalidateQueries({ queryKey: ['plots', activePlantId] });
      setEditing(false);
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu.'),
  });

  const saving = saveMutation.isPending;
  const notFound = !loading && !displayPlot;

  function startEditing() {
    if (!displayPlot) return;
    setForm({
      LandTitle:               displayPlot.LandTitle,
      TreeSpecies:             displayPlot.TreeSpecies,
      DeforestationRiskStatus: displayPlot.DeforestationRiskStatus,
      certificate:             displayPlot.certificate ?? '',
      cert_id:                 displayPlot.cert_id ?? '',
    });
    setFormError(null);
    setEditing(true);
  }

  function handleSave() {
    if (!displayPlot) return;
    if (!form.LandTitle.trim())  { setFormError('Số giấy chứng nhận không được để trống.'); return; }
    if (!form.TreeSpecies.trim()) { setFormError('Loài cây không được để trống.'); return; }
    setFormError(null);
    saveMutation.mutate({
      LandTitle:               form.LandTitle.trim(),
      TreeSpecies:             form.TreeSpecies.trim(),
      DeforestationRiskStatus: form.DeforestationRiskStatus,
      certificate:             form.certificate.trim() || null,
      cert_id:                 form.cert_id.trim() || null,
    });
  }

  // ── Loading / error states ──
  if (loading && !displayPlot) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
        Đang tải hồ sơ lô rừng...
      </div>
    );
  }
  if (notFound || !displayPlot) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'var(--space-12)', textAlign: 'center' }}>
        <Trees size={36} strokeWidth={1.25} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 16px' }}>
          Không tìm thấy lô rừng <span style={{ fontFamily: 'var(--font-mono)' }}>{id}</span>.
        </p>
        <Link href="/plots" style={{ color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)', textDecoration: 'none' }}>
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const plot = displayPlot!;
  const tone = RISK_TONE[plot.DeforestationRiskStatus];
  const certOk = plot.certificate && plot.certificate !== 'Không' && plot.certificate !== 'Chờ cấp';

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        <Link href="/plots" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          Hồ sơ rừng
        </Link>
        <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{plot.PlotID}</span>
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Lô rừng · đăng ký <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(plot.created_at)}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, margin: '4px 0 0', lineHeight: 1.2, color: 'var(--color-text-primary)' }}>
            {plot.PlotID}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
              {plot.TreeSpecies}
            </span>
            {[plot.commune, plot.district, plot.province].filter(Boolean).length > 0 && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {[plot.district, plot.province].filter(Boolean).join(', ')}
                </span>
              </>
            )}
            <RiskBadge status={plot.DeforestationRiskStatus} tone={tone} />
            {certOk && (
              <span style={{
                fontSize: 11, fontWeight: 500,
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: 'var(--color-info-subtle)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}>
                {plot.certificate}
              </span>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button style={secBtnStyle}>
            <Printer size={13} strokeWidth={1.75} />
            In hồ sơ
          </button>
          {plot.lat != null && plot.lng != null && (
            <a
              href={`https://www.google.com/maps?q=${plot.lat},${plot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={secBtnStyle}
            >
              <ExternalLink size={13} strokeWidth={1.75} />
              Google Maps
            </a>
          )}
          {canEdit && !editing && (
            <button onClick={startEditing} style={primBtnStyle}>
              <Pencil size={13} strokeWidth={1.75} />
              Sửa hồ sơ
            </button>
          )}
          {canEdit && editing && (
            <>
              <button onClick={handleSave} disabled={saving} style={primBtnStyle}>
                <Check size={13} strokeWidth={2} />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => { setEditing(false); setFormError(null); }} disabled={saving} style={secBtnStyle}>
                <X size={13} strokeWidth={2} />
                Hủy
              </button>
            </>
          )}
        </div>
      </div>

      {formError && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
          {formError}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', border: 'none', background: 'transparent',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)', fontWeight: isActive ? 500 : 400,
                cursor: 'pointer', marginBottom: -1,
                transition: 'color var(--duration-fast) var(--ease-out)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'info'      && <InfoTab      plot={plot} editing={editing} form={form} setForm={setForm} />}
      {activeTab === 'owners'    && <OwnersTab    owners={plot.owners ?? []} />}
      {activeTab === 'boundary'  && <BoundaryTab  plot={plot} />}
      {activeTab === 'documents' && <DocumentsTab documents={plot.documents ?? []} />}
    </div>
  );
}

// ─── Tab 1: Thông tin ─────────────────────────────────────────────────────────

function InfoTab({ plot, editing, form, setForm }: {
  plot: PlotRegistry;
  editing: boolean;
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm>>;
}) {
  const tone = RISK_TONE[plot.DeforestationRiskStatus];
  const ageMs = plot.planted_at ? Date.now() - new Date(plot.planted_at).getTime() : null;
  const ageYears = ageMs != null ? ageMs / (365.25 * 24 * 3600 * 1000) : null;
  const harvestMsLeft = plot.harvest_plan ? new Date(plot.harvest_plan).getTime() - Date.now() : null;
  const monthsLeft = harvestMsLeft != null ? Math.round(harvestMsLeft / (30.44 * 24 * 3600 * 1000)) : null;
  const harvestProgress = ageYears != null && plot.rotation_years
    ? Math.max(0, Math.min(1, ageYears / plot.rotation_years))
    : null;
  const certOk = plot.certificate && plot.certificate !== 'Không' && plot.certificate !== 'Chờ cấp';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top row: map + right column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>

        {/* Map card */}
        <div style={cardStyle}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} style={{ color: 'var(--color-accent)' }} strokeWidth={1.75} />
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Vị trí trên bản đồ</span>
            </div>
            {plot.lat != null && plot.lng != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {plot.lat.toFixed(4)}° B, {plot.lng.toFixed(4)}° Đ
                </span>
                <CopyButton text={`${plot.lat}, ${plot.lng}`} />
              </div>
            )}
          </div>
          <div style={{ position: 'relative', height: 380, background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
            {plot.lat != null && plot.lng != null ? (
              <>
                <iframe
                  title={`Bản đồ lô rừng ${plot.PlotID}`}
                  src={`https://www.google.com/maps?q=${plot.lat},${plot.lng}&z=14&t=k&output=embed&hl=vi`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                />
                {/* Overlay chip */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '6px 10px', background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  maxWidth: 'calc(100% - 20px)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Trees size={12} strokeWidth={2.2} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{plot.PlotID}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                      {plot.TreeSpecies} · <span style={{ fontFamily: 'var(--font-mono)' }}>{plot.AreaHa.toFixed(2)} ha</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  <MapPin size={32} strokeWidth={1.25} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>Chưa có toạ độ trên bản đồ.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stat tiles */}
          <div style={{ ...cardStyle, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginBottom: 16 }}>
              <FactStat label="Diện tích" value={plot.AreaHa.toFixed(2)} suffix="ha" />
              <FactStat label="Mật độ trồng" value={plot.density_per_ha?.toLocaleString('vi-VN') ?? '—'} suffix="cây/ha" />
              <FactStat label="Tuổi cây" value={ageYears?.toFixed(1) ?? '—'} suffix="năm" />
              <FactStat
                label="Đến kỳ khai thác"
                value={monthsLeft != null ? (monthsLeft >= 0 ? monthsLeft : 0) : '—'}
                suffix={monthsLeft != null && monthsLeft <= 0 ? 'đã sẵn sàng' : 'tháng'}
                accent={monthsLeft != null && monthsLeft <= 0}
              />
            </div>
            {harvestProgress != null && plot.planted_at && plot.harvest_plan && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
                  <span>Chu kỳ khai thác</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    năm {Math.floor(ageYears!)} / {plot.rotation_years}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--color-bg-subtle)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <div style={{
                    width: `${harvestProgress * 100}%`, height: '100%',
                    background: harvestProgress >= 1 ? 'var(--color-success)' : 'var(--color-accent)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Trồng {fmtDate(plot.planted_at)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Dự kiến {fmtDate(plot.harvest_plan)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Plot info */}
          <div style={{ ...cardStyle, padding: 16, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Thông tin lô</div>
            {editing ? (
              <EditFields form={form} setForm={setForm} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <KV label="Mã hồ sơ"><span style={{ fontFamily: 'var(--font-mono)' }}>{plot.PlotID}</span></KV>
                <KV label="Số GCN đất"><span style={{ fontFamily: 'var(--font-mono)' }}>{plot.LandTitle}</span></KV>
                <KV label="Loài cây">{plot.TreeSpecies}</KV>
                <KV label="Độ cao"><span style={{ fontFamily: 'var(--font-mono)' }}>{plot.elevation_m != null ? `${plot.elevation_m} m` : '—'}</span></KV>
                <KV label="Độ dốc"><span style={{ fontFamily: 'var(--font-mono)' }}>{plot.slope_deg != null ? `${plot.slope_deg}°` : '—'}</span></KV>
                <KV label="Loại đất">{plot.soil_type ?? '—'}</KV>
                <KV label="Lượt khai thác trước">{plot.prev_harvests}</KV>
                <KV label="Tổng đã giao">
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 500 }}>
                    {plot.ActualQuantityDelivered > 0 ? `${plot.ActualQuantityDelivered.toFixed(1)} tấn` : '—'}
                  </span>
                </KV>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: compliance + harvest timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Compliance */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Tuân thủ &amp; chứng nhận</div>
          <ComplianceRow
            label="Chứng nhận quản lý rừng"
            value={plot.certificate ?? 'Không'}
            sub={plot.cert_id && plot.cert_id !== '—' ? plot.cert_id : 'Chưa có mã chứng nhận'}
            ok={!!certOk}
            pending={plot.certificate === 'Chờ cấp'}
          />
          <ComplianceRow
            label="Hợp đồng quyền sử dụng đất"
            value="Còn hiệu lực"
            sub={plot.planted_at ? `Đăng ký ${fmtDate(plot.created_at)}` : 'Xem tài liệu đính kèm'}
            ok
          />
          <ComplianceRow
            label="Giấy xác nhận nguồn gốc"
            value={plot.DeforestationRiskStatus === 'Cao' ? 'Cần xác minh' : 'Đầy đủ'}
            sub={plot.DeforestationRiskStatus === 'Cao'
              ? 'Hồ sơ thiếu giấy xác nhận của xã'
              : 'Hồ sơ đã được kiểm lâm xác nhận'}
            ok={plot.DeforestationRiskStatus !== 'Cao'}
            error={plot.DeforestationRiskStatus === 'Cao'}
          />
          <ComplianceRow
            label="Rủi ro phá rừng (EUDR)"
            value={RISK_LABEL[plot.DeforestationRiskStatus]}
            sub={
              plot.DeforestationRiskStatus === 'Thấp'     ? 'Không có biến động đáng kể trong 5 năm.' :
              plot.DeforestationRiskStatus === 'Trung bình'? 'Quan sát thấy mất ~3% tán rừng kế cận.' :
                                                            'Cần khảo sát thực địa trước lượt cân kế.'
            }
            ok={plot.DeforestationRiskStatus === 'Thấp'}
            warn={plot.DeforestationRiskStatus === 'Trung bình'}
            error={plot.DeforestationRiskStatus === 'Cao'}
            last
          />
        </div>

        {/* Harvest timeline */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lịch sử khai thác</div>
          <HarvestTimeline plot={plot} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Chủ sở hữu ───────────────────────────────────────────────────────

function OwnersTab({ owners }: { owners: PlotOwner[] }) {
  if (!owners.length) {
    return (
      <div style={{ ...cardStyle, padding: 'var(--space-12)', textAlign: 'center' }}>
        <Users size={32} strokeWidth={1.25} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
          Chưa có thông tin chủ sở hữu.
        </p>
      </div>
    );
  }

  const totalShare = owners.reduce((s, o) => s + (o.ty_le ?? 0), 0);

  return (
    <div style={cardStyle}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Danh sách chủ sở hữu</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {owners.length} người · tổng cổ phần{' '}
            <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{totalShare}%</span>
          </span>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--color-table-header-bg)' }}>
            <Th flex>Họ và tên</Th>
            <Th width={160}>CCCD</Th>
            <Th width={160}>Vai trò</Th>
            <Th align="right" width={120}>Tỷ lệ cổ phần</Th>
          </tr>
        </thead>
        <tbody>
          {owners.map((o, i) => (
            <OwnerRow key={o.id} owner={o} isLast={i === owners.length - 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerRow({ owner: o, isLast }: { owner: PlotOwner; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: '1px solid var(--color-border)',
        borderBottom: isLast ? 'none' : undefined,
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <Td>{o.ten}</Td>
      <Td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{o.cccd}</span></Td>
      <Td><span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{o.vai_tro}</span></Td>
      <Td align="right">
        {o.ty_le != null ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', width: 100 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(o.ty_le, 100)}%`, height: '100%', background: 'var(--color-accent)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)', width: 32, textAlign: 'right' }}>{o.ty_le}%</span>
          </div>
        ) : '—'}
      </Td>
    </tr>
  );
}

// ─── Tab 3: Ranh giới ─────────────────────────────────────────────────────────

function BoundaryTab({ plot }: { plot: PlotRegistry }) {
  const polygon = plot.polygon ?? [];
  const sorted = [...polygon].sort((a, b) => a.thu_tu - b.thu_tu);

  const perimeter = polygon.length > 1
    ? (() => {
        let total = 0;
        for (let i = 0; i < sorted.length; i++) {
          const a = sorted[i];
          const b = sorted[(i + 1) % sorted.length];
          const dLat = (b.lat - a.lat) * 111_320;
          const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
          total += Math.sqrt(dLat ** 2 + dLng ** 2);
        }
        return Math.round(total);
      })()
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* SVG polygon */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>Ranh giới lô</span>
            <button style={{ ...ghostBtnSmStyle }}>
              <Download size={12} strokeWidth={1.75} />
              Tải KML
            </button>
          </div>
          {polygon.length > 0 ? (
            <PlotBoundarySVG polygon={sorted} plotId={plot.PlotID} riskStatus={plot.DeforestationRiskStatus} areaHa={plot.AreaHa} />
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              Chưa có dữ liệu ranh giới.
            </div>
          )}
        </div>

        {/* Stats + centroid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...cardStyle, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Thông số hình học</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <StatTile label="Diện tích" value={`${plot.AreaHa.toFixed(2)} ha`} mono />
              <StatTile label="Số đỉnh" value={polygon.length > 0 ? String(polygon.length) : '—'} mono />
              {perimeter != null && <StatTile label="Chu vi (ước tính)" value={`${perimeter.toLocaleString('vi-VN')} m`} mono />}
            </div>
          </div>
          {plot.lat != null && plot.lng != null && (
            <div style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 10 }}>Toạ độ trọng tâm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <KV label="Vĩ độ">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{plot.lat.toFixed(6)}° B</span>
                </KV>
                <KV label="Kinh độ">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{plot.lng.toFixed(6)}° Đ</span>
                </KV>
                <KV label="Độ cao">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{plot.elevation_m != null ? `${plot.elevation_m} m` : '—'}</span>
                </KV>
                <KV label="Độ dốc">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{plot.slope_deg != null ? `${plot.slope_deg}°` : '—'}</span>
                </KV>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate table */}
      {polygon.length > 0 && (
        <div style={cardStyle}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Danh sách đỉnh</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-table-header-bg)' }}>
                <Th width={60}>#</Th>
                <Th>Vĩ độ (B)</Th>
                <Th>Kinh độ (Đ)</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pt, i) => (
                <tr key={pt.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <Td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>{i + 1}</span></Td>
                  <Td><span style={{ fontFamily: 'var(--font-mono)' }}>{pt.lat.toFixed(6)}</span></Td>
                  <Td><span style={{ fontFamily: 'var(--font-mono)' }}>{pt.lng.toFixed(6)}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SVG polygon visualization ────────────────────────────────────────────────

function PlotBoundarySVG({ polygon, plotId, riskStatus, areaHa }: {
  polygon: PolygonCoordinate[];
  plotId: string;
  riskStatus: DeforestationRiskStatus;
  areaHa: number;
}) {
  const tone = RISK_TONE[riskStatus];
  const toneColor = `var(--color-${tone})`;
  const toneBg    = `var(--color-${tone}-subtle)`;

  const SVG_W_LOCAL = 200;
  const SVG_H_LOCAL = 160;
  const pad = 20;

  const lats = polygon.map(p => p.lat);
  const lngs = polygon.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const project = (lat: number, lng: number) => ({
    x: pad + ((lng - minLng) / lngRange) * (SVG_W_LOCAL - 2 * pad),
    y: (SVG_H_LOCAL - pad) - ((lat - minLat) / latRange) * (SVG_H_LOCAL - 2 * pad),
  });

  const pts = polygon.map(p => {
    const { x, y } = project(p.lat, p.lng);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${SVG_W_LOCAL} ${SVG_H_LOCAL}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <pattern id={`hatch-${plotId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={toneColor} strokeWidth="1" opacity="0.4" />
        </pattern>
      </defs>
      {/* compass */}
      <g transform="translate(18, 18)">
        <circle cx="0" cy="0" r="10" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="1" />
        <path d="M 0 -6 L 2 0 L 0 6 L -2 0 Z" fill="var(--color-text-primary)" />
        <text x="0" y="-12" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="var(--font-mono)">B</text>
      </g>
      {/* Polygon */}
      <polygon points={pts} fill={`url(#hatch-${plotId})`} stroke={toneColor} strokeWidth="1.5" />
      {/* centroid dot + label */}
      {(() => {
        const cx = polygon.reduce((s, p) => s + project(p.lat, p.lng).x, 0) / polygon.length;
        const cy = polygon.reduce((s, p) => s + project(p.lat, p.lng).y, 0) / polygon.length;
        return (
          <>
            <circle cx={cx} cy={cy} r="3" fill={toneColor} />
            <text x={cx} y={cy + 13} fontSize="9" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="var(--font-mono)">
              {areaHa.toFixed(2)} ha
            </text>
          </>
        );
      })()}
      {/* scale bar */}
      <g transform="translate(140,148)">
        <line x1="0" y1="0" x2="40" y2="0" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <line x1="40" y1="-3" x2="40" y2="3" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <text x="20" y="-5" fontSize="7" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="var(--font-mono)">100 m</text>
      </g>
    </svg>
  );
}

// ─── Tab 4: Tài liệu ──────────────────────────────────────────────────────────

const DOC_TONES: Record<string, string> = {
  PDF: 'danger', DOCX: 'info', ZIP: 'warning', XLSX: 'success',
};

function DocumentsTab({ documents }: { documents: PlotDocument[] }) {
  if (!documents.length) {
    return (
      <div style={{ ...cardStyle, padding: 'var(--space-12)', textAlign: 'center' }}>
        <FileText size={32} strokeWidth={1.25} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
          Chưa có tài liệu đính kèm.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Giấy tờ &amp; tài liệu
        </span>
        <button style={secBtnStyle}>
          <Download size={13} strokeWidth={1.75} />
          Tải lên tài liệu
        </button>
      </div>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {documents.map(doc => (
          <DocCard key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: PlotDocument }) {
  const [hovered, setHovered] = useState(false);
  const kind      = doc.loai.toUpperCase();
  const toneName  = DOC_TONES[kind] ?? 'info';
  const toneColor = toneName === 'info' ? 'var(--color-accent)' : `var(--color-${toneName})`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <div style={{
        width: 36, height: 44, borderRadius: 'var(--radius-sm)',
        background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: toneColor }}>
          {kind}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.ten_tai_lieu}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {fmtDate(doc.uploaded_at)}
        </div>
      </div>
      <Download size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} strokeWidth={1.75} />
    </div>
  );
}

// ─── Edit fields ──────────────────────────────────────────────────────────────

function EditFields({ form, setForm }: { form: EditForm; setForm: React.Dispatch<React.SetStateAction<EditForm>> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <LabeledInput
        label="Số giấy chứng nhận đất"
        value={form.LandTitle}
        onChange={v => setForm(f => ({ ...f, LandTitle: v }))}
        mono
      />
      <LabeledInput
        label="Loài cây"
        value={form.TreeSpecies}
        onChange={v => setForm(f => ({ ...f, TreeSpecies: v }))}
      />
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
          Mức rủi ro phá rừng
        </label>
        <select
          value={form.DeforestationRiskStatus}
          onChange={e => setForm(f => ({ ...f, DeforestationRiskStatus: e.target.value as DeforestationRiskStatus }))}
          style={{
            width: '100%', height: 32, padding: '0 8px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)', outline: 'none',
          }}
        >
          <option value="Thấp">Thấp — Rủi ro thấp</option>
          <option value="Trung bình">Trung bình — Rủi ro vừa</option>
          <option value="Cao">Cao — Rủi ro cao</option>
        </select>
      </div>
      <LabeledInput
        label="Chứng nhận (FSC-CoC, PEFC...)"
        value={form.certificate}
        onChange={v => setForm(f => ({ ...f, certificate: v }))}
      />
      <LabeledInput
        label="Mã chứng nhận"
        value={form.cert_id}
        onChange={v => setForm(f => ({ ...f, cert_id: v }))}
        mono
      />
    </div>
  );
}

// ─── Compliance row ───────────────────────────────────────────────────────────

function ComplianceRow({ label, value, sub, ok, pending, warn, error, last }: {
  label: string; value: string; sub: string;
  ok?: boolean; pending?: boolean; warn?: boolean; error?: boolean; last?: boolean;
}) {
  const tone = error ? 'danger' : warn ? 'warning' : pending ? 'warning' : ok ? 'success' : 'neutral';
  const iconColor = tone === 'success' ? 'var(--color-success)' : tone === 'warning' ? 'var(--color-warning)' : tone === 'danger' ? 'var(--color-danger)' : 'var(--color-text-tertiary)';
  const iconBg    = tone === 'success' ? 'var(--color-success-subtle)' : tone === 'warning' ? 'var(--color-warning-subtle)' : tone === 'danger' ? 'var(--color-danger-subtle)' : 'var(--color-bg-subtle)';
  const IconComp  = error ? AlertTriangle : warn ? AlertCircle : pending ? Clock : ok ? CheckCircle : Minus;

  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: iconBg, color: iconColor,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2, border: `1px solid ${iconColor}`,
      }}>
        <IconComp size={12} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>{label}</div>
          <div style={{ fontSize: 12, color: iconColor, fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Harvest timeline ─────────────────────────────────────────────────────────

function HarvestTimeline({ plot }: { plot: PlotRegistry }) {
  interface Event { label: string; icon: React.ReactNode; meta: string; date: string | null; pending?: boolean }

  const events: Event[] = [];

  if (plot.planted_at) {
    events.push({ label: 'Trồng mới', icon: <Trees size={11} strokeWidth={2} />, meta: `${plot.TreeSpecies} · mật độ ${plot.density_per_ha?.toLocaleString('vi-VN') ?? '?'} cây/ha`, date: plot.planted_at });
  }
  if (plot.prev_harvests > 0 && plot.planted_at && plot.rotation_years) {
    const prevDate = new Date(new Date(plot.planted_at).getTime() + (plot.rotation_years - 1) * 365.25 * 24 * 3600 * 1000);
    events.push({ label: 'Khai thác lần trước', icon: <CheckCircle size={11} strokeWidth={2} />, meta: `${plot.prev_harvests} lần · sản lượng ước tính`, date: prevDate.toISOString() });
  }
  if (plot.harvest_plan) {
    const isPast = new Date(plot.harvest_plan) < new Date();
    events.push({ label: isPast ? 'Đã khai thác' : 'Dự kiến khai thác', icon: <Clock size={11} strokeWidth={2} />, meta: isPast ? 'Đã hoàn thành kỳ khai thác' : 'Đang chờ kế hoạch khai thác', date: plot.harvest_plan, pending: !isPast });
  }

  if (!events.length) {
    return <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Chưa có dữ liệu lịch sử.</div>;
  }

  return (
    <div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
          <div style={{ position: 'relative', width: 24, flexShrink: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: e.pending ? 'var(--color-bg-subtle)' : 'var(--color-accent-subtle)',
              color: e.pending ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
              border: `1px solid ${e.pending ? 'var(--color-border)' : 'var(--color-accent)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {e.icon}
            </div>
            {i < events.length - 1 && (
              <div style={{ position: 'absolute', left: 11, top: 24, width: 2, height: 20, background: 'var(--color-border)' }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: e.pending ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{e.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{e.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      title="Sao chép toạ độ"
      style={{
        width: 22, height: 22, padding: 0, borderRadius: 'var(--radius-sm)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: copied ? 'var(--color-success)' : 'var(--color-text-tertiary)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={1.75} />}
    </button>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ status, tone }: { status: DeforestationRiskStatus; tone: 'success' | 'warning' | 'danger' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 500,
      padding: '2px 8px', borderRadius: 'var(--radius-full)',
      background: `var(--color-${tone}-subtle)`,
      color: `var(--color-${tone})`,
      border: `1px solid var(--color-${tone})`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: `var(--color-${tone})`, flexShrink: 0 }} />
      {RISK_LABEL[status]}
    </span>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function FactStat({ label, value, suffix, accent }: { label: string; value: string | number; suffix: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, lineHeight: 1.1, color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
          {value}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{suffix}</span>
      </div>
    </div>
  );
}

function StatTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: 10, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'start' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', height: 32, padding: '0 10px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)', fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Th({ children, flex, align, width }: { children?: React.ReactNode; flex?: boolean; align?: 'right'; width?: number }) {
  return (
    <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', width: flex ? undefined : width }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <td style={{ padding: '11px 14px', verticalAlign: 'middle', textAlign: align }}>
      {children}
    </td>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-surface)',
};

const primBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 14px',
  borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
  textDecoration: 'none',
};

const secBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)', cursor: 'pointer', textDecoration: 'none',
};

const ghostBtnSmStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  height: 26, padding: '0 8px',
  borderRadius: 'var(--radius-md)', border: '1px solid transparent',
  background: 'transparent', color: 'var(--color-text-secondary)',
  fontSize: 12, cursor: 'pointer',
};
