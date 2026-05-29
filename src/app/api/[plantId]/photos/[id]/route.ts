// DELETE — remove a file from Drive
import { NextRequest } from 'next/server';
import { deleteFile } from '@/lib/drive-client';
import { ok, handleError, forbiddenError } from '@/lib/api-helpers';
import { getSessionUser, hasPlantAccess } from '@/lib/auth';

type Ctx = { params: Promise<{ plantId: string; id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { plantId, id } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();
    await deleteFile(id);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
