/**
 * Typed fetch wrappers for every API route.
 *
 * Pages import these instead of calling getRepository() directly.
 * All functions throw on non-2xx responses with the server's error message.
 */

import type {
  Cargo, CargoStatus, Driver, Material, Supplier, SecondarySupplier,
  PlotRegistry, WeighingSlip, ActivityLogEntry, DashboardMetrics,
} from "@/types/index";
import type { CreateCargoInput } from "@/lib/repository/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const json = await res.json() as { data: T | null; error: { message: string } | null };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

// ─── Cargo ────────────────────────────────────────────────────────────────────

export const cargoApi = {
  list: (plantId: string, params?: { trang_thai?: string; dateFrom?: string; dateTo?: string }) => {
    const q = new URLSearchParams();
    if (params?.trang_thai) q.set("trang_thai", params.trang_thai);
    if (params?.dateFrom)   q.set("dateFrom", params.dateFrom);
    if (params?.dateTo)     q.set("dateTo", params.dateTo);
    const qs = q.toString();
    return apiFetch<Cargo[]>(`/api/${plantId}/cargo${qs ? `?${qs}` : ""}`);
  },

  get: (plantId: string, id: string) =>
    apiFetch<Cargo>(`/api/${plantId}/cargo/${id}`),

  create: (plantId: string, input: CreateCargoInput) =>
    apiFetch<Cargo>(`/api/${plantId}/cargo`, { method: "POST", ...json(input) }),

  update: (plantId: string, id: string, patch: Partial<Cargo>) =>
    apiFetch<Cargo>(`/api/${plantId}/cargo/${id}`, { method: "PATCH", ...json(patch) }),

  updateStatus: (plantId: string, id: string, status: CargoStatus, ly_do_huy?: string) =>
    apiFetch<Cargo>(`/api/${plantId}/cargo/${id}/status`, {
      method: "PATCH", ...json({ status, ly_do_huy }),
    }),

  completeDossier: (plantId: string, id: string) =>
    apiFetch<Cargo>(`/api/${plantId}/cargo/${id}/dossier`, { method: "PATCH", ...json({}) }),
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const materialApi = {
  list: (plantId: string, search?: string) =>
    apiFetch<Material[]>(`/api/${plantId}/materials${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  get: (plantId: string, id: string) =>
    apiFetch<Material>(`/api/${plantId}/materials/${id}`),

  update: (plantId: string, id: string, patch: Partial<Material>) =>
    apiFetch<Material>(`/api/${plantId}/materials/${id}`, { method: "PATCH", ...json(patch) }),
};

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const driverApi = {
  list: (plantId: string, search?: string) =>
    apiFetch<Driver[]>(`/api/${plantId}/drivers${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  get: (plantId: string, id: string) =>
    apiFetch<Driver>(`/api/${plantId}/drivers/${id}`),

  update: (plantId: string, id: string, patch: Partial<Driver>) =>
    apiFetch<Driver>(`/api/${plantId}/drivers/${id}`, { method: "PATCH", ...json(patch) }),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const supplierApi = {
  list: (plantId: string, search?: string) =>
    apiFetch<Supplier[]>(`/api/${plantId}/suppliers${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  get: (plantId: string, id: string) =>
    apiFetch<Supplier>(`/api/${plantId}/suppliers/${id}`),

  update: (plantId: string, id: string, patch: Partial<Supplier>) =>
    apiFetch<Supplier>(`/api/${plantId}/suppliers/${id}`, { method: "PATCH", ...json(patch) }),

  listSecondary: (plantId: string, supplierId: string) =>
    apiFetch<SecondarySupplier[]>(`/api/${plantId}/suppliers/${supplierId}/secondary`),

  getSecondary: (plantId: string, id: string) =>
    apiFetch<SecondarySupplier>(`/api/${plantId}/secondary-suppliers/${id}`),

  updateSecondary: (plantId: string, id: string, patch: Partial<SecondarySupplier>) =>
    apiFetch<SecondarySupplier>(`/api/${plantId}/secondary-suppliers/${id}`, {
      method: "PATCH", ...json(patch),
    }),
};

// ─── Plots ────────────────────────────────────────────────────────────────────

export const plotApi = {
  list: (plantId: string, search?: string) =>
    apiFetch<PlotRegistry[]>(`/api/${plantId}/plots${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  get: (plantId: string, id: string) =>
    apiFetch<PlotRegistry>(`/api/${plantId}/plots/${id}`),

  getWithDetails: (plantId: string, id: string) =>
    apiFetch<PlotRegistry>(`/api/${plantId}/plots/${id}/details`),

  update: (plantId: string, id: string, patch: Partial<PlotRegistry>) =>
    apiFetch<PlotRegistry>(`/api/${plantId}/plots/${id}`, { method: "PATCH", ...json(patch) }),
};

// ─── Weighing slips ───────────────────────────────────────────────────────────

export const weighingSlipApi = {
  list: (plantId: string, xe_hang_id?: string) =>
    apiFetch<WeighingSlip[]>(`/api/${plantId}/weighing-slips${xe_hang_id ? `?xe_hang_id=${xe_hang_id}` : ""}`),

  recordWeighIn: (plantId: string, cargoId: string, dlc_ngay_can_vao: string, dlc_can_vao: number) =>
    apiFetch<WeighingSlip>(`/api/${plantId}/weighing-slips/weigh-in`, {
      method: "POST", ...json({ cargoId, dlc_ngay_can_vao, dlc_can_vao }),
    }),

  recordWeighOut: (plantId: string, slipId: string, dlc_ngay_can_ra: string, dlc_can_ra: number) =>
    apiFetch<WeighingSlip>(`/api/${plantId}/weighing-slips/${slipId}/weigh-out`, {
      method: "POST", ...json({ dlc_ngay_can_ra, dlc_can_ra }),
    }),
};

// ─── Activity log ─────────────────────────────────────────────────────────────

export const activityLogApi = {
  list: (plantId: string) =>
    apiFetch<ActivityLogEntry[]>(`/api/${plantId}/activity-log`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getMetrics: (plantId: string) =>
    apiFetch<DashboardMetrics>(`/api/${plantId}/dashboard`),
};
