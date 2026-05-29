import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const data = await getServerRepository("supplier", plantId).listSecondary(plantId, id);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
