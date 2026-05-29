import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { WeighInSchema } from "@/lib/schemas/weighing";

type Ctx = { params: Promise<{ plantId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    const plantRole = getPlantRole(user, plantId);
    if (!plantRole || !meetsRole(plantRole, 'User')) return forbiddenError();

    const parsed = WeighInSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

    const { cargoId, dlc_ngay_can_vao, dlc_can_vao } = parsed.data;
    const data = await getServerRepository("weighing-slip").recordWeighIn(
      plantId, cargoId, dlc_ngay_can_vao, dlc_can_vao,
    );
    return ok(data, 201);
  } catch (err) {
    return handleError(err);
  }
}
