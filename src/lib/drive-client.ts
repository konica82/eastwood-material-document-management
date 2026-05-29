/**
 * Google Drive helpers — upload, stream, and delete files for a plant's folder.
 *
 * Files are stored in the plant-specific Drive folder (driveFolderId from
 * PlantConfig). Only the file ID and webViewLink are stored in Sheets rows;
 * file contents never touch the spreadsheet.
 */

import { Readable } from "stream";
import { getDriveClient, withRetry } from "./sheets-client";
import { getPlant } from "./plants/config";

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

export async function uploadFile(
  plantId: string,
  file: Buffer,
  filename: string,
  mimeType: string,
): Promise<DriveUploadResult> {
  const { driveFolderId } = getPlant(plantId);
  const drive = getDriveClient();

  const res = await withRetry(
    () =>
      drive.files.create({
        requestBody: {
          name: filename,
          parents: [driveFolderId],
        },
        media: {
          mimeType,
          body: Readable.from(file),
        },
        fields: "id,webViewLink",
      }),
    "drive",
    "upload",
  );

  const fileId = res.data.id;
  const webViewLink = res.data.webViewLink;

  if (!fileId || !webViewLink) {
    throw new Error(`Drive upload succeeded but returned no id/webViewLink for ${filename}`);
  }

  // Make the file readable by anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return { fileId, webViewLink };
}

export async function getFileStream(fileId: string): Promise<Readable> {
  const drive = getDriveClient();
  const res = await withRetry(
    () =>
      drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" },
      ),
    "drive",
    "getStream",
  );
  return res.data as unknown as Readable;
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await withRetry(
    () => drive.files.delete({ fileId }),
    "drive",
    "delete",
  );
}
