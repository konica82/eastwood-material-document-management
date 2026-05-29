import type { Cargo, DashboardMetrics, VehicleType } from "@/types/index";

/** Vietnam local date string "YYYY-MM-DD" */
export function todayVN(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

const VEHICLE_TYPES: VehicleType[] = ["Xe tải", "Máy cày", "Đầu kéo"];

export function computeDashboardMetrics(cargos: Cargo[]): DashboardMetrics {
  const today = todayVN();

  // Rule 7: waiting at gate
  const cho_luot = cargos.filter((c) => c.trang_thai === "Chờ lượt").length;

  // Rule 8: registered today (by VN local date)
  const dang_ky_hom_nay = cargos.filter((c) =>
    c.created_at.startsWith(today)
  ).length;

  // Rule 9: completed today, grouped by vehicle type
  const completedToday = cargos.filter(
    (c) =>
      c.trang_thai === "Hoàn thành" &&
      c.hoan_thanh_luc != null &&
      c.hoan_thanh_luc.startsWith(today)
  );

  const byVehicleType = Object.fromEntries(
    VEHICLE_TYPES.map((vt) => [
      vt,
      completedToday.filter((c) => c.loai_xe === vt).length,
    ])
  ) as Record<VehicleType, number>;

  const hoan_thanh_hom_nay = {
    total: completedToday.length,
    byVehicleType,
  };

  // Rule 10: completed but dossier not done
  const ho_so_chua_xong = cargos.filter(
    (c) => c.trang_thai === "Hoàn thành" && c.hsls_hoan_thanh === false
  ).length;

  // Rule 11: completed and dossier done
  const ho_so_hoan_thanh = cargos.filter(
    (c) => c.trang_thai === "Hoàn thành" && c.hsls_hoan_thanh === true
  ).length;

  // Rule 12: completed with no weighing slip
  const thieu_phieu_can = cargos.filter(
    (c) =>
      c.trang_thai === "Hoàn thành" &&
      (c.phieu_can_id == null || c.phieu_can_id === "")
  ).length;

  return {
    cho_luot,
    dang_ky_hom_nay,
    hoan_thanh_hom_nay,
    ho_so_chua_xong,
    ho_so_hoan_thanh,
    thieu_phieu_can,
  };
}
