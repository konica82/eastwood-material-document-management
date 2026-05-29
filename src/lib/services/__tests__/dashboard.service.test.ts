import { describe, it, expect } from "vitest";
import { computeDashboardMetrics, todayVN } from "../dashboard.service";
import type { Cargo } from "@/types/index";

/** Build a minimal Cargo stub — only supply the fields under test. */
function makeCargo(overrides: Partial<Cargo>): Cargo {
  return {
    id: "c1",
    nha_may: "NMQM",
    so_xe: "51A-00001",
    loai_xe: "Xe tải",
    stt_tai: 1,
    trang_thai: "Chờ lượt",
    hoan_thanh_luc: null,
    ly_do_huy: null,
    tai_xe_id: "tx1",
    tai_xe: null,
    nguyen_lieu_id: "nl1",
    nguyen_lieu: null,
    nha_cung_cap_id: "ncc1",
    nha_cung_cap: null,
    nha_cung_cap_phu_id: null,
    nha_cung_cap_phu: null,
    plot_id: null,
    plot: null,
    khoang_cach_nha_may: null,
    phieu_can_id: null,
    phieu_can: null,
    so_phieu_can: null,
    thoi_gian_cho: null,
    tong_thoi_gian_can: null,
    hsls_hoan_thanh: false,
    ghi_chu: null,
    created_at: "2024-01-01T07:00:00.000Z",
    created_by: "user1",
    updated_at: "2024-01-01T07:00:00.000Z",
    updated_by: "user1",
    ...overrides,
  };
}

const TODAY = todayVN(); // e.g. "2026-05-28"
const TODAY_TS = `${TODAY}T08:00:00.000Z`;
const YESTERDAY = (() => {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE");
})();
const YESTERDAY_TS = `${YESTERDAY}T08:00:00.000Z`;

describe("computeDashboardMetrics", () => {
  describe("Rule 7 — cho_luot", () => {
    it("counts only 'Chờ lượt' records", () => {
      const cargos = [
        makeCargo({ id: "a", trang_thai: "Chờ lượt" }),
        makeCargo({ id: "b", trang_thai: "Chờ lượt" }),
        makeCargo({ id: "c", trang_thai: "Hoàn thành" }),
        makeCargo({ id: "d", trang_thai: "Đang xử lý" }),
      ];
      expect(computeDashboardMetrics(cargos).cho_luot).toBe(2);
    });

    it("returns 0 when no waiting records", () => {
      const cargos = [makeCargo({ id: "a", trang_thai: "Hoàn thành" })];
      expect(computeDashboardMetrics(cargos).cho_luot).toBe(0);
    });
  });

  describe("Rule 8 — dang_ky_hom_nay", () => {
    it("counts cargos created today in VN timezone", () => {
      const cargos = [
        makeCargo({ id: "a", created_at: TODAY_TS }),
        makeCargo({ id: "b", created_at: TODAY_TS }),
        makeCargo({ id: "c", created_at: YESTERDAY_TS }),
      ];
      expect(computeDashboardMetrics(cargos).dang_ky_hom_nay).toBe(2);
    });

    it("does not count yesterday records", () => {
      const cargos = [makeCargo({ id: "a", created_at: YESTERDAY_TS })];
      expect(computeDashboardMetrics(cargos).dang_ky_hom_nay).toBe(0);
    });
  });

  describe("Rule 9 — hoan_thanh_hom_nay", () => {
    it("counts total completions today", () => {
      const cargos = [
        makeCargo({
          id: "a",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: TODAY_TS,
          loai_xe: "Xe tải",
        }),
        makeCargo({
          id: "b",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: TODAY_TS,
          loai_xe: "Máy cày",
        }),
        makeCargo({
          id: "c",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: YESTERDAY_TS,
          loai_xe: "Xe tải",
        }),
      ];
      const m = computeDashboardMetrics(cargos);
      expect(m.hoan_thanh_hom_nay.total).toBe(2);
    });

    it("groups by vehicle type correctly", () => {
      const cargos = [
        makeCargo({
          id: "a",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: TODAY_TS,
          loai_xe: "Xe tải",
        }),
        makeCargo({
          id: "b",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: TODAY_TS,
          loai_xe: "Xe tải",
        }),
        makeCargo({
          id: "c",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: TODAY_TS,
          loai_xe: "Đầu kéo",
        }),
      ];
      const { byVehicleType } = computeDashboardMetrics(cargos).hoan_thanh_hom_nay;
      expect(byVehicleType["Xe tải"]).toBe(2);
      expect(byVehicleType["Đầu kéo"]).toBe(1);
      expect(byVehicleType["Máy cày"]).toBe(0);
    });

    it("excludes records where hoan_thanh_luc is null", () => {
      const cargos = [
        makeCargo({
          id: "a",
          trang_thai: "Hoàn thành",
          hoan_thanh_luc: null,
          loai_xe: "Xe tải",
        }),
      ];
      expect(computeDashboardMetrics(cargos).hoan_thanh_hom_nay.total).toBe(0);
    });
  });

  describe("Rules 10 & 11 — ho_so_chua_xong and ho_so_hoan_thanh are complementary", () => {
    it("splits completed cargos by hsls_hoan_thanh flag", () => {
      const cargos = [
        makeCargo({ id: "a", trang_thai: "Hoàn thành", hsls_hoan_thanh: false }),
        makeCargo({ id: "b", trang_thai: "Hoàn thành", hsls_hoan_thanh: false }),
        makeCargo({ id: "c", trang_thai: "Hoàn thành", hsls_hoan_thanh: true }),
        makeCargo({ id: "d", trang_thai: "Chờ lượt", hsls_hoan_thanh: false }),
      ];
      const m = computeDashboardMetrics(cargos);
      expect(m.ho_so_chua_xong).toBe(2);
      expect(m.ho_so_hoan_thanh).toBe(1);
      // Complementary: non-completed records don't appear in either
      expect(m.ho_so_chua_xong + m.ho_so_hoan_thanh).toBe(3);
    });
  });

  describe("Rule 12 — thieu_phieu_can", () => {
    it("catches null phieu_can_id", () => {
      const cargos = [
        makeCargo({ id: "a", trang_thai: "Hoàn thành", phieu_can_id: null }),
      ];
      expect(computeDashboardMetrics(cargos).thieu_phieu_can).toBe(1);
    });

    it("catches empty string phieu_can_id", () => {
      const cargos = [
        makeCargo({ id: "a", trang_thai: "Hoàn thành", phieu_can_id: "" }),
      ];
      expect(computeDashboardMetrics(cargos).thieu_phieu_can).toBe(1);
    });

    it("does not count records with a valid phieu_can_id", () => {
      const cargos = [
        makeCargo({
          id: "a",
          trang_thai: "Hoàn thành",
          phieu_can_id: "pc-001",
        }),
      ];
      expect(computeDashboardMetrics(cargos).thieu_phieu_can).toBe(0);
    });

    it("only counts completed records", () => {
      const cargos = [
        makeCargo({ id: "a", trang_thai: "Chờ lượt", phieu_can_id: null }),
      ];
      expect(computeDashboardMetrics(cargos).thieu_phieu_can).toBe(0);
    });
  });

  describe("empty input", () => {
    it("returns all zeros for an empty cargo list", () => {
      const m = computeDashboardMetrics([]);
      expect(m.cho_luot).toBe(0);
      expect(m.dang_ky_hom_nay).toBe(0);
      expect(m.hoan_thanh_hom_nay.total).toBe(0);
      expect(m.ho_so_chua_xong).toBe(0);
      expect(m.ho_so_hoan_thanh).toBe(0);
      expect(m.thieu_phieu_can).toBe(0);
    });
  });
});
