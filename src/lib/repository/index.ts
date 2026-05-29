/**
 * Repository factory — client-safe version.
 *
 * This module is imported by both Server and Client Components.
 * It always returns the mock adapter so it never pulls Node.js-only
 * dependencies into the client bundle.
 *
 * For server-side code (Route Handlers, Server Actions, Server Components)
 * that needs live Google Sheets data, import from
 *   src/lib/repository/server.ts
 * instead — that module is guarded by `server-only` and switches on
 * REPOSITORY_ADAPTER at runtime.
 *
 * Usage (client or server, mock data):
 *   const repo = getRepository("cargo");
 *   const cargo = await repo.get(plantId, cargoId);
 *
 * Usage (server-only, live data when REPOSITORY_ADAPTER=google-sheets):
 *   import { getServerRepository } from '@/lib/repository/server';
 *   const repo = getServerRepository("cargo");
 */

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
import { mockCargoRepository }       from "./mock/cargo";
import { mockDriverRepository }       from "./mock/driver";
import { mockWeighingSlipRepository } from "./mock/weighing-slip";
import { mockMaterialRepository }     from "./mock/material";
import { mockSupplierRepository }     from "./mock/supplier";
import { mockPlotRepository }         from "./mock/plot";
import { mockActivityLogRepository }  from "./mock/activity-log";
import { mockDashboardRepository }    from "./mock/dashboard";
import { mockUserRepository }         from "./mock/user";

// ─── Entity name registry ─────────────────────────────────────────────────────

export type EntityName =
  | "cargo"
  | "weighing-slip"
  | "driver"
  | "material"
  | "supplier"
  | "plot"
  | "activity-log"
  | "dashboard"
  | "user";

export type RepositoryMap = {
  cargo: CargoRepository;
  "weighing-slip": WeighingSlipRepository;
  driver: DriverRepository;
  material: MaterialRepository;
  supplier: SupplierRepository;
  plot: PlotRepository;
  "activity-log": ActivityLogRepository;
  dashboard: DashboardRepository;
  user: UserRepository;
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getRepository(entity: "cargo"): CargoRepository;
export function getRepository(entity: "weighing-slip"): WeighingSlipRepository;
export function getRepository(entity: "driver"): DriverRepository;
export function getRepository(entity: "material"): MaterialRepository;
export function getRepository(entity: "supplier"): SupplierRepository;
export function getRepository(entity: "plot"): PlotRepository;
export function getRepository(entity: "activity-log"): ActivityLogRepository;
export function getRepository(entity: "dashboard"): DashboardRepository;
export function getRepository(entity: "user"): UserRepository;
export function getRepository(entity: EntityName): RepositoryMap[EntityName];

export function getRepository(entity: EntityName): RepositoryMap[EntityName] {
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
