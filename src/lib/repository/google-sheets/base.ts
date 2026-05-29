/**
 * Shared helpers for all Google Sheets entity adapters.
 *
 * Provides:
 *   - readRange / appendRows / updateRow — thin wrappers with retry + error normalisation
 *   - Write queue — batches mutations within a 200 ms window before flushing
 */

import { getSheetsClient, withRetry, normaliseSheetsError } from "../../sheets-client";
import { getPlant } from "../../plants/config";

// ─── Range reads ──────────────────────────────────────────────────────────────

/**
 * Read a named range or A1 notation from the spreadsheet for the given plant.
 * Returns the raw 2-D array of cell values (strings). Missing cells are "".
 */
export async function readRange(
  plantId: string,
  range: string,
): Promise<string[][]> {
  const { sheetsId } = getPlant(plantId);
  const sheets = getSheetsClient();

  const res = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetsId,
        range,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      }),
    range,
    "read",
  );

  return (res.data.values ?? []) as string[][];
}

// ─── Write queue ──────────────────────────────────────────────────────────────

interface WriteOp {
  spreadsheetId: string;
  range: string;
  values: string[][];
  resolve: (value: void) => void;
  reject: (reason: unknown) => void;
}

const writeQueue: WriteOp[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    const batch = writeQueue.splice(0);
    if (batch.length === 0) return;

    // Group by spreadsheetId for batchUpdate
    const grouped = new Map<string, WriteOp[]>();
    for (const op of batch) {
      const list = grouped.get(op.spreadsheetId) ?? [];
      list.push(op);
      grouped.set(op.spreadsheetId, list);
    }

    const sheets = getSheetsClient();
    for (const [spreadsheetId, ops] of grouped) {
      try {
        await withRetry(
          () =>
            sheets.spreadsheets.values.batchUpdate({
              spreadsheetId,
              requestBody: {
                valueInputOption: "RAW",
                data: ops.map((op) => ({ range: op.range, values: op.values })),
              },
            }),
          spreadsheetId,
          "batchUpdate",
        );
        ops.forEach((op) => op.resolve());
      } catch (err) {
        ops.forEach((op) => op.reject(normaliseSheetsError(err)));
      }
    }
  }, 200);
}

/** Queue a range update. Resolves when the batch flush succeeds. */
export function queueUpdate(
  plantId: string,
  range: string,
  values: string[][],
): Promise<void> {
  const { sheetsId } = getPlant(plantId);
  return new Promise((resolve, reject) => {
    writeQueue.push({ spreadsheetId: sheetsId, range, values, resolve, reject });
    scheduleFlush();
  });
}

/** Append rows immediately (append calls cannot be batched safely). */
export async function appendRows(
  plantId: string,
  range: string,
  values: string[][],
): Promise<void> {
  const { sheetsId } = getPlant(plantId);
  const sheets = getSheetsClient();
  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId: sheetsId,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values },
      }),
    range,
    "append",
  );
}

// ─── Row helpers ──────────────────────────────────────────────────────────────

/** Safely read a cell by index. Returns "" for out-of-bounds. */
export function cell(row: string[], idx: number): string {
  return row[idx] ?? "";
}

export function numCell(row: string[], idx: number): number {
  return Number(cell(row, idx)) || 0;
}

export function numOrNull(row: string[], idx: number): number | null {
  const v = cell(row, idx);
  if (v === "" || v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function boolCell(row: string[], idx: number): boolean {
  const v = cell(row, idx).toUpperCase();
  return v === "TRUE" || v === "1" || v === "YES";
}

export function strOrNull(row: string[], idx: number): string | null {
  const v = cell(row, idx);
  return v === "" ? null : v;
}

/** Map an entity back to a fixed-length row, padding with "" for missing fields. */
export function padRow(values: (string | number | boolean | null | undefined)[], length: number): string[] {
  const row = values.map((v) =>
    v === null || v === undefined ? "" : String(v),
  );
  while (row.length < length) row.push("");
  return row;
}
