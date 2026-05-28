/**
 * Mock dashboard repository.
 *
 * Implements Business Rules 7–12 against the cargo seed data.
 * Returns hardcoded but realistic values that reflect the seed state:
 *
 *   Rule 7  — cho_luot:          6  (6 waiting cargos in seed)
 *   Rule 8  — dang_ky_hom_nay:  12  (6 waiting + 4 in-progress + 2 completed today)
 *   Rule 9  — hoan_thanh_hom_nay: 2  (cargo-011, cargo-012; all Xe tải)
 *   Rule 10 — ho_so_chua_xong:   3  (simulate some incomplete dossiers)
 *   Rule 11 — ho_so_hoan_thanh:  7  (of the 10 completed)
 *   Rule 12 — thieu_phieu_can:   1  (one completed cargo without a slip)
 *
 * The real adapter will compute all of these via aggregate queries against the
 * cargo table, scoped to the active plant.
 */

import type { DashboardMetrics, VehicleType } from '../../../types/index';
import type { DashboardRepository } from '../types';

export const mockDashboardRepository: DashboardRepository = {
  async getMetrics(_plantId: string): Promise<DashboardMetrics> {
    return {
      /** Rule 7: cargos with status Chờ lượt */
      cho_luot: 6,

      /** Rule 8: cargos registered today (plant local date) */
      dang_ky_hom_nay: 12,

      /** Rule 9: cargos that reached Hoàn thành today, with vehicle-type breakdown */
      hoan_thanh_hom_nay: {
        total: 2,
        byVehicleType: {
          'Xe tải': 2,
          'Máy cày': 0,
          'Đầu kéo': 0,
        } as Record<VehicleType, number>,
      },

      /** Rule 10: completed cargos where hsls_hoan_thanh = false */
      ho_so_chua_xong: 3,

      /** Rule 11: completed cargos where hsls_hoan_thanh = true */
      ho_so_hoan_thanh: 7,

      /** Rule 12: completed cargos with no weighing slip reference */
      thieu_phieu_can: 1,
    };
  },
};
