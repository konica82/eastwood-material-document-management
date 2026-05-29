/**
 * Plant configuration — the operational facts about each factory site.
 *
 * This is a config file, not a database table. Changing a spreadsheet ID
 * means editing this file and redeploying; no admin UI is needed for phase 1.
 *
 * `PlantConfig` is intentionally simpler than the `Plant` domain type in
 * src/types/index.ts. The domain type is what components and repositories
 * work with; this config is what the adapter layer reads at startup.
 */

import type { User } from "../../types/index";

// ─── Config type ──────────────────────────────────────────────────────────────

export interface PlantConfig {
  id: string;           // short code used as the plantId throughout the app
  displayName: string;  // shown in the plant switcher (e.g. "NMQM")
  name: string;         // full Vietnamese plant name
  timezone: string;     // IANA tz — used for "today" boundaries (Business Rules 8–9)
  /** Main Google Sheets spreadsheet ID for this plant. */
  sheetsId: string;
  /** Root Google Drive folder ID for this plant's uploaded files. */
  driveFolderId: string;
}

// ─── Plant registry ───────────────────────────────────────────────────────────

/**
 * The three factory plants. Replace the placeholder IDs with real values
 * from Google Drive / Sheets before connecting the Sheets adapter.
 *
 * Order matters: NMQM is listed first because it is the highest-volume site
 * and the default for new users until they choose a preferred plant.
 */
/**
 * Shared spreadsheet for Lô Rừng (Plot Registry) — managed by AppSheet,
 * used across all plants. Not a real plant; only referenced by the plot adapter.
 */
export const LORUNG_SHEETS_ID = process.env.SHEETS_ID_LORUNG ?? "";

export const PLANTS: Record<string, PlantConfig> = {
  NMQM: {
    id: "NMQM",
    displayName: "NMQM",
    name: "Nhà máy Quảng Minh",
    timezone: "Asia/Ho_Chi_Minh",
    sheetsId: process.env.SHEETS_ID_NMQM ?? "",
    driveFolderId: process.env.DRIVE_FOLDER_NMQM ?? "",
  },
  NMXH: {
    id: "NMXH",
    displayName: "NMXH",
    name: "Nhà máy Xuân Hòa",
    timezone: "Asia/Ho_Chi_Minh",
    sheetsId: process.env.SHEETS_ID_NMXH ?? "",
    driveFolderId: process.env.DRIVE_FOLDER_NMXH ?? "",
  },
  NMCT: {
    id: "NMCT",
    displayName: "NMCT",
    name: "Nhà máy Cà Tang",
    timezone: "Asia/Ho_Chi_Minh",
    sheetsId: process.env.SHEETS_ID_NMCT ?? "",
    driveFolderId: process.env.DRIVE_FOLDER_NMCT ?? "",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up a plant by its ID. Throws a descriptive error for unknown IDs so
 * any misconfigured plantId surfaces immediately rather than silently
 * returning undefined and causing a downstream null-reference.
 */
export function getPlant(plantId: string): PlantConfig {
  const plant = PLANTS[plantId];
  if (!plant) {
    const valid = Object.keys(PLANTS).join(", ");
    throw new Error(
      `Unknown plantId "${plantId}". Valid plant IDs are: ${valid}.`,
    );
  }
  return plant;
}

/**
 * Return only the plants the user has been granted access to, in the order
 * they appear in PLANTS (stable, high-volume first).
 *
 * A user with no matching plants returns an empty array. This is a valid
 * state for a newly registered user awaiting approval — the UI should show
 * an "awaiting access" screen, not an error.
 */
export function getUserPlants(user: User): PlantConfig[] {
  const accessibleIds = new Set(user.plants.map((p) => p.plantId));
  return Object.values(PLANTS).filter((plant) => accessibleIds.has(plant.id));
}
