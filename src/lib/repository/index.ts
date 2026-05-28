/**
 * Repository factory.
 *
 * The single place where the rest of the application obtains a repository.
 * Today every call throws "not implemented" — the Sheets adapter wires in
 * next. When the adapter is ready, replace the stub bodies without changing
 * any call site.
 *
 * Usage:
 *   const repo = getRepository("cargo");
 *   const cargo = await repo.get(plantId, cargoId);
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
import { mockMaterialRepository } from "./mock/material";
import { mockSupplierRepository } from "./mock/supplier";
import { mockUserRepository } from "./mock/user";

// ─── Entity name registry ─────────────────────────────────────────────────────

/** All entity names the factory understands. Adding a new entity = add it here. */
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

/** Maps entity name → its repository interface. */
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

const NOT_IMPLEMENTED = (entity: string) =>
  new Error(
    `Repository for "${entity}" is not implemented yet. ` +
      "Wire the Sheets adapter before calling this method.",
  );

/**
 * Typed overloads so callers get the exact repository interface back — no
 * casting required at the call site.
 */
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
  // Each case returns an object that satisfies the correct interface at
  // compile time. Every method throws at runtime until the adapter is wired.
  switch (entity) {
    case "cargo":
      return {
        list: () => { throw NOT_IMPLEMENTED("cargo"); },
        get: () => { throw NOT_IMPLEMENTED("cargo"); },
        update: () => { throw NOT_IMPLEMENTED("cargo"); },
        create: () => { throw NOT_IMPLEMENTED("cargo"); },
        updateStatus: () => { throw NOT_IMPLEMENTED("cargo"); },
        completeDossier: () => { throw NOT_IMPLEMENTED("cargo"); },
      } satisfies CargoRepository;

    case "weighing-slip":
      return {
        list: () => { throw NOT_IMPLEMENTED("weighing-slip"); },
        get: () => { throw NOT_IMPLEMENTED("weighing-slip"); },
        update: () => { throw NOT_IMPLEMENTED("weighing-slip"); },
        recordWeighIn: () => { throw NOT_IMPLEMENTED("weighing-slip"); },
        recordWeighOut: () => { throw NOT_IMPLEMENTED("weighing-slip"); },
      } satisfies WeighingSlipRepository;

    case "driver":
      return {
        list: () => { throw NOT_IMPLEMENTED("driver"); },
        get: () => { throw NOT_IMPLEMENTED("driver"); },
        update: () => { throw NOT_IMPLEMENTED("driver"); },
        findByPlate: () => { throw NOT_IMPLEMENTED("driver"); },
      } satisfies DriverRepository;

    case "material":
      return mockMaterialRepository;

    case "supplier":
      return mockSupplierRepository;

    case "plot":
      return {
        list: () => { throw NOT_IMPLEMENTED("plot"); },
        get: () => { throw NOT_IMPLEMENTED("plot"); },
        update: () => { throw NOT_IMPLEMENTED("plot"); },
        getWithDetails: () => { throw NOT_IMPLEMENTED("plot"); },
      } satisfies PlotRepository;

    case "activity-log":
      return {
        list: () => { throw NOT_IMPLEMENTED("activity-log"); },
        append: () => { throw NOT_IMPLEMENTED("activity-log"); },
      } satisfies ActivityLogRepository;

    case "dashboard":
      return {
        getMetrics: () => { throw NOT_IMPLEMENTED("dashboard"); },
      } satisfies DashboardRepository;

    case "user":
      return mockUserRepository;
  }
}
