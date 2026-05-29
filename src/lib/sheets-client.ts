/**
 * Google Sheets and Drive API singletons.
 *
 * Authenticates via a service account. All credentials come from environment
 * variables — never hardcoded. Exposes typed error classes so callers can
 * distinguish rate-limit (429) from not-found (404) from server errors.
 */

import { google } from "googleapis";
import type { sheets_v4, drive_v3 } from "googleapis";

// ─── Typed errors ─────────────────────────────────────────────────────────────

export class SheetsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SheetsError";
  }
}

export class QuotaExceededError extends SheetsError {
  constructor(entity: string, operation: string) {
    super(
      `Quota exceeded for ${entity}:${operation} after max retries`,
      429,
    );
    this.name = "QuotaExceededError";
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }

  // Env vars often store \n as a literal backslash-n — normalise to real newlines.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

// ─── Singletons ───────────────────────────────────────────────────────────────

let _sheetsClient: sheets_v4.Sheets | null = null;
let _driveClient: drive_v3.Drive | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
  if (!_sheetsClient) {
    const auth = getAuthClient();
    _sheetsClient = google.sheets({ version: "v4", auth });
  }
  return _sheetsClient;
}

export function getDriveClient(): drive_v3.Drive {
  if (!_driveClient) {
    const auth = getAuthClient();
    _driveClient = google.drive({ version: "v3", auth });
  }
  return _driveClient;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseSheetsError(err: any): SheetsError {
  const status: number = err?.response?.status ?? err?.code ?? 500;
  const message: string =
    err?.response?.data?.error?.message ?? err?.message ?? "Google Sheets API error";
  return new SheetsError(message, status, err);
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  entity: string,
  operation: string,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      const sheetsErr = normaliseSheetsError(err);
      if (sheetsErr.statusCode !== 429 || attempt >= MAX_RETRIES) {
        throw sheetsErr;
      }
      attempt++;
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[sheets] 429 on ${entity}:${operation} — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
      if (attempt >= MAX_RETRIES) {
        throw new QuotaExceededError(entity, operation);
      }
    }
  }
}
