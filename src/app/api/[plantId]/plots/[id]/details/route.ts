import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, apiError, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const data = await getServerRepository("plot", plantId).getWithDetails(plantId, id);
    if (!data) return apiError("NOT_FOUND", `Không tìm thấy lô rừng ${id}.`, 404);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
