import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ plantId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const xe_hang_id = req.nextUrl.searchParams.get("xe_hang_id") ?? undefined;
    const query = xe_hang_id ? { filters: { xe_hang_id } } : undefined;
    const data = await getServerRepository("weighing-slip", plantId).list(plantId, query);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
