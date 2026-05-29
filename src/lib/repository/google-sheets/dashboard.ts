/**
 * Google Sheets adapter — Dashboard.
 *
 * No direct sheet — aggregates over cargo rows.
 * Reads DanhSachXeHang and computes all Business Rule 7–12 metrics server-side.
 */

import type { DashboardMetrics, VehicleType, CargoStatus } from "../../../types/index";
import type { DashboardRepository } from "../types";
import { readRange } from "./base";
import { cache, TTL, cacheKey } from "../../cache";
import { getPlant } from "../../plants/config";

// Uses the same column layout as cargo.ts (imported as constants to keep DRY)
// cargo.ts C columns for status, loai_xe, created_at, hoan_thanh_luc, hsls_hoan_thanh, phieu_can_id, nha_may
const C_TRANG_THAI = 4;        // E
const C_LOAI_XE = 3;           // D
const C_CREATED_AT = 26;       // AA
const C_HOAN_THANH_LUC = 7;    // H
const C_HSLS = 19;             // T
const C_PHIEU_CAN_ID = 17;     // R
const C_NHA_MAY = 1;           // B

const SHEET = "DanhSachXeHang";
const RANGE = `${SHEET}!A2:AZ`;

function todayLocal(timezone: string): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: timezone }); // "YYYY-MM-DD"
}

export function makeDashboardRepository(plantId: string): DashboardRepository {
  return {
    async getMetrics(_plantId: string): Promise<DashboardMetrics> {
      const key = cacheKey("dashboard", plantId, "metrics");
      const cached = cache.get<DashboardMetrics>(key);
      if (cached) return cached;

      const plant = getPlant(plantId);
      const today = todayLocal(plant.timezone);

      const rows = await readRange(plantId, RANGE);
      const relevant = rows.filter(
        (r) => r[C_NHA_MAY] === plantId && r[0], // has an id
      );

      let cho_luot = 0;
      let dang_ky_hom_nay = 0;
      const hoan_thanh_hom_nay_by_type: Record<string, number> = {};
      let ho_so_chua_xong = 0;
      let ho_so_hoan_thanh = 0;
      let thieu_phieu_can = 0;

      for (const row of relevant) {
        const status = row[C_TRANG_THAI] as CargoStatus;
        const loai_xe = (row[C_LOAI_XE] ?? "") as VehicleType;
        const created_at = row[C_CREATED_AT] ?? "";
        const hoan_thanh_luc = row[C_HOAN_THANH_LUC] ?? "";
        const hsls = (row[C_HSLS] ?? "").toUpperCase();
        const phieu_can_id = row[C_PHIEU_CAN_ID] ?? "";

        // Rule 7: Chờ lượt
        if (status === "Chờ lượt") cho_luot++;

        // Rule 8: registered today
        if (created_at.startsWith(today)) dang_ky_hom_nay++;

        // Rule 9: completed today
        if (status === "Hoàn thành" && hoan_thanh_luc.startsWith(today)) {
          hoan_thanh_hom_nay_by_type[loai_xe] = (hoan_thanh_hom_nay_by_type[loai_xe] ?? 0) + 1;
        }

        // Rules 10 & 11: dossier status
        if (status === "Hoàn thành") {
          if (hsls === "TRUE" || hsls === "1") ho_so_hoan_thanh++;
          else ho_so_chua_xong++;
        }

        // Rule 12: completed without weighing slip
        if (status === "Hoàn thành" && !phieu_can_id) thieu_phieu_can++;
      }

      const total_hoan_thanh = Object.values(hoan_thanh_hom_nay_by_type).reduce((a, b) => a + b, 0);

      const metrics: DashboardMetrics = {
        cho_luot,
        dang_ky_hom_nay,
        hoan_thanh_hom_nay: {
          total: total_hoan_thanh,
          byVehicleType: hoan_thanh_hom_nay_by_type as Record<VehicleType, number>,
        },
        ho_so_chua_xong,
        ho_so_hoan_thanh,
        thieu_phieu_can,
      };

      cache.set(key, metrics, TTL.DASHBOARD);
      return metrics;
    },
  };
}
