/**
 * Mock activity log repository.
 *
 * Append-only — no update, no delete. Seed entries reflect the kinds of
 * events the real adapter will write on every create / update / status_change.
 */

import type { ActivityLogEntry, ActivityAction } from '../../../types/index';
import type { ActivityLogRepository, AppendActivityLogInput } from '../types';

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function minAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

let nextId = 100;
function nextEntryId(): string {
  return `log-${String(nextId++).padStart(4, '0')}`;
}

function entry(
  id: string,
  plant_id: string,
  entity_type: string,
  entity_id: string,
  action: ActivityAction,
  description: string,
  created_by: string,
  created_at: string,
): ActivityLogEntry {
  return { id, plant_id, entity_type, entity_id, action, description, created_by, created_at };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: ActivityLogEntry[] = [
  entry('log-0001', 'NMQM', 'cargo', 'cargo-006', 'created',
    'Tạo lượt cân mới: 51D-678.90 — Vũ Văn Minh',
    'mock-user-1', minAgo(5)),

  entry('log-0002', 'NMQM', 'cargo', 'cargo-005', 'created',
    'Tạo lượt cân mới: 60B-567.89 — Hoàng Thị Lan',
    'mock-user-1', minAgo(12)),

  entry('log-0003', 'NMQM', 'cargo', 'cargo-010', 'status_changed',
    'Chuyển trạng thái → Đang xử lý: 51D-444.55 — cân vào 19,800 kg',
    'mock-user-1', minAgo(20)),

  entry('log-0004', 'NMQM', 'cargo', 'cargo-009', 'status_changed',
    'Chuyển trạng thái → Đang xử lý: 60A-333.44 — cân vào 25,200 kg',
    'mock-user-1', minAgo(35)),

  entry('log-0005', 'NMQM', 'cargo', 'cargo-012', 'status_changed',
    'Hoàn thành lượt cân: 51B-xxx — khối lượng tịnh 16,700 kg',
    'mock-user-1', minAgo(48)),

  entry('log-0006', 'NMQM', 'cargo', 'cargo-011', 'status_changed',
    'Hoàn thành lượt cân: 51A-xxx — khối lượng tịnh 17,500 kg',
    'mock-user-1', minAgo(62)),

  entry('log-0007', 'NMQM', 'cargo', 'cargo-004', 'created',
    'Tạo lượt cân mới: 60A-456.78 — Phạm Văn Dũng',
    'mock-user-1', minAgo(78)),

  entry('log-0008', 'NMQM', 'cargo', 'cargo-003', 'created',
    'Tạo lượt cân mới: 51C-345.67 — Lê Văn Cường',
    'mock-user-1', minAgo(90)),

  entry('log-0009', 'NMQM', 'cargo', 'cargo-021', 'status_changed',
    'Hủy lượt cân: 51F-700.50 — Lái xe không đủ giấy tờ',
    'mock-user-1', minAgo(150)),

  entry('log-0010', 'NMQM', 'cargo', 'cargo-008', 'status_changed',
    'Chuyển trạng thái → Đang xử lý: 51B-222.33 — cân vào 32,000 kg',
    'mock-user-1', minAgo(180)),

  entry('log-0011', 'NMQM', 'cargo', 'cargo-007', 'status_changed',
    'Chuyển trạng thái → Đang xử lý: 51A-111.22 — cân vào 28,500 kg',
    'mock-user-1', minAgo(210)),

  entry('log-0012', 'NMQM', 'plot', 'PLT-003', 'updated',
    'Cập nhật thông tin lô rừng PLT-003 — đã thêm chứng chỉ FSC',
    'mock-user-1', minAgo(480)),
];

// Append-only store — ordered newest-first by default
const store: ActivityLogEntry[] = [...SEED];

// ─── Repository ───────────────────────────────────────────────────────────────

export const mockActivityLogRepository: ActivityLogRepository = {
  async list(plantId: string): Promise<ActivityLogEntry[]> {
    return store
      .filter(e => e.plant_id === plantId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async append(input: AppendActivityLogInput): Promise<ActivityLogEntry> {
    const entry: ActivityLogEntry = {
      id: nextEntryId(),
      plant_id: input.plant_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      description: input.description,
      created_by: 'mock-user-1',
      created_at: new Date().toISOString(),
    };
    store.unshift(entry);
    return entry;
  },
};
