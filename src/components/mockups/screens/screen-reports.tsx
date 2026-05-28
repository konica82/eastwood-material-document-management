'use client';

// Reports / CSV export builder

import React, { useState, useMemo } from 'react';
import { CARGO, SUPPLIERS_BRIEF, MATERIALS, fmtDateTime } from '../data';
import { Icon, Badge, Button, Card, Field, TextInput, Select, StatusBadge, EmptyState, Th, Td } from '../ui';

interface ToastPayload {
  message: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

interface ScreenReportsProps {
  onToast: (toast: ToastPayload) => void;
}

export function ScreenReports({ onToast }: ScreenReportsProps) {
  const [dateFrom, setDateFrom] = useState('01/05/2026');
  const [dateTo, setDateTo] = useState('27/05/2026');
  const [status, setStatus] = useState('all');
  const [supplier, setSupplier] = useState('all');
  const [material, setMaterial] = useState('all');
  const [downloading, setDownloading] = useState(false);

  const matches = useMemo(() => {
    return CARGO.filter(c => {
      if (status !== 'all' && c.status !== status) return false;
      if (supplier !== 'all' && c.supplier !== supplier) return false;
      if (material !== 'all' && c.material !== material) return false;
      return true;
    });
  }, [status, supplier, material]);

  function download() {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      onToast({ message: `Đã tải ${matches.length} dòng CSV.`, tone: 'success' });
    }, 800);
  }

  return (
    <div data-screen-label="reports" style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Báo cáo</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0' }}>Xuất dữ liệu lượt cân</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon="bookmark">Lưu mẫu lọc</Button>
          <Button variant="primary" icon="download" onClick={download} loading={downloading} disabled={matches.length === 0}>
            Tải CSV · {matches.length} dòng
          </Button>
        </div>
      </div>

      <Card padding={20} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Bộ lọc</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Field label="Từ ngày">
            <TextInput value={dateFrom} onChange={setDateFrom} mono leftIcon="calendar" />
          </Field>
          <Field label="Đến ngày">
            <TextInput value={dateTo} onChange={setDateTo} mono leftIcon="calendar" />
          </Field>
          <Field label="Trạng thái">
            <Select value={status} onChange={setStatus} options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'waiting', label: 'Chờ lượt' },
              { value: 'inProgress', label: 'Đang xử lý' },
              { value: 'completed', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Hủy lượt' },
            ]} />
          </Field>
          <Field label="Nhà cung cấp">
            <Select value={supplier} onChange={setSupplier} options={[
              { value: 'all', label: 'Tất cả NCC' },
              ...SUPPLIERS_BRIEF.map(s => ({ value: s, label: s })),
            ]} />
          </Field>
          <Field label="Nguyên liệu">
            <Select value={material} onChange={setMaterial} options={[
              { value: 'all', label: 'Tất cả nguyên liệu' },
              ...MATERIALS.map(m => ({ value: m, label: m })),
            ]} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <span><Icon name="info" size={12} style={{ marginRight: 4, verticalAlign: '-2px' }} /> Bộ lọc tự động áp dụng cho nhà máy đang chọn ở thanh trên cùng.</span>
        </div>
      </Card>

      <Card padding={0}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Xem trước</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              <span className="mono">{matches.length}</span> dòng khớp · 7 cột
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge tone="neutral">UTF-8</Badge>
            <Badge tone="neutral">Dấu phẩy</Badge>
            <Badge tone="neutral">Có tiêu đề</Badge>
          </div>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-table-header-bg)' }}>
                <Th width={140}>Mã lượt</Th>
                <Th width={120}>Biển số</Th>
                <Th>Tài xế</Th>
                <Th>Nguyên liệu</Th>
                <Th flex>NCC chính</Th>
                <Th align="right" width={120}>KL tịnh (kg)</Th>
                <Th width={120}>Trạng thái</Th>
                <Th width={130} align="right">Thời gian</Th>
              </tr>
            </thead>
            <tbody>
              {matches.slice(0, 30).map(c => {
                const net = c.grossKg && c.tareKg ? c.grossKg - c.tareKg : null;
                return (
                  <tr key={c.id}>
                    <Td><span className="mono" style={{ fontSize: 12 }}>{c.id}</span></Td>
                    <Td><span className="mono">{c.plate}</span></Td>
                    <Td>{c.driver}</Td>
                    <Td>{c.material}</Td>
                    <Td>{c.supplier}</Td>
                    <Td align="right">
                      <span className="mono" style={{ color: net ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                        {net ? net.toLocaleString('vi-VN') : '—'}
                      </span>
                    </Td>
                    <Td><StatusBadge statusId={c.status} /></Td>
                    <Td align="right"><span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDateTime(c.createdAt)}</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {matches.length > 30 && (
            <div style={{
              padding: '10px 16px',
              fontSize: 12, color: 'var(--color-text-tertiary)',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
            }}>
              … và <span className="mono">{matches.length - 30}</span> dòng nữa trong file CSV.
            </div>
          )}
          {matches.length === 0 && (
            <div style={{ padding: 40 }}>
              <EmptyState icon="file-bar-chart" message="Không có dòng nào khớp với bộ lọc hiện tại." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
