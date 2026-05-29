/**
 * Shared helpers for Route Handlers.
 */

import { NextResponse } from "next/server";
import { SheetsError, QuotaExceededError } from "./sheets-client";

// ─── Role guards ──────────────────────────────────────────────────────────────

export type RoleLevel = 'User' | 'Manager' | 'Admin';

const ROLE_ORDER: Record<RoleLevel, number> = { User: 1, Manager: 2, Admin: 3 };

export function meetsRole(userRole: RoleLevel, required: RoleLevel): boolean {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[required];
}

export function unauthorizedError() {
  return apiError('UNAUTHORIZED', 'Chưa đăng nhập.', 401);
}

export function forbiddenError() {
  return apiError('FORBIDDEN', 'Không đủ quyền thực hiện thao tác này.', 403);
}

export function validationError(message: string) {
  return apiError('VALIDATION_ERROR', message, 400);
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ data: null, error: { code, message, retryable } }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof QuotaExceededError) {
    return apiError("RATE_LIMITED", "Hệ thống đang bận, vui lòng thử lại sau.", 503, true);
  }
  if (err instanceof SheetsError) {
    if (err.statusCode === 404) return apiError("NOT_FOUND", "Không tìm thấy dữ liệu.", 404);
    if (err.statusCode === 403) return apiError("FORBIDDEN", "Không có quyền truy cập.", 403);
    return apiError("SHEETS_ERROR", err.message, 502, true);
  }
  if (err instanceof Error) {
    if (err.message.includes("not found") || err.message.includes("Not found")) {
      return apiError("NOT_FOUND", err.message, 404);
    }
    return apiError("INTERNAL_ERROR", err.message, 500);
  }
  return apiError("INTERNAL_ERROR", "Lỗi không xác định.", 500);
}
