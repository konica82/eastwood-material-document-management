import { NextRequest } from "next/server";
import { ok, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { UpdateCargoStatusSchema } from "@/lib/schemas/cargo";
import { updateCargoStatus } from "@/lib/services/cargo.service";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const parsed = UpdateCargoStatusSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const data = await updateCargoStatus(plantId, id, parsed.data.status, parsed.data.ly_do_huy);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
