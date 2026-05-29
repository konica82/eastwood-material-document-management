import { NextRequest } from "next/server";
import { ok, handleError, forbiddenError, validationError, meetsRole } from "@/lib/api-helpers";
import { getSessionUser, hasPlantAccess, getPlantRole } from "@/lib/auth";
import { getServerRepository } from "@/lib/repository/server";
import { CreateCargoSchema } from "@/lib/schemas/cargo";
import { createCargo } from "@/lib/services/cargo.service";

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
    };
    const repo = getServerRepository("cargo", plantId);
    const data = await repo.list(plantId, query);
    return ok(data);
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
