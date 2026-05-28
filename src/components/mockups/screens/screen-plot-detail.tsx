'use client';

// Plot detail screen — Google Maps embed + full data card stack

import React, { useState } from 'react';
import { CARGO, RISK, MockPlot, fmtDate, fmtDateTime } from '../data';
import { Icon, Badge, Button, Card, StatusBadge, Row, Th, Td } from '../ui';

interface ScreenPlotDetailProps {
  plot: MockPlot;
  onBack: () => void;
  onNav?: (id: string) => void;
}

export function ScreenPlotDetail({ plot, onBack, onNav }: ScreenPlotDetailProps) {
  const mapSrc = `https://www.google.com/maps?q=${plot.lat},${plot.lng}&z=14&t=k&output=embed&hl=vi`;
  const tone = plot.risk === 'low' ? 'success' : plot.risk === 'medium' ? 'warning' : 'danger';
  const ageYears = ((Date.now() - plot.plantedAt.getTime()) / (365.25 * 24 * 3600 * 1000));
  const monthsToHarvest = Math.round((plot.harvestPlan.getTime() - Date.now()) / (30.44 * 24 * 3600 * 1000));
  const harvestProgress = Math.max(0, Math.min(1, ageYears / plot.rotation));

  const relatedCargo = CARGO.filter(c => c.plot === plot.id).slice(0, 5);
  const sampleCargo = relatedCargo.length ? relatedCargo : CARGO.slice(0, 3);
  const totalKg = sampleCargo.reduce((acc, c) => acc + (c.grossKg && c.tareKg ? c.grossKg - c.tareKg : 0), 0);

  return (
    <div data-screen-label="plot-detail" style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          Hồ sơ rừng
        </button>
        <Icon name="chevron-right" size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        <span className="mono" style={{ color: 'var(--color-text-primary)' }}>{plot.id}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Lô rừng · đăng ký <span className="mono">{fmtDate(plot.registered)}</span>
          </div>
          <h1 className="mono" style={{ fontSize: 26, fontWeight: 500, margin: '4px 0 0', lineHeight: 1.2 }}>
            {plot.id}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{plot.owner}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{plot.commune}, {plot.district}, {plot.province}</span>
            <Badge tone={tone} dot>{RISK[plot.risk].label}</Badge>
            {plot.certificate !== 'Không' && plot.certificate !== 'Chờ cấp' && (
              <Badge tone="info" dot>{plot.certificate}</Badge>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon="printer">In hồ sơ</Button>
          <Button variant="secondary" icon="external-link">Mở trên Google Maps</Button>
          <Button variant="primary" icon="pencil">Sửa hồ sơ</Button>
        </div>
      </div>

      {/* Top: map (left) + data cards (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="map-pin" size={14} style={{ color: 'var(--color-accent)' }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Vị trí trên bản đồ</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{plot.coords}</span>
              <CopyButton text={`${plot.lat}, ${plot.lng}`} />
            </div>
          </div>
          <div style={{ position: 'relative', height: 460, background: 'var(--color-bg-subtle)' }}>
            <iframe
              title={`Bản đồ lô rừng ${plot.id}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
            {/* Overlay info chip */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              padding: '8px 12px', background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 12, color: 'var(--color-text-primary)',
              maxWidth: 'calc(100% - 24px)',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="trees" size={13} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontWeight: 500 }}>{plot.id}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  {plot.species} · <span className="mono">{plot.area.toFixed(2)} ha</span>
                </div>
              </div>
            </div>
            {/* Layer pills */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              display: 'inline-flex', padding: 2,
              background: 'var(--color-bg-surface)', borderRadius: 8, border: '1px solid var(--color-border)',
            }}>
              <MapLayerBtn label="Vệ tinh" active />
              <MapLayerBtn label="Địa hình" />
              <MapLayerBtn label="Đường" />
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card padding={16}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 16px' }}>
              <FactStat label="Diện tích" value={plot.area.toFixed(2)} suffix="ha" />
              <FactStat label="Mật độ trồng" value={plot.density.toLocaleString('vi-VN')} suffix="cây/ha" />
              <FactStat label="Tuổi cây" value={ageYears.toFixed(1)} suffix="năm" />
              <FactStat
                label="Đến kỳ khai thác"
                value={monthsToHarvest >= 0 ? monthsToHarvest : 0}
                suffix={monthsToHarvest >= 0 ? 'tháng' : 'đã sẵn sàng'}
                accent={monthsToHarvest <= 0}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                <span>Chu kỳ khai thác</span>
                <span className="mono">năm {Math.floor(ageYears)} / {plot.rotation}</span>
              </div>
              <div style={{
                height: 6, borderRadius: 999,
                background: 'var(--color-bg-subtle)',
                overflow: 'hidden', position: 'relative',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: `${harvestProgress * 100}%`, height: '100%',
                  background: harvestProgress >= 1 ? 'var(--color-success)' : 'var(--color-accent)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                <span className="mono">Trồng {fmtDate(plot.plantedAt)}</span>
                <span className="mono">Dự kiến {fmtDate(plot.harvestPlan)}</span>
              </div>
            </div>
          </Card>

          <Card padding={16} title="Thông tin lô">
            <Row label="Mã hồ sơ"><span className="mono">{plot.id}</span></Row>
            <Row label="Chủ rừng">{plot.owner}</Row>
            <Row label="Loài cây">{plot.species}</Row>
            <Row label="Độ cao"><span className="mono">{plot.elevation} m</span></Row>
            <Row label="Độ dốc"><span className="mono">{plot.slope}°</span></Row>
            <Row label="Loại đất" last>{plot.soil}</Row>
          </Card>
        </div>
      </div>

      {/* Boundary + recent deliveries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, marginBottom: 12 }}>
        <Card title="Ranh giới lô" action={<Button size="sm" variant="ghost" icon="download">Tải KML</Button>}>
          <PlotBoundary plot={plot} />
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div style={{ padding: 10, background: 'var(--color-bg-subtle)', borderRadius: 6 }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Chu vi</div>
              <div className="mono" style={{ color: 'var(--color-text-primary)', marginTop: 2 }}>{(Math.sqrt(plot.area) * 410).toFixed(0)} m</div>
            </div>
            <div style={{ padding: 10, background: 'var(--color-bg-subtle)', borderRadius: 6 }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Số đỉnh</div>
              <div className="mono" style={{ color: 'var(--color-text-primary)', marginTop: 2 }}>{6 + (plot.id.charCodeAt(8) % 5)}</div>
            </div>
          </div>
        </Card>

        <Card title="Lượt giao nguyên liệu" action={
          <button onClick={() => onNav && onNav('cargo')} style={{
            background: 'transparent', border: 'none', fontSize: 12,
            color: 'var(--color-accent)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>Xem tất cả <Icon name="arrow-right" size={12} /></button>
        }>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <MiniKpi label="Tổng lượt giao" value={sampleCargo.length} />
            <MiniKpi label="Khối lượng tịnh" value={totalKg ? `${(totalKg / 1000).toFixed(1)}t` : '—'} />
            <MiniKpi label="Lần gần nhất" value={sampleCargo.length ? fmtDate(sampleCargo[0].createdAt) : '—'} mono />
          </div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-table-header-bg)' }}>
                <Th width={130}>Biển số</Th>
                <Th>Nguyên liệu</Th>
                <Th align="right" width={110}>KL tịnh</Th>
                <Th width={120}>Trạng thái</Th>
                <Th align="right" width={120}>Thời gian</Th>
              </tr>
            </thead>
            <tbody>
              {sampleCargo.map(c => {
                const net = c.grossKg && c.tareKg ? c.grossKg - c.tareKg : null;
                return (
                  <tr key={c.id}>
                    <Td><span className="mono">{c.plate}</span></Td>
                    <Td>{c.material}</Td>
                    <Td align="right">
                      <span className="mono">{net ? net.toLocaleString('vi-VN') : '—'} <span style={{ color: 'var(--color-text-tertiary)' }}>kg</span></span>
                    </Td>
                    <Td><StatusBadge statusId={c.status} /></Td>
                    <Td align="right"><span className="mono" style={{ color: 'var(--color-text-secondary)' }}>{fmtDateTime(c.createdAt)}</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Compliance + history */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card title="Tuân thủ & chứng nhận">
          <ComplianceRow
            label="Chứng nhận quản lý rừng"
            value={plot.certificate}
            sub={plot.certId !== '—' ? plot.certId : 'Chưa có mã chứng nhận'}
            ok={plot.certificate !== 'Không' && plot.certificate !== 'Chờ cấp'}
            pending={plot.certificate === 'Chờ cấp'}
          />
          <ComplianceRow
            label="Hợp đồng quyền sử dụng đất"
            value="Còn hiệu lực"
            sub={`Hết hạn ${fmtDate(new Date(plot.registered.getTime() + 50 * 365.25 * 24 * 3600 * 1000))}`}
            ok
          />
          <ComplianceRow
            label="Giấy xác nhận nguồn gốc"
            value={plot.risk === 'high' ? 'Cần xác minh' : 'Đầy đủ'}
            sub={plot.risk === 'high' ? 'Hồ sơ thiếu giấy xác nhận của xã' : 'Hồ sơ đã được kiểm lâm xác nhận'}
            ok={plot.risk !== 'high'}
            error={plot.risk === 'high'}
          />
          <ComplianceRow
            label="Rủi ro phá rừng (EUDR)"
            value={RISK[plot.risk].label}
            sub={
              plot.risk === 'low'    ? 'Không có biến động đáng kể trong 5 năm.' :
              plot.risk === 'medium' ? 'Quan sát thấy mất ~3% tán rừng kế cận.' :
                                      'Cần khảo sát thực địa trước lượt cân kế.'
            }
            ok={plot.risk === 'low'}
            warn={plot.risk === 'medium'}
            error={plot.risk === 'high'}
            last
          />
        </Card>

        <Card title="Lịch sử khai thác">
          <HarvestTimeline plot={plot} />
        </Card>
      </div>

      {/* Documents */}
      <Card title="Giấy tờ & tài liệu" action={<Button size="sm" variant="secondary" icon="upload">Tải lên</Button>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {([
            { name: 'Sổ đỏ — quyền sử dụng đất', kind: 'PDF', size: '2.4 MB', date: plot.registered },
            { name: 'Bản đồ địa chính lô rừng', kind: 'PDF', size: '1.1 MB', date: plot.registered },
            { name: 'Xác nhận của UBND xã', kind: 'PDF', size: '780 KB', date: new Date(plot.registered.getTime() + 14 * 86400000) },
            { name: 'Hợp đồng giao khoán', kind: 'DOCX', size: '92 KB', date: new Date(plot.registered.getTime() + 30 * 86400000) },
            plot.certificate !== 'Không' && plot.certificate !== 'Chờ cấp'
              ? { name: `Chứng nhận ${plot.certificate}`, kind: 'PDF', size: '3.2 MB', date: new Date(plot.registered.getTime() + 180 * 86400000) }
              : null,
            { name: 'Ảnh hiện trạng lô', kind: 'ZIP', size: '14 MB', date: new Date(Date.now() - 7 * 86400000) },
          ] as ({ name: string; kind: string; size: string; date: Date } | null)[]).filter(Boolean).map((d, i) => (
            <DocCard key={i} doc={d!} />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── FactStat ─────────────────────────────────────────────────────────────────

interface FactStatProps {
  label: string;
  value: string | number;
  suffix: string;
  accent?: boolean;
}

function FactStat({ label, value, suffix, accent }: FactStatProps) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)', lineHeight: 1.1 }}>{value}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{suffix}</span>
      </div>
    </div>
  );
}

// ─── MiniKpi ──────────────────────────────────────────────────────────────────

interface MiniKpiProps {
  label: string;
  value: string | number;
  mono?: boolean;
}

function MiniKpi({ label, value, mono }: MiniKpiProps) {
  return (
    <div style={{
      flex: 1, padding: 10,
      background: 'var(--color-bg-subtle)', borderRadius: 6,
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─── MapLayerBtn ──────────────────────────────────────────────────────────────

interface MapLayerBtnProps {
  label: string;
  active?: boolean;
}

function MapLayerBtn({ label, active }: MapLayerBtnProps) {
  return (
    <button style={{
      height: 28, padding: '0 12px',
      background: active ? 'var(--color-bg-subtle)' : 'transparent',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-border)' : '1px solid transparent',
      borderRadius: 6,
      fontSize: 12, fontWeight: active ? 500 : 400,
      cursor: 'pointer',
    }}>{label}</button>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Sao chép toạ độ"
      style={{
        width: 24, height: 24, padding: 0, borderRadius: 4,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: copied ? 'var(--color-success)' : 'var(--color-text-tertiary)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon name={copied ? 'check' : 'copy'} size={12} />
    </button>
  );
}

// ─── PlotBoundary ─────────────────────────────────────────────────────────────

function PlotBoundary({ plot }: { plot: MockPlot }) {
  const seed = plot.id.charCodeAt(8) + plot.id.charCodeAt(9);
  const sides = 6 + (seed % 5);
  const cx = 100, cy = 80, r = 60;
  const points: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const wobble = ((Math.sin(seed + i * 2.3) + 1) / 2) * 0.4 + 0.75;
    points.push([
      cx + Math.cos(a) * r * wobble,
      cy + Math.sin(a) * r * wobble * 0.85,
    ]);
  }
  const pStr = points.map(p => p.join(',')).join(' ');
  // Risk tone mapped to CSS custom properties — no hardcoded hex
  const toneColor = plot.risk === 'low' ? 'var(--color-success)' : plot.risk === 'medium' ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <svg viewBox="0 0 200 160" width="100%" style={{ display: 'block' }}>
      <defs>
        <pattern id={`hatch-${plot.id}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={toneColor} strokeWidth="1" opacity="0.4" />
        </pattern>
      </defs>
      {/* compass */}
      <g transform="translate(20, 20)">
        <circle cx="0" cy="0" r="12" fill="var(--color-bg-surface)" stroke="var(--color-border)" />
        <path d="M 0 -8 L 3 0 L 0 8 L -3 0 Z" fill="var(--color-text-primary)" />
        <text x="0" y="-14" fontSize="9" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="JetBrains Mono">B</text>
      </g>
      <polygon points={pStr} fill={`url(#hatch-${plot.id})`} stroke={toneColor} strokeWidth="1.5" />
      {/* center label */}
      <circle cx={cx} cy={cy} r="3" fill={toneColor} />
      <text x={cx} y={cy + 16} fontSize="9" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="JetBrains Mono">
        {plot.area.toFixed(2)} ha
      </text>
      {/* scale bar */}
      <g transform="translate(140, 140)">
        <line x1="0" y1="0" x2="40" y2="0" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <line x1="40" y1="-3" x2="40" y2="3" stroke="var(--color-text-secondary)" strokeWidth="1" />
        <text x="20" y="-6" fontSize="8" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="JetBrains Mono">100 m</text>
      </g>
    </svg>
  );
}

// ─── ComplianceRow ────────────────────────────────────────────────────────────

interface ComplianceRowProps {
  label: string;
  value: string;
  sub: string;
  ok?: boolean;
  pending?: boolean;
  warn?: boolean;
  error?: boolean;
  last?: boolean;
}

function ComplianceRow({ label, value, sub, ok, pending, warn, error, last }: ComplianceRowProps) {
  const tone = error ? 'danger' : warn ? 'warning' : pending ? 'warning' : ok ? 'success' : 'neutral';
  const iconColor = tone === 'success' ? 'var(--color-success)' : tone === 'warning' ? 'var(--color-warning)' : tone === 'danger' ? 'var(--color-danger)' : 'var(--color-text-tertiary)';
  const iconBg    = tone === 'success' ? 'var(--color-success-subtle)' : tone === 'warning' ? 'var(--color-warning-subtle)' : tone === 'danger' ? 'var(--color-danger-subtle)' : 'var(--color-bg-subtle)';
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: iconBg, color: iconColor,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        border: `1px solid ${iconColor}`,
      }}>
        <Icon name={error ? 'alert-triangle' : warn ? 'alert-circle' : pending ? 'clock' : ok ? 'check' : 'minus'} size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{label}</div>
          <div style={{ fontSize: 12, color: iconColor, fontWeight: 500 }}>{value}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── HarvestTimeline ──────────────────────────────────────────────────────────

interface TimelineEvent {
  t: Date;
  label: string;
  icon: string;
  meta: string;
  pending?: boolean;
}

function HarvestTimeline({ plot }: { plot: MockPlot }) {
  const events: TimelineEvent[] = [];
  const plant = plot.plantedAt;
  events.push({ t: plant, label: 'Trồng mới', icon: 'sprout', meta: `${plot.species} · mật độ ${plot.density.toLocaleString('vi-VN')} cây/ha` });
  events.push({ t: new Date(plant.getTime() + 365 * 86400000), label: 'Chăm sóc năm 1', icon: 'leaf', meta: 'Phát dọn, bón thúc' });
  events.push({ t: new Date(plant.getTime() + 3 * 365 * 86400000), label: 'Tỉa thưa', icon: 'scissors', meta: `Giảm còn ${Math.round(plot.density * 0.7).toLocaleString('vi-VN')} cây/ha` });
  if (plot.prevHarvests > 0) {
    events.push({ t: new Date(plant.getTime() + (plot.rotation - 1) * 365 * 86400000), label: 'Khai thác lần trước', icon: 'axe', meta: `Sản lượng ~${(plot.area * 95).toFixed(0)} tấn/ha` });
  }
  events.push({ t: plot.harvestPlan, label: 'Dự kiến khai thác', icon: 'calendar', meta: 'Đang chờ kế hoạch khai thác', pending: true });

  return (
    <div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
          <div style={{ position: 'relative', width: 26, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: e.pending ? 'var(--color-bg-subtle)' : 'var(--color-accent-subtle)',
              color: e.pending ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
              border: `1px solid ${e.pending ? 'var(--color-border)' : 'var(--color-accent)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={e.icon} size={12} />
            </div>
            {i < events.length - 1 && (
              <div style={{
                position: 'absolute', left: 12, top: 26, width: 2, height: 22,
                background: 'var(--color-border)',
              }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 13, color: e.pending ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{e.label}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{fmtDate(e.t)}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{e.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DocCard ──────────────────────────────────────────────────────────────────

interface DocItem {
  name: string;
  kind: string;
  size: string;
  date: Date;
}

const DOC_TONES: Record<string, string> = { PDF: 'danger', DOCX: 'info', ZIP: 'warning', XLSX: 'success' };

function DocCard({ doc }: { doc: DocItem }) {
  const toneVar = DOC_TONES[doc.kind] === 'info' ? 'var(--color-accent)' : `var(--color-${DOC_TONES[doc.kind]})`;
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        transition: 'background 150ms ease-out',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-subtle)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <div style={{
        width: 36, height: 44, borderRadius: 4,
        background: 'var(--color-bg-subtle)',
        border: '1px solid var(--color-border)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
      }}>
        <span className="mono" style={{ fontSize: 9, fontWeight: 500, color: toneVar }}>{doc.kind}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 8 }}>
          <span className="mono">{doc.size}</span>
          <span>·</span>
          <span className="mono">{fmtDate(doc.date)}</span>
        </div>
      </div>
      <Icon name="download" size={14} style={{ color: 'var(--color-text-tertiary)' }} />
    </div>
  );
}
