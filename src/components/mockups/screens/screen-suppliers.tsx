'use client';

// Suppliers — primary detail with secondaries

import React, { useState } from 'react';
import { SUPPLIER_DETAIL, MockSecondary, fmtDate } from '../data';
import { Icon, Badge, Button, Card, TextInput, Th, Td } from '../ui';

interface ToastPayload {
  message: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

interface ScreenSuppliersProps {
  onToast: (toast: ToastPayload) => void;
}

export function ScreenSuppliers({ onToast }: ScreenSuppliersProps) {
  const s = SUPPLIER_DETAIL;
  const [secs, setSecs] = useState<MockSecondary[]>(s.secondaries);
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const totalShare = secs.reduce((acc, x) => acc + x.share, 0);

  function addSec() {
    if (!newName || !newId) return;
    setSecs(prev => [...prev, { name: newName, id: newId, share: 0, plots: 0 }]);
    setNewName(''); setNewId('');
    onToast({ message: 'Đã thêm nhà cung cấp phụ.', tone: 'success' });
  }

  return (
    <div data-screen-label="suppliers" style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>Nhà cung cấp</span>
        <Icon name="chevron-right" size={12} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
      </div>

      <Card padding={20} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'var(--color-accent-subtle)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-accent)',
              }}>
                <Icon name="building-2" size={18} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{s.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  <span className="mono">{s.code}</span>
                  <span>·</span>
                  <Badge tone="success" dot>Đang hoạt động</Badge>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginTop: 16, fontSize: 13 }}>
              <KV label="Mã số thuế" value={<span className="mono">{s.taxCode}</span>} />
              <KV label="Người đại diện" value={s.rep} />
              <KV label="Số điện thoại" value={<span className="mono">{s.phone}</span>} />
              <KV label="Ngày đăng ký" value={<span className="mono">{fmtDate(s.registered)}</span>} />
              <KV label="Địa chỉ" value={s.address} span={2} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" icon="pencil">Sửa thông tin</Button>
              <Button variant="ghost" icon="more-horizontal" />
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              minWidth: 360,
            }}>
              <MiniStat label="Lượt giao 30N" value="42" />
              <MiniStat label="Khối lượng 30N" value="612t" />
              <MiniStat label="NCC phụ" value={secs.length} />
            </div>
          </div>
        </div>
      </Card>

      <Card padding={0}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Nhà cung cấp phụ</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Các hộ rừng cá nhân thuộc hợp tác xã · tổng cổ phần <span className="mono">{totalShare}%</span>
            </div>
          </div>
          <Button variant="ghost" icon="download">Xuất danh sách</Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-table-header-bg)' }}>
              <Th flex>Họ tên</Th>
              <Th>CCCD</Th>
              <Th align="right" width={120}>Cổ phần</Th>
              <Th align="right" width={100}>Lô rừng</Th>
              <Th width={80} />
            </tr>
          </thead>
          <tbody>
            {secs.map((row, i) => (
              <tr key={i}>
                <Td>{row.name}</Td>
                <Td><span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.id}</span></Td>
                <Td align="right">
                  <ShareBar value={row.share} />
                </Td>
                <Td align="right"><span className="mono">{row.plots}</span></Td>
                <Td align="right">
                  <Button size="sm" variant="ghost" icon="pencil" />
                </Td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-subtle)',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <TextInput value={newName} onChange={setNewName} placeholder="Họ và tên" style={{ flex: 1 }} />
                  <TextInput value={String(newId)} onChange={setNewId} placeholder="Số CCCD (12 số)" mono style={{ width: 200 }} />
                  <Button variant="secondary" icon="plus" onClick={addSec}>Thêm</Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── KV ───────────────────────────────────────────────────────────────────────

interface KVProps {
  label: string;
  value: React.ReactNode;
  span?: number;
}

function KV({ label, value, span }: KVProps) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────

interface MiniStatProps {
  label: string;
  value: string | number;
}

function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div style={{
      padding: '8px 12px',
      background: 'var(--color-bg-subtle)',
      borderRadius: 6,
      border: '1px solid var(--color-border)',
      textAlign: 'right',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─── ShareBar ─────────────────────────────────────────────────────────────────

function ShareBar({ value }: { value: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 100, justifyContent: 'flex-end' }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--color-bg-subtle)', overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ width: `${value}%`, height: '100%', background: 'var(--color-accent)' }} />
      </div>
      <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-primary)', width: 32, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}
