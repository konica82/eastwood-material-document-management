/**
 * GET /api/drive-file?path=PlotDocuments_Files_/id.FilePath.pdf
 *
 * Resolves an AppSheet relative Drive path to its file ID, then redirects
 * to a Google Drive viewer URL so the file opens in the browser.
 * File IDs are cached in memory.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/sheets-client";

const FOLDER_MAP: Record<string, string> = {
  "PlotDocuments_Files_": process.env.DRIVE_FOLDER_PLOT_DOCS ?? "",
};

const fileIdCache = new Map<string, string>();

async function resolveFileId(folderId: string, filename: string): Promise<string | null> {
  const key = `${folderId}:${filename}`;
  const cached = fileIdCache.get(key);
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
  if (fileId) fileIdCache.set(key, fileId);
  return fileId;
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const slashIdx = path.indexOf("/");
  if (slashIdx === -1) return NextResponse.json({ error: "Invalid path format" }, { status: 400 });

  const folderKey = path.slice(0, slashIdx);
  const filename  = path.slice(slashIdx + 1);
  const folderId  = FOLDER_MAP[folderKey];

  if (!folderId) return NextResponse.json({ error: `Unknown folder: ${folderKey}` }, { status: 400 });

  try {
    const fileId = await resolveFileId(folderId, filename);
    if (!fileId) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Open in Google Drive viewer (works for PDF, images, Docs, Sheets, etc.)
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    console.error("[drive-file]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
