import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, apiError, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { PatchCargoSchema } from "@/lib/schemas/cargo";
import { updateCargo } from "@/lib/services/cargo.service";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();

    const cargo = await getServerRepository("cargo", plantId).get(plantId, id);
    if (!cargo) return apiError("NOT_FOUND", `Không tìm thấy chuyến hàng ${id}.`, 404);

    const [material, driver, supplier] = await Promise.all([
      cargo.nguyen_lieu_id  ? getServerRepository("material", plantId).get(plantId, cargo.nguyen_lieu_id)  : null,
      cargo.tai_xe_id       ? getServerRepository("driver",   plantId).get(plantId, cargo.tai_xe_id)       : null,
      cargo.nha_cung_cap_id ? getServerRepository("supplier", plantId).get(plantId, cargo.nha_cung_cap_id) : null,
    ]);

    return ok({ ...cargo, nguyen_lieu: material, tai_xe: driver, nha_cung_cap: supplier });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const parsed = PatchCargoSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const data = await updateCargo(plantId, id, parsed.data);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
