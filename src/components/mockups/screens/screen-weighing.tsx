'use client';

// Weighing slip entry form

import React, { useState } from 'react';
import { DRIVERS, MATERIALS, SUPPLIERS_BRIEF } from '../data';
import { Icon, Badge, Button, Card, Field, TextInput, Select } from '../ui';

interface ToastPayload {
  message: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

interface ScreenWeighingProps {
  onToast: (toast: ToastPayload) => void;
}

interface WeighState {
  time: string;
  weight: string | number;
  hasPhoto: boolean;
}

export function ScreenWeighing({ onToast }: ScreenWeighingProps) {
  const [plate, setPlate] = useState('43C-219.84');
  const [driver, setDriver] = useState(DRIVERS[0]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [supplier, setSupplier] = useState(SUPPLIERS_BRIEF[0]);
  const [plot, setPlot] = useState('KH-2024-08');
  const [weighIn, setWeighIn] = useState<WeighState>({ time: '08:42', weight: 32480, hasPhoto: true });
  const [weighOut, setWeighOut] = useState<WeighState>({ time: '', weight: '', hasPhoto: false });
  const [saving, setSaving] = useState(false);

  const net = weighIn.weight && weighOut.weight
    ? Number(weighIn.weight) - Number(weighOut.weight)
    : null;

  function complete() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onToast({ message: 'Đã hoàn tất phiếu cân.', tone: 'success' });
    }, 800);
  }

  return (
    <div data-screen-label="weighing" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Phiếu cân</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>Tạo phiếu cân mới</h1>
        </div>
        <Button variant="ghost" icon="x">Hủy bỏ</Button>
      </div>

      <Card padding={20} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Thông tin xe</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Biển số xe">
            <TextInput value={plate} onChange={setPlate} mono placeholder="VD: 43C-219.84" />
          </Field>
          <Field label="Tài xế">
            <Select value={driver} onChange={setDriver} options={DRIVERS} />
          </Field>
          <Field label="Loại nguyên liệu">
            <Select value={material} onChange={setMaterial} options={MATERIALS} />
          </Field>
          <Field label="Nhà cung cấp chính">
            <Select value={supplier} onChange={setSupplier} options={SUPPLIERS_BRIEF} />
          </Field>
          <Field label="Lô rừng nguồn gốc" hint="Mã hồ sơ rừng đã đăng ký">
            <TextInput value={plot} onChange={setPlot} mono />
          </Field>
          <Field label="Ghi chú">
            <TextInput value="" onChange={() => {}} placeholder="Tùy chọn" />
          </Field>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
        <WeighSection title="Cân vào"  dir="in"  value={weighIn}  onChange={setWeighIn} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', gap: 8,
        }}>
          <div style={{ width: 1, flex: 1, background: 'var(--color-border)' }} />
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}>
            <Icon name="minus" size={14} />
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--color-border)' }} />
        </div>
        <WeighSection title="Cân ra" dir="out" value={weighOut} onChange={setWeighOut} />
      </div>

      <Card padding={20} style={{
        marginBottom: 16,
        background: net !== null ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
        borderColor: net !== null ? 'var(--color-accent)' : 'var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Khối lượng tịnh</div>
            <div className="mono" style={{
              fontSize: 36, fontWeight: 500, lineHeight: 1.1, marginTop: 6,
              color: net !== null ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
            }}>
              {net !== null ? net.toLocaleString('vi-VN') : '—'}{' '}
              <span style={{ fontSize: 18, color: 'var(--color-text-tertiary)' }}>kg</span>
            </div>
          </div>
          {net !== null && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {Number(weighIn.weight).toLocaleString('vi-VN')} kg <span style={{ color: 'var(--color-text-tertiary)' }}>(vào)</span>
              <br />
              − {Number(weighOut.weight).toLocaleString('vi-VN')} kg <span style={{ color: 'var(--color-text-tertiary)' }}>(ra)</span>
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Phiếu cân sẽ được gắn vào lượt cân hiện hành sau khi hoàn tất.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon="save">Lưu nháp</Button>
          <Button variant="primary" icon="check" onClick={complete} loading={saving} disabled={net === null}>
            Hoàn tất phiếu cân
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Weigh section ────────────────────────────────────────────────────────────

interface WeighSectionProps {
  title: string;
  dir: 'in' | 'out';
  value: WeighState;
  onChange: (v: WeighState) => void;
}

function WeighSection({ title, dir, value, onChange }: WeighSectionProps) {
  return (
    <Card padding={20}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={dir === 'in' ? 'log-in' : 'log-out'} size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        </div>
        {value.weight ? <Badge tone="success" dot>Đã ghi</Badge> : <Badge tone="warning" dot>Chờ ghi</Badge>}
      </div>

      <Field label="Khối lượng (kg)">
        <TextInput
          value={value.weight}
          onChange={v => onChange({ ...value, weight: v.replace(/[^\d]/g, '') })}
          mono large
          placeholder="0"
          rightSlot={<span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} className="mono">kg</span>}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <Field label="Thời gian">
          <TextInput value={value.time} onChange={t => onChange({ ...value, time: t })} mono placeholder="--:--" />
        </Field>
        <Field label="Cân số">
          <Select value="C1" onChange={() => {}} options={['C1','C2','C3']} />
        </Field>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Ảnh đồng hồ cân</div>
        <button
          onClick={() => onChange({ ...value, hasPhoto: !value.hasPhoto })}
          style={{
            width: '100%', aspectRatio: '16 / 9',
            borderRadius: 8,
            border: `1px ${value.hasPhoto ? 'solid' : 'dashed'} var(--color-border)`,
            background: value.hasPhoto
              ? 'repeating-linear-gradient(135deg, var(--color-bg-subtle) 0 6px, var(--color-bg-surface) 6px 12px)'
              : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--color-text-tertiary)', cursor: 'pointer',
          }}
        >
          <Icon name={value.hasPhoto ? 'image-check' : 'camera'} size={20} />
          <span style={{ fontSize: 12 }}>{value.hasPhoto ? 'Đã chụp ảnh đồng hồ' : 'Bấm để chụp / tải ảnh'}</span>
        </button>
      </div>
    </Card>
  );
}
