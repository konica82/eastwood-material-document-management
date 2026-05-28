'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Package, Search, LayoutGrid, List } from 'lucide-react';
import { usePlant } from '@/contexts/PlantContext';
import { getRepository } from '@/lib/repository';
import type { Material } from '@/types/index';

type ViewMode = 'card' | 'table';

export default function MaterialsPage() {
  const { activePlantId } = usePlant();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('card');

  useEffect(() => {
    setLoading(true);
    const repo = getRepository('material');
    repo.list(activePlantId).then(data => {
      setMaterials(data);
      setLoading(false);
    });
  }, [activePlantId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return materials;
    const q = search.toLowerCase();
    return materials.filter(
      m => m.ten.toLowerCase().includes(q) || m.ten_khoa_hoc.toLowerCase().includes(q),
    );
  }, [materials, search]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Nguyên liệu
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Search */}
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
              placeholder="Tìm theo tên..."
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
                width: 220,
              }}
            />
          </div>

          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <ViewToggleBtn
              active={view === 'card'}
              onClick={() => setView('card')}
              label="Thẻ"
            >
              <LayoutGrid size={14} strokeWidth={1.75} />
            </ViewToggleBtn>
            <ViewToggleBtn
              active={view === 'table'}
              onClick={() => setView('table')}
              label="Bảng"
            >
              <List size={14} strokeWidth={1.75} />
            </ViewToggleBtn>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : view === 'card' ? (
        <CardGrid materials={filtered} />
      ) : (
        <TableView materials={filtered} />
      )}
    </div>
  );
}

// ─── Card grid ────────────────────────────────────────────────────────────────

function CardGrid({ materials }: { materials: Material[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {materials.map(m => (
        <MaterialCard key={m.id} material={m} />
      ))}
    </div>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/materials/${material.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${hovered ? 'var(--color-accent)' : 'var(--color-border)'}`,
        background: 'var(--color-bg-surface)',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'border-color var(--duration-fast) var(--ease-out)',
      }}
    >
      {/* Image area */}
      <div
        style={{
          aspectRatio: '4/3',
          background: 'var(--color-bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {material.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.image}
            alt={material.ten}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Package size={32} strokeWidth={1.25} style={{ color: 'var(--color-text-tertiary)' }} />
        )}
      </div>

      {/* Text */}
      <div style={{ padding: 'var(--space-3)' }}>
        <div
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {material.ten}
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {material.ten_khoa_hoc}
        </div>
      </div>
    </Link>
  );
}

// ─── Table view ───────────────────────────────────────────────────────────────

function TableView({ materials }: { materials: Material[] }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-table-header-bg)' }}>
            <th style={thStyle}>Hình</th>
            <th style={thStyle}>Tên nguyên liệu</th>
            <th style={thStyle}>Tên khoa học</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, i) => (
            <TableRow key={m.id} material={m} isLast={i === materials.length - 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ material, isLast }: { material: Material; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-out)',
        borderBottom: isLast ? 'none' : undefined,
      }}
    >
      <td style={{ ...tdStyle, width: 56 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {material.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={material.image}
              alt={material.ten}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Package size={18} strokeWidth={1.5} style={{ color: 'var(--color-text-tertiary)' }} />
          )}
        </div>
      </td>
      <td style={tdStyle}>
        <Link
          href={`/materials/${material.id}`}
          style={{
            color: 'var(--color-accent)',
            textDecoration: 'none',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          {material.ten}
        </Link>
      </td>
      <td
        style={{
          ...tdStyle,
          fontStyle: 'italic',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {material.ten_khoa_hoc}
      </td>
    </tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-primary)',
  verticalAlign: 'middle',
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function ViewToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 34,
        border: 'none',
        background: active ? 'var(--color-accent-subtle)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        padding: 'var(--space-12)',
        textAlign: 'center',
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      Đang tải...
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div
      style={{
        padding: 'var(--space-12)',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      {search
        ? `Không tìm thấy nguyên liệu nào phù hợp với "${search}".`
        : 'Chưa có nguyên liệu nào.'}
    </div>
  );
}
