// POST — upload a file to the plant's Drive folder
// Reads multipart form data: file (binary), filename (string), mimeType (string)
// Returns { data: { fileId, webViewLink } }
import { NextRequest } from 'next/server';
import { uploadFile } from '@/lib/drive-client';
import { ok, handleError, forbiddenError, validationError } from '@/lib/api-helpers';
import { getSessionUser, hasPlantAccess } from '@/lib/auth';

type Ctx = { params: Promise<{ plantId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { plantId } = await params;
    const user = await getSessionUser();
    if (!hasPlantAccess(user, plantId)) return forbiddenError();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const filename = formData.get('filename') as string | null;
    if (!file || !filename) return validationError('file và filename là bắt buộc');

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(plantId, buffer, filename, file.type || 'application/octet-stream');
    return ok(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
