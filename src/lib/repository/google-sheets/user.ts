/**
 * Google Sheets adapter — Users sheet.
 *
 * Sheet name: Users
 * Columns: A=id, B=email, C=name, D=role, E=defaultPlantId, F=plants (JSON)
 */

import type { User } from "../../../types/index";
import type { UserRepository } from "../types";
import { readRange, cell } from "./base";
import { cache, TTL, cacheKey } from "../../cache";

// ─── Column indices ───────────────────────────────────────────────────────────

const COL = {
  ID: 0,
  EMAIL: 1,
  NAME: 2,
  ROLE: 3,
  DEFAULT_PLANT_ID: 4,
  PLANTS_JSON: 5,
} as const;

const SHEET = "Users";
const RANGE = `${SHEET}!A2:F`;

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToUser(row: string[]): User {
  let plants: User["plants"] = [];
  try {
    plants = JSON.parse(cell(row, COL.PLANTS_JSON) || "[]");
  } catch {
    plants = [];
  }

  return {
    id: cell(row, COL.ID),
    email: cell(row, COL.EMAIL),
    name: cell(row, COL.NAME),
    role: (cell(row, COL.ROLE) as User["role"]) || "User",
    defaultPlantId: cell(row, COL.DEFAULT_PLANT_ID) || null,
    plants,
  };
}

export function userToRow(user: User): string[] {
  return [
    user.id,
    user.email,
    user.name,
    user.role,
    user.defaultPlantId ?? "",
    JSON.stringify(user.plants),
  ];
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * In Phase 1 getCurrentUser reads from a fixed "current user" env var or
 * returns the first user in the Users sheet. Phase 2 wires in real auth.
 *
 * The Users sheet is cross-plant so we read from the first configured plant.
 */
export function makeUserRepository(plantId: string): UserRepository {
  return {
    async getCurrentUser(): Promise<User> {
      const key = cacheKey("user", plantId, "current");
      const cached = cache.get<User>(key);
      if (cached) return cached;

      const rows = await readRange(plantId, RANGE);
      // Return the first user as the "current" user (Phase 1 placeholder).
      const firstRow = rows[0];
      if (!firstRow || firstRow.every((c) => c === "")) {
        throw new Error("No users found in Users sheet");
      }

      const user = rowToUser(firstRow);
      cache.set(key, user, TTL.USER);
      return user;
    },
  };
}
