import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { WeighOutSchema } from "@/lib/schemas/weighing";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const parsed = WeighOutSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const { dlc_ngay_can_ra, dlc_can_ra } = parsed.data;
    const data = await getServerRepository("weighing-slip", plantId).recordWeighOut(
      plantId, id, dlc_ngay_can_ra, dlc_can_ra,
    );
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
