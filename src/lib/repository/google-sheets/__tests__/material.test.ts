/**
 * Unit tests for the material Google Sheets adapter.
 *
 * Mocks the googleapis client — no real API calls.
 */

vi.mock('googleapis', () => ({}));

import { rowToMaterial, materialToRow } from "../material";

// ─── rowToMaterial round-trip ─────────────────────────────────────────────────

describe("rowToMaterial", () => {
  it("maps a complete row to a Material", () => {
    const row = ["mat-01", "Keo lai", "Acacia hybrid", "https://drive.google.com/file/abc"];
    const m = rowToMaterial(row);
    expect(m.id).toBe("mat-01");
    expect(m.ten).toBe("Keo lai");
    expect(m.ten_khoa_hoc).toBe("Acacia hybrid");
    expect(m.image).toBe("https://drive.google.com/file/abc");
  });

  it("handles missing image as null", () => {
    const row = ["mat-02", "Cao su", "Hevea brasiliensis", ""];
    const m = rowToMaterial(row);
    expect(m.image).toBeNull();
  });

  it("handles short row (out-of-bounds cells)", () => {
    const row = ["mat-03", "Điều"];
    const m = rowToMaterial(row);
    expect(m.ten_khoa_hoc).toBe("");
    expect(m.image).toBeNull();
  });
});

describe("materialToRow / rowToMaterial round-trip", () => {
  it("survives a round-trip without data loss", () => {
    const original = rowToMaterial(["mat-04", "Tràm nước", "Melaleuca cajuputi", "https://example.com/img"]);
    const row = materialToRow(original);
    const restored = rowToMaterial(row);
    expect(restored).toEqual(original);
  });

  it("round-trips with null image", () => {
    const original = rowToMaterial(["mat-05", "Bạch đàn", "Eucalyptus urophylla", ""]);
    const row = materialToRow(original);
    const restored = rowToMaterial(row);
    expect(restored.image).toBeNull();
  });

  it("round-trips with all fields set", () => {
    const original = rowToMaterial([
      "mat-06", "Thông", "Pinus merkusii", "https://drive.google.com/pine",
    ]);
    const row = materialToRow(original);
    expect(row[0]).toBe("mat-06");
    expect(row[1]).toBe("Thông");
    expect(row[2]).toBe("Pinus merkusii");
    expect(row[3]).toBe("https://drive.google.com/pine");
    expect(rowToMaterial(row)).toEqual(original);
  });
});
