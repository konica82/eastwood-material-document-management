import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError } from "@/lib/api-helpers";
import { computeDashboardMetrics } from "@/lib/services/dashboard.service";

type Ctx = { params: Promise<{ plantId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const cargos = await getServerRepository("cargo").list(plantId);
    const data = computeDashboardMetrics(cargos);
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
