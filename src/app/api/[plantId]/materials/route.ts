import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ plantId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const data = await getServerRepository("material", plantId).list(plantId, { search });
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
