vi.mock('googleapis', () => ({}));

import { rowToDriver, driverToRow } from "../driver";

describe("rowToDriver", () => {
  const fullRow = [
    "drv-01", "Nguyễn Văn An", "079123456789", "0901234567", "51A-123.45", "NMQM",
    "GPLX-001", "C", "2026-06-30", "Bình Phước", "2020-01-15", "active",
    "5", "120000", "42", "2020-01-15T08:00:00.000Z", "2024-06-01T08:00:00.000Z",
  ];

  it("maps all columns correctly", () => {
    const d = rowToDriver(fullRow);
    expect(d.id).toBe("drv-01");
    expect(d.ten).toBe("Nguyễn Văn An");
    expect(d.cccd).toBe("079123456789");
    expect(d.so_xe).toBe("51A-123.45");
    expect(d.nha_may).toBe("NMQM");
    expect(d.hang_gplx).toBe("C");
    expect(d.trang_thai_tai_xe).toBe("active");
    expect(d.trips30).toBe(5);
    expect(d.totalTrips).toBe(42);
    expect(d.completedDeliveries).toBe(42);
  });

  it("handles optional fields when blank", () => {
    const sparse = ["drv-02", "Trần Thị Bình", "079234567890", "0912345678", "51B-234.56", "NMQM"];
    const d = rowToDriver(sparse);
    expect(d.gplx).toBeUndefined();
    expect(d.hang_gplx).toBeUndefined();
    expect(d.trang_thai_tai_xe).toBeUndefined();
    expect(d.trips30).toBe(0);
  });

  it("maps expiring status correctly", () => {
    const row = [...fullRow];
    row[11] = "expiring";
    const d = rowToDriver(row);
    expect(d.trang_thai_tai_xe).toBe("expiring");
  });
});

describe("driverToRow / rowToDriver round-trip", () => {
  const fullRow = [
    "drv-01", "Nguyễn Văn An", "079123456789", "0901234567", "51A-123.45", "NMQM",
    "GPLX-001", "C", "2026-06-30", "Bình Phước", "2020-01-15", "active",
    "5", "120000", "42", "2020-01-15T08:00:00.000Z", "2024-06-01T08:00:00.000Z",
  ];

  it("survives a round-trip", () => {
    const original = rowToDriver(fullRow);
    const row = driverToRow(original);
    const restored = rowToDriver(row);
    expect(restored.id).toBe(original.id);
    expect(restored.ten).toBe(original.ten);
    expect(restored.so_xe).toBe(original.so_xe);
    expect(restored.hang_gplx).toBe(original.hang_gplx);
    expect(restored.trang_thai_tai_xe).toBe(original.trang_thai_tai_xe);
  });

  it("preserves numeric fields after round-trip", () => {
    const d = rowToDriver(fullRow);
    const row = driverToRow(d);
    const restored = rowToDriver(row);
    expect(restored.trips30).toBe(5);
    expect(restored.kg30).toBe(120000);
    expect(restored.totalTrips).toBe(42);
  });
});
