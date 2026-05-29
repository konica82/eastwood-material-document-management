import { NextRequest } from "next/server";
import { getServerRepository } from "@/lib/repository/server";
import { ok, handleError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  try {
    const data = await getServerRepository("user").getCurrentUser();
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
