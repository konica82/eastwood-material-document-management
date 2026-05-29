#!/usr/bin/env ts-node
/**
 * Column mapping verification script.
 *
 * Usage: npx ts-node --project tsconfig.json src/scripts/verify-column-mapping.ts --plant NMXH
 *
 * Reads the header row of each sheet and compares against the column index
 * constants defined in the adapter files. Outputs a table and writes
 * column-mapping-report.json to the project root.
 *
 * Requires real credentials in .env.local.
 */

import * as fs from "fs";
import * as path from "path";

// Load env before any other imports that read process.env
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

import { getSheetsClient } from "../lib/sheets-client";
import { getPlant } from "../lib/plants/config";

// ─── Column mappings extracted from adapter files ────────────────────────────

interface SheetMapping {
  sheetName: string;
  columns: Record<number, string>;
}

const SHEET_MAPPING: SheetMapping[] = [
  {
    sheetName: "DanhSachXeHang",
    columns: {
      0: "id",
      1: "nha_may",
      2: "so_xe",
      3: "loai_xe",
      4: "trang_thai",
      5: "stt_tai",
      6: "ly_do_huy",
      7: "hoan_thanh_luc",
      8: "tai_xe_id",
      9: "nguyen_lieu_id",
      10: "nha_cung_cap_id",
      11: "nha_cung_cap_phu_id",
      12: "plot_id",
      13: "khoang_cach",
      14: "phieu_can_id",
      15: "so_phieu_can",
      16: "thoi_gian_cho",
      17: "tong_thoi_gian_can",
      18: "hsls_hoan_thanh",
      19: "ghi_chu",
      20: "created_at",
      21: "created_by",
      22: "updated_at",
      23: "updated_by",
    },
  },
  {
    sheetName: "NguyenLieu",
    columns: {
      0: "id",
      1: "ten",
      2: "ten_khoa_hoc",
      3: "image",
    },
  },
  {
    sheetName: "TaiXe",
    columns: {
      0: "id",
      1: "ten",
      2: "cccd",
      3: "so_dien_thoai",
      4: "so_xe",
      5: "nha_may",
      6: "gplx",
      7: "hang_gplx",
      8: "han_gplx",
      9: "khu_vuc",
      10: "ngay_vao",
      11: "trang_thai",
      12: "trips30",
      13: "kg30",
      14: "total_trips",
      15: "created_at",
      16: "updated_at",
    },
  },
  {
    sheetName: "NhaCungCap",
    columns: {
      0: "id",
      1: "ten",
      2: "hinh_thuc",
      3: "loai_hinh",
      4: "cccd_mst",
      5: "so_dien_thoai",
      6: "nguoi_dai_dien",
      7: "dia_chi",
      8: "nha_may",
      9: "chung_chi",
      10: "created_at",
      11: "updated_at",
    },
  },
  {
    sheetName: "NhaCungCapPhu",
    columns: {
      0: "id",
      1: "ten",
      2: "hinh_thuc",
      3: "cccd_mst",
      4: "so_dien_thoai",
      5: "co_phan",
      6: "lo_rung",
      7: "ngay_tham_gia",
      8: "chinh_id",
    },
  },
  {
    sheetName: "PlotRegistry",
    columns: {
      0: "plot_id",
      1: "land_title",
      2: "area_ha",
      3: "tree_species",
      4: "defo_risk",
      5: "actual_qty",
      6: "nha_may",
      7: "lat",
      8: "lng",
      9: "commune",
      10: "district",
      11: "province",
      12: "planted_at",
      13: "harvest_plan",
      14: "rotation_years",
      15: "density_per_ha",
      16: "prev_harvests",
      17: "elevation_m",
      18: "slope_deg",
      19: "soil_type",
      20: "certificate",
      21: "cert_id",
      22: "created_at",
      23: "updated_at",
    },
  },
  {
    sheetName: "PhieuCan",
    columns: {
      0: "id",
      1: "xe_hang_id",
      2: "so_phieu_can",
      3: "nha_may",
      4: "dlc_ngay_can_vao",
      5: "dlc_can_vao",
      6: "dlc_ngay_can_ra",
      7: "dlc_can_ra",
      8: "dlc_trong_luong_hang",
      9: "can_thu",
      10: "hinh_anh",
      11: "created_at",
      12: "updated_at",
    },
  },
  {
    sheetName: "Users",
    columns: {
      0: "id",
      1: "email",
      2: "name",
      3: "role",
      4: "default_plant_id",
      5: "plants_json",
    },
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ColumnStatus = "ok" | "warning" | "missing";

interface ColumnResult {
  index: number;
  expected: string;
  actual?: string;
  foundAt?: number;
  status: ColumnStatus;
}

interface SheetResult {
  sheetName: string;
  status: "ok" | "mismatch" | "error";
  errorMessage?: string;
  columns: ColumnResult[];
}

interface Report {
  plant: string;
  generatedAt: string;
  sheets: SheetResult[];
  summary: { ok: number; warnings: number; missing: number };
}

// ─── Core logic ───────────────────────────────────────────────────────────────

async function fetchHeaderRow(
  sheetsClient: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
  sheetName: string,
): Promise<string[]> {
  const response = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:ZZ1`,
  });
  const values = response.data.values;
  if (!values || values.length === 0) return [];
  return (values[0] as string[]).map((v) => (v ?? "").trim());
}

function compareColumns(
  mapping: SheetMapping,
  actualHeaders: string[],
): ColumnResult[] {
  return Object.entries(mapping.columns).map(([idxStr, expected]) => {
    const index = parseInt(idxStr, 10);
    const actual = actualHeaders[index];

    if (actual === expected) {
      return { index, expected, actual, status: "ok" as ColumnStatus };
    }

    // Check if the expected name exists elsewhere in the header row
    const foundAt = actualHeaders.indexOf(expected);
    if (foundAt !== -1) {
      return { index, expected, foundAt, status: "warning" as ColumnStatus };
    }

    return { index, expected, status: "missing" as ColumnStatus };
  });
}

function printSheetResult(result: SheetResult): void {
  console.log(`\nSheet: ${result.sheetName}`);

  if (result.status === "error") {
    console.log(`  ❌ Error: ${result.errorMessage}`);
    return;
  }

  for (const col of result.columns) {
    const idxLabel = `[${col.index}]`.padEnd(5);
    const nameLabel = col.expected.padEnd(24);

    if (col.status === "ok") {
      console.log(`  ${idxLabel} ${nameLabel} ✅ matches`);
    } else if (col.status === "warning") {
      console.log(`  ${idxLabel} ${nameLabel} ⚠️  found at index ${col.foundAt}`);
    } else {
      console.log(`  ${idxLabel} ${nameLabel} ❌ not found`);
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Parse --plant argument
  const plantArgIdx = process.argv.indexOf("--plant");
  if (plantArgIdx === -1 || !process.argv[plantArgIdx + 1]) {
    console.error(
      "Usage: npx ts-node --project tsconfig.json src/scripts/verify-column-mapping.ts --plant <PLANTID>",
    );
    console.error("  Available plants: NMQM, NMXH, NMCT");
    process.exit(1);
  }
  const plantId = process.argv[plantArgIdx + 1];

  try {
    const plant = getPlant(plantId);

    if (!plant.sheetsId) {
      throw new Error(
        `No spreadsheet ID configured for plant "${plantId}". ` +
          `Set SHEETS_ID_${plantId} in .env.local.`,
      );
    }

    const sheetsClient = getSheetsClient();
    const sheetResults: SheetResult[] = [];

    console.log(`\nVerifying column mappings for plant: ${plantId} (${plant.name})`);
    console.log(`Spreadsheet ID: ${plant.sheetsId}`);
    console.log("─".repeat(60));

    for (const mapping of SHEET_MAPPING) {
      let sheetResult: SheetResult;

      try {
        const actualHeaders = await fetchHeaderRow(
          sheetsClient,
          plant.sheetsId,
          mapping.sheetName,
        );

        const columnResults = compareColumns(mapping, actualHeaders);
        const hasMismatch = columnResults.some(
          (c) => c.status === "warning" || c.status === "missing",
        );

        sheetResult = {
          sheetName: mapping.sheetName,
          status: hasMismatch ? "mismatch" : "ok",
          columns: columnResults,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        sheetResult = {
          sheetName: mapping.sheetName,
          status: "error",
          errorMessage: message,
          columns: [],
        };
      }

      sheetResults.push(sheetResult);
      printSheetResult(sheetResult);
    }

    // Compute summary
    const summary = { ok: 0, warnings: 0, missing: 0 };
    for (const sheet of sheetResults) {
      for (const col of sheet.columns) {
        if (col.status === "ok") summary.ok++;
        else if (col.status === "warning") summary.warnings++;
        else if (col.status === "missing") summary.missing++;
      }
    }

    console.log("\n" + "─".repeat(60));
    console.log(
      `Summary: ✅ ${summary.ok} ok  ⚠️  ${summary.warnings} warnings  ❌ ${summary.missing} missing`,
    );

    // Write report
    const report: Report = {
      plant: plantId,
      generatedAt: new Date().toISOString(),
      sheets: sheetResults,
      summary,
    };

    const reportPath = path.resolve(process.cwd(), "column-mapping-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`\nReport written to: ${reportPath}`);

    // Exit with non-zero if there are mismatches
    if (summary.warnings > 0 || summary.missing > 0) {
      process.exit(2);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${message}`);
    process.exit(1);
  }
}

main();
