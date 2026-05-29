vi.mock('googleapis', () => ({}));

import { rowToCargo, cargoToRow } from "../cargo";

const fullRow = [
  "cargo-001",                        // 0  id
  "NMQM",                             // 1  nha_may
  "51A-123.45",                       // 2  so_xe
  "Xe tải",                           // 3  loai_xe
  "Chờ lượt",                         // 4  trang_thai
  "3",                                // 5  stt_tai
  "",                                 // 6  ly_do_huy
  "",                                 // 7  hoan_thanh_luc
  "drv-01",                           // 8  tai_xe_id
  "mat-01",                           // 9  nguyen_lieu_id
  "ncc-001",                          // 10 nha_cung_cap_id
  "",                                 // 11 nha_cung_cap_phu_id
  "PLT-001",                          // 12 plot_id
  "45.5",                             // 13 khoang_cach_nha_may
  "slip-001",                         // 14 phieu_can_id
  "PC001",                            // 15 so_phieu_can
  "1800000",                          // 16 thoi_gian_cho (ms)
  "3600000",                          // 17 tong_thoi_gian_can (ms)
  "TRUE",                             // 18 hsls_hoan_thanh
  "Ghi chú test",                     // 19 ghi_chu
  "2024-06-01T06:00:00.000Z",         // 20 created_at
  "user-001",                         // 21 created_by
  "2024-06-01T10:00:00.000Z",         // 22 updated_at
  "user-001",                         // 23 updated_by
];

describe("rowToCargo", () => {
  it("maps all columns correctly", () => {
    const c = rowToCargo(fullRow);
    expect(c.id).toBe("cargo-001");
    expect(c.nha_may).toBe("NMQM");
    expect(c.so_xe).toBe("51A-123.45");
    expect(c.loai_xe).toBe("Xe tải");
    expect(c.trang_thai).toBe("Chờ lượt");
    expect(c.stt_tai).toBe(3);
    expect(c.tai_xe_id).toBe("drv-01");
    expect(c.plot_id).toBe("PLT-001");
    expect(c.khoang_cach_nha_may).toBe(45.5);
    expect(c.thoi_gian_cho).toBe(1800000);
    expect(c.tong_thoi_gian_can).toBe(3600000);
    expect(c.hsls_hoan_thanh).toBe(true);
    expect(c.ghi_chu).toBe("Ghi chú test");
    // joined objects always null from sheet
    expect(c.tai_xe).toBeNull();
  });

  it("maps cancelled cargo with ly_do_huy", () => {
    const row = [...fullRow];
    row[4] = "Hủy lượt";
    row[6] = "Xe hỏng máy";
    const c = rowToCargo(row);
    expect(c.trang_thai).toBe("Hủy lượt");
    expect(c.ly_do_huy).toBe("Xe hỏng máy");
  });

  it("treats empty optional fields as null", () => {
    const sparse = [...fullRow];
    sparse[6] = "";
    sparse[11] = "";
    sparse[12] = "";
    const c = rowToCargo(sparse);
    expect(c.ly_do_huy).toBeNull();
    expect(c.nha_cung_cap_phu_id).toBeNull();
    expect(c.plot_id).toBeNull();
  });

  it("treats FALSE hsls_hoan_thanh as false", () => {
    const row = [...fullRow];
    row[18] = "FALSE";
    expect(rowToCargo(row).hsls_hoan_thanh).toBe(false);
  });
});

describe("cargoToRow / rowToCargo round-trip", () => {
  it("round-trips without data loss", () => {
    const original = rowToCargo(fullRow);
    const row = cargoToRow(original);
    const restored = rowToCargo(row);

    expect(restored.id).toBe(original.id);
    expect(restored.trang_thai).toBe(original.trang_thai);
    expect(restored.stt_tai).toBe(original.stt_tai);
    expect(restored.khoang_cach_nha_may).toBe(original.khoang_cach_nha_may);
    expect(restored.thoi_gian_cho).toBe(original.thoi_gian_cho);
    expect(restored.tong_thoi_gian_can).toBe(original.tong_thoi_gian_can);
    expect(restored.hsls_hoan_thanh).toBe(original.hsls_hoan_thanh);
  });
});
