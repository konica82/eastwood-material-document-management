/**
 * Server-only repository factory.
 *
 * Switches between the mock adapter and the Google Sheets adapter based on
 * REPOSITORY_ADAPTER. Import this in:
 *   - Route Handlers (app/api/**)
 *   - Server Actions
 *   - Server Components that need live data
 *
 * DO NOT import this in Client Components or pages that run on the browser —
 * use the mock-safe getRepository() from './index' instead.
 *
 * Environment variables:
 *   REPOSITORY_ADAPTER=mock           — in-memory mock (default)
 *   REPOSITORY_ADAPTER=google-sheets  — live Google Sheets data
 *   DEFAULT_PLANT_ID=NMQM             — plant used when no per-request plantId is available
 */

import "server-only";

import type {
  CargoRepository,
  WeighingSlipRepository,
  DriverRepository,
  MaterialRepository,
  SupplierRepository,
  PlotRepository,
  ActivityLogRepository,
  DashboardRepository,
  UserRepository,
} from "./types";
import type { EntityName, RepositoryMap } from "./index";

// ─── Mock adapters ────────────────────────────────────────────────────────────

import { mockCargoRepository }       from "./mock/cargo";
import { mockDriverRepository }       from "./mock/driver";
import { mockWeighingSlipRepository } from "./mock/weighing-slip";
import { mockMaterialRepository }     from "./mock/material";
import { mockSupplierRepository }     from "./mock/supplier";
import { mockPlotRepository }         from "./mock/plot";
import { mockActivityLogRepository }  from "./mock/activity-log";
import { mockDashboardRepository }    from "./mock/dashboard";
import { mockUserRepository }         from "./mock/user";

// ─── Google Sheets adapters (server-only) ─────────────────────────────────────

import {
  makeCargoRepository,
  makeDriverRepository,
  makeWeighingSlipRepository,
  makeMaterialRepository,
  makeSupplierRepository,
  makePlotRepository,
  makeActivityLogRepository,
  makeDashboardRepository,
  makeUserRepository,
} from "./google-sheets/index";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isGoogleSheets(): boolean {
  return process.env.REPOSITORY_ADAPTER === "google-sheets";
}

function defaultPlantId(): string {
  return process.env.DEFAULT_PLANT_ID ?? "NMQM";
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getServerRepository(entity: "cargo"): CargoRepository;
export function getServerRepository(entity: "weighing-slip"): WeighingSlipRepository;
export function getServerRepository(entity: "driver"): DriverRepository;
export function getServerRepository(entity: "material"): MaterialRepository;
export function getServerRepository(entity: "supplier"): SupplierRepository;
export function getServerRepository(entity: "plot"): PlotRepository;
export function getServerRepository(entity: "activity-log"): ActivityLogRepository;
export function getServerRepository(entity: "dashboard"): DashboardRepository;
export function getServerRepository(entity: "user"): UserRepository;
export function getServerRepository(entity: EntityName): RepositoryMap[EntityName];

export function getServerRepository(entity: EntityName): RepositoryMap[EntityName] {
  if (isGoogleSheets()) {
    const p = defaultPlantId();
    switch (entity) {
      case "cargo":         return makeCargoRepository(p);
      case "weighing-slip": return makeWeighingSlipRepository(p);
      case "driver":        return makeDriverRepository(p);
      case "material":      return makeMaterialRepository(p);
      case "supplier":      return makeSupplierRepository(p);
      case "plot":          return makePlotRepository(p);
      case "activity-log":  return makeActivityLogRepository(p);
      case "dashboard":     return makeDashboardRepository(p);
      case "user":          return makeUserRepository(p);
    }
  }

  switch (entity) {
    case "cargo":         return mockCargoRepository;
    case "weighing-slip": return mockWeighingSlipRepository;
    case "driver":        return mockDriverRepository;
    case "material":      return mockMaterialRepository;
    case "supplier":      return mockSupplierRepository;
    case "plot":          return mockPlotRepository;
    case "activity-log":  return mockActivityLogRepository;
    case "dashboard":     return mockDashboardRepository;
    case "user":          return mockUserRepository;
  }
}
