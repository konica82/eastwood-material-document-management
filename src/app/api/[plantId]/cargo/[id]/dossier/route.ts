import { NextRequest } from "next/server";
import { ok, handleError, forbiddenError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { completeDossier } from "@/lib/services/cargo.service";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const data = await completeDossier(plantId, id);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
