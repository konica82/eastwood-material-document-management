/**
 * Cargo service — wraps the cargo repository and fires activity log entries
 * fire-and-forget after every write. A failed log write never fails the main op.
 */
import type { Cargo, CargoStatus } from '@/types/index';
import type { CreateCargoInput } from '@/lib/repository/types';
import { getServerRepository } from '@/lib/repository/server';

function logEntry(
  plantId: string,
  cargoId: string,
  action: string,
  description: string,
  diff?: object,
) {
  const repo = getServerRepository('activity-log');
  void repo.append({
    plant_id: plantId,
    entity_type: 'cargo',
    entity_id: cargoId,
    action: action as import('@/types/index').ActivityAction,
    description: diff ? `${description} | ${JSON.stringify(diff)}` : description,
  });
}

export async function createCargo(plantId: string, input: CreateCargoInput): Promise<Cargo> {
  const repo = getServerRepository('cargo');
  const cargo = await repo.create(plantId, input);
  logEntry(plantId, cargo.id, 'created', `Tạo chuyến hàng ${cargo.so_xe}`);
  return cargo;
}

export async function updateCargoStatus(
  plantId: string,
  cargoId: string,
  status: CargoStatus,
  ly_do_huy?: string,
): Promise<Cargo> {
  const repo = getServerRepository('cargo');
  const existing = await repo.get(plantId, cargoId);
  const cargo = await repo.updateStatus(plantId, cargoId, status, ly_do_huy);
  logEntry(plantId, cargoId, 'status_changed', `Đổi trạng thái → ${status}`, {
    from: existing?.trang_thai,
    to: status,
    ...(ly_do_huy ? { reason: ly_do_huy } : {}),
  });
  return cargo;
}

export async function completeDossier(plantId: string, cargoId: string): Promise<Cargo> {
  const repo = getServerRepository('cargo');
  const cargo = await repo.completeDossier(plantId, cargoId);
  logEntry(plantId, cargoId, 'updated', 'Xác nhận hoàn thành hồ sơ', { hsls_hoan_thanh: true });
  return cargo;
}

export async function updateCargo(
  plantId: string,
  cargoId: string,
  patch: Partial<Cargo>,
): Promise<Cargo> {
  const repo = getServerRepository('cargo');
  const cargo = await repo.update(plantId, cargoId, patch);
  logEntry(plantId, cargoId, 'updated', 'Cập nhật chuyến hàng', patch);
  return cargo;
}
