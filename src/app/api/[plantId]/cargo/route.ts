import { NextRequest } from "next/server";
import { ok, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { getServerRepository } from "@/lib/repository/server";
import { CreateCargoSchema } from "@/lib/schemas/cargo";
import { createCargo } from "@/lib/services/cargo.service";
import type { Cargo } from "@/types/index";

type Ctx = { params: Promise<{ plantId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();

    const { searchParams } = req.nextUrl;
    const query = {
      search: searchParams.get("search") ?? undefined,
      filters: searchParams.get("trang_thai")
        ? { trang_thai: searchParams.get("trang_thai") }
        : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo:   searchParams.get("dateTo")   ?? undefined,
    };
    const [data, materials, drivers, suppliers] = await Promise.all([
      getServerRepository("cargo", plantId).list(plantId, query),
      getServerRepository("material", plantId).list(plantId),
      getServerRepository("driver",   plantId).list(plantId),
      getServerRepository("supplier", plantId).list(plantId),
    ]);

    const matMap = new Map(materials.map((m) => [m.id, m]));
    const drvMap = new Map(drivers.map((d)   => [d.id, d]));
    const supMap = new Map(suppliers.map((s)  => [s.id, s]));

    const resolved: Cargo[] = data.map((c) => ({
      ...c,
      nguyen_lieu:   matMap.get(c.nguyen_lieu_id)   ?? null,
      tai_xe:        drvMap.get(c.tai_xe_id)         ?? null,
      nha_cung_cap:  supMap.get(c.nha_cung_cap_id)   ?? null,
    }));

    return ok(resolved);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const parsed = CreateCargoSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const data = await createCargo(plantId, parsed.data);
    return ok(data, 201);
  } catch (err) {
    return handleError(err);
  }
}
