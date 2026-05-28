'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, User } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Supplier, SecondarySupplier } from '@/types/index';

type Tab = 'primary' | 'secondary';

export default function SuppliersPage() {
  const { activePlantId } = usePlant();
  const [tab, setTab] = useState<Tab>('primary');
  const [search, setSearch] = useState('');

  const [primaries, setPrimaries] = useState<Supplier[]>([]);
  const [secondaries, setSecondaries] = useState<SecondarySupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const repo = getRepository('supplier');
    repo.list(activePlantId).then(async ps => {
      setPrimaries(ps);
      const nested = await Promise.all(ps.map(p => repo.listSecondary(activePlantId, p.id)));
      setSecondaries(nested.flat());
      setLoading(false);
    });
  }, [activePlantId]);

  const filteredPrimaries = useMemo(() => {
    if (!search.trim()) return primaries;
    const q = search.toLowerCase();
    return primaries.filter(
      s => s.ten.toLowerCase().includes(q) || s.cccd_mst.toLowerCase().includes(q),
    );
  }, [primaries, search]);

  const filteredSecondaries = useMemo(() => {
    if (!search.trim()) return secondaries;
    const q = search.toLowerCase();
    return secondaries.filter(
      s => s.ten.toLowerCase().includes(q) || s.cccd_mst.toLowerCase().includes(q),
    );
  }, [secondaries, search]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Nhà cung cấp
        </h1>

        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Tên, MST, hoặc CCCD..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 36,
              paddingLeft: 32,
              paddingRight: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              width: 240,
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-5)',
          gap: 0,
        }}
      >
        <TabBtn active={tab === 'primary'} onClick={() => setTab('primary')}>
          Nhà cung cấp chính
          <CountPill count={primaries.length} />
        </TabBtn>
        <TabBtn active={tab === 'secondary'} onClick={() => setTab('secondary')}>
          Nhà cung cấp phụ
          <CountPill count={secondaries.length} />
        </TabBtn>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : tab === 'primary' ? (
        <PrimaryTable suppliers={filteredPrimaries} search={search} />
      ) : (
        <SecondaryTable suppliers={filteredSecondaries} primaries={primaries} search={search} />
      )}
    </div>
  );
}

// ─── Primary table ────────────────────────────────────────────────────────────

function PrimaryTable({ suppliers, search }: { suppliers: Supplier[]; search: string }) {
  if (suppliers.length === 0) {
    return <EmptyState message={search ? `Không tìm thấy "${search}"` : 'Chưa có nhà cung cấp chính nào.'} />;
  }
  return (
    <TableShell>
      <thead>
        <tr style={{ background: 'var(--color-table-header-bg)' }}>
          <Th>Nhà cung cấp</Th>
          <Th>Loại</Th>
          <Th>Mã số (MST / CCCD)</Th>
          <Th>Số điện thoại</Th>
          <Th>Địa chỉ</Th>
        </tr>
      </thead>
      <tbody>
        {suppliers.map((s, i) => (
          <PrimaryRow key={s.id} supplier={s} isLast={i === suppliers.length - 1} />
        ))}
      </tbody>
    </TableShell>
  );
}

function PrimaryRow({ supplier: s, isLast }: { supplier: Supplier; isLast: boolean }) {
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
      <Td>
        <Link
          href={`/suppliers/${s.id}`}
          style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, fontSize: 'var(--font-size-sm)' }}
        >
          {s.ten}
        </Link>
      </Td>
      <Td><EntityBadge type={s.hinh_thuc} /></Td>
      <Td mono>{s.cccd_mst}</Td>
      <Td>{s.so_dien_thoai ?? '—'}</Td>
      <Td secondary truncate>{s.dia_chi}</Td>
    </tr>
  );
}

// ─── Secondary table ──────────────────────────────────────────────────────────

function SecondaryTable({
  suppliers,
  primaries,
  search,
}: {
  suppliers: SecondarySupplier[];
  primaries: Supplier[];
  search: string;
}) {
  const primaryMap = useMemo(
    () => new Map(primaries.map(p => [p.id, p.ten])),
    [primaries],
  );

  if (suppliers.length === 0) {
    return <EmptyState message={search ? `Không tìm thấy "${search}"` : 'Chưa có nhà cung cấp phụ nào.'} />;
  }
  return (
    <TableShell>
      <thead>
        <tr style={{ background: 'var(--color-table-header-bg)' }}>
          <Th>Họ tên</Th>
          <Th>CCCD</Th>
          <Th>Số điện thoại</Th>
          <Th>Nhà cung cấp chính</Th>
        </tr>
      </thead>
      <tbody>
        {suppliers.map((s, i) => (
          <SecondaryRow
            key={s.id}
            supplier={s}
            primaryName={primaryMap.get(s.nha_cung_cap_chinh_id) ?? '—'}
            isLast={i === suppliers.length - 1}
          />
        ))}
      </tbody>
    </TableShell>
  );
}

function SecondaryRow({
  supplier: s,
  primaryName,
  isLast,
}: {
  supplier: SecondarySupplier;
  primaryName: string;
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
        borderBottom: isLast ? 'none' : undefined,
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      <Td>
        <Link
          href={`/suppliers/secondary/${s.id}`}
          style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, fontSize: 'var(--font-size-sm)' }}
        >
          {s.ten}
        </Link>
      </Td>
      <Td mono>{s.cccd_mst}</Td>
      <Td>{s.so_dien_thoai ?? '—'}</Td>
      <Td>
        <Link
          href={`/suppliers/${s.nha_cung_cap_chinh_id}`}
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}
        >
          {primaryName}
        </Link>
      </Td>
    </tr>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
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

function Td({
  children,
  mono = false,
  secondary = false,
  truncate = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  secondary?: boolean;
  truncate?: boolean;
}) {
  return (
    <td
      style={{
        padding: '12px 16px',
        fontSize: 'var(--font-size-sm)',
        color: secondary ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        verticalAlign: 'middle',
        maxWidth: truncate ? 200 : undefined,
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
        whiteSpace: truncate ? 'nowrap' : undefined,
      }}
    >
      {children}
    </td>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        cursor: 'pointer',
        marginBottom: -1,
        transition: 'color var(--duration-fast) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

function CountPill({ count }: { count: number }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--color-text-tertiary)',
        background: 'var(--color-bg-subtle)',
        borderRadius: 9999,
        padding: '1px 6px',
      }}
    >
      {count}
    </span>
  );
}

function EntityBadge({ type }: { type: string }) {
  const isCompany = type === 'Công ty';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: 9999,
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-subtle)',
        whiteSpace: 'nowrap',
      }}
    >
      {isCompany
        ? <Building2 size={11} strokeWidth={1.75} />
        : <User size={11} strokeWidth={1.75} />}
      {type}
    </span>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
      Đang tải...
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
      {message}
    </div>
  );
}

