/**
 * GET /api/drive-image?path=NguyenLieu_Images/filename.jpg
 *
 * Resolves an AppSheet-style relative Drive path to the actual file and
 * redirects the browser to the Drive content URL. File IDs are cached in
 * memory so repeat requests skip the Drive API lookup.
 *
 * Only supports paths whose folder maps to a known Drive folder ID via
 * DRIVE_FOLDER_* env vars. Unknown prefixes return 400.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/sheets-client";

// ─── Folder map ───────────────────────────────────────────────────────────────

const FOLDER_MAP: Record<string, string> = {
  NguyenLieu_Images: process.env.DRIVE_FOLDER_NGUYEN_LIEU ?? "",
};

// ─── File ID cache ────────────────────────────────────────────────────────────

const fileIdCache = new Map<string, string>();

async function resolveFileId(folderId: string, filename: string): Promise<string | null> {
  const cacheKey = `${folderId}:${filename}`;
  const cached = fileIdCache.get(cacheKey);
  if (cached) return cached;

  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = '${filename}' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const fileId = res.data.files?.[0]?.id ?? null;
  if (fileId) fileIdCache.set(cacheKey, fileId);
  return fileId;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const slashIdx = path.indexOf("/");
  if (slashIdx === -1) {
    return NextResponse.json({ error: "Invalid path format" }, { status: 400 });
  }

  const folderName = path.slice(0, slashIdx);
  const filename = path.slice(slashIdx + 1);
  const folderId = FOLDER_MAP[folderName];

  if (!folderId) {
    return NextResponse.json({ error: `Unknown folder: ${folderName}` }, { status: 400 });
  }

  try {
    const fileId = await resolveFileId(folderId, filename);
    if (!fileId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Stream the file through our server to avoid ORB blocking on Drive URLs
    const drive = getDriveClient();
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    );

    const contentType = (res.headers as Record<string, string>)["content-type"] ?? "image/jpeg";
    const stream = res.data as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    return new NextResponse(Buffer.concat(chunks), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[drive-image]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
