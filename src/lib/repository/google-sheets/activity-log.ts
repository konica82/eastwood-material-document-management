/**
 * Google Sheets adapter — ActivityLog sheet (append-only).
 *
 * ActivityLog columns:
 *   A=id, B=plant_id, C=entity_type, D=entity_id, E=action,
 *   F=description, G=created_by, H=created_at
 */

import type { ActivityLogEntry, ActivityAction } from "../../../types/index";
import type { ActivityLogRepository, AppendActivityLogInput } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRange, cell, appendRows } from "./base";
import { listCacheKey } from "../../cache";
import { cache, TTL } from "../../cache";
import { randomUUID } from "crypto";

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0, PLANT_ID: 1, ENTITY_TYPE: 2, ENTITY_ID: 3,
  ACTION: 4, DESCRIPTION: 5, CREATED_BY: 6, CREATED_AT: 7,
} as const;

const COL_LEN = 8;
const SHEET_BASE = "ActivityLog";
const sheet = (plantId: string) => `${SHEET_BASE}_${plantId}`;
const range = (plantId: string) => `${sheet(plantId)}!A2:H`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToEntry(row: string[]): ActivityLogEntry {
  return {
    id: cell(row, COL.ID),
    plant_id: cell(row, COL.PLANT_ID),
    entity_type: cell(row, COL.ENTITY_TYPE),
    entity_id: cell(row, COL.ENTITY_ID),
    action: cell(row, COL.ACTION) as ActivityAction,
    description: cell(row, COL.DESCRIPTION),
    created_by: cell(row, COL.CREATED_BY),
    created_at: cell(row, COL.CREATED_AT),
  };
}

export function entryToRow(e: ActivityLogEntry): string[] {
  const row = new Array<string>(COL_LEN).fill("");
  row[COL.ID] = e.id;
  row[COL.PLANT_ID] = e.plant_id;
  row[COL.ENTITY_TYPE] = e.entity_type;
  row[COL.ENTITY_ID] = e.entity_id;
  row[COL.ACTION] = e.action;
  row[COL.DESCRIPTION] = e.description;
  row[COL.CREATED_BY] = e.created_by;
  row[COL.CREATED_AT] = e.created_at;
  return row;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makeActivityLogRepository(plantId: string): ActivityLogRepository {
  return {
    async list(_plantId: string, query?: ListQuery): Promise<ActivityLogEntry[]> {
      const key = listCacheKey("activity-log", plantId, "all");
      const cached = cache.get<ActivityLogEntry[]>(key);
      if (!cached) {
        const rows = await readRange(plantId, range(plantId));
        const entries = rows
          .filter((r) => r[COL.ID] && r[COL.PLANT_ID] === plantId)
          .map(rowToEntry)
          .reverse(); // most recent first

        cache.set(key, entries, TTL.CARGO_DETAIL);

        if (!query?.search) return entries;
        const q = query.search.toLowerCase();
        return entries.filter((e) => e.description.toLowerCase().includes(q));
      }

      if (!query?.search) return cached;
      const q = query.search.toLowerCase();
      return cached.filter((e) => e.description.toLowerCase().includes(q));
    },

    async append(input: AppendActivityLogInput): Promise<ActivityLogEntry> {
      const now = new Date().toISOString();
      const entry: ActivityLogEntry = {
        id: randomUUID(),
        plant_id: input.plant_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        description: input.description,
        created_by: "system", // Phase 2: use real user ID from session
        created_at: now,
      };

      await appendRows(input.plant_id, `${sheet(input.plant_id)}!A:H`, [entryToRow(entry)]);
      cache.invalidate(`activity-log:${input.plant_id}:*`);
      return entry;
    },
  };
}
