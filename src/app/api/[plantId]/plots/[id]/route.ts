import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, apiError, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { PatchPlotSchema } from "@/lib/schemas/plot";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();

    const data = await getServerRepository("plot").get(plantId, id);
    if (!data) return apiError("NOT_FOUND", `Không tìm thấy lô rừng ${id}.`, 404);
    return ok(data);
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
    if (!plantRole || !meetsRole(plantRole, 'Manager')) return forbiddenError();

    const parsed = PatchPlotSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const data = await getServerRepository("plot").update(plantId, id, parsed.data);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
