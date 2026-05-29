/**
 * Shared display formatters.
 *
 * All functions are pure — no side effects, no imports from Next.js or React.
 * They format values for Vietnamese UI display.
 */

/**
 * Parse a date string in either ISO format or AppSheet's dd/MM/yyyy HH:mm:ss format.
 * Returns a valid Date or null.
 */
function parseDate(value: string): Date | null {
  // AppSheet format: "21/03/2025 13:55:51"
  const appSheet = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (appSheet) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = appSheet;
    const d = new Date(+yyyy, +mm - 1, +dd, +hh, +min, +ss);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Format an ISO timestamp as "dd/MM/yyyy". */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseDate(iso);
    if (!d) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '—';
  }
}

/** Format an ISO timestamp as "HH:mm". */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseDate(iso);
    if (!d) return '—';
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  } catch {
    return '—';
  }
}

/** Format an ISO timestamp as "dd/MM/yyyy HH:mm". */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

/**
 * Format a weight value in kg.
 * - Under 1000 kg: "850 kg"
 * - 1000+ kg: "12.540 kg" (Vietnamese thousands separator = period)
 */
export function fmtWeight(kg: number | null | undefined): string {
  if (kg == null) return '—';
  return kg.toLocaleString('vi-VN') + ' kg';
}

/**
 * Format a duration in milliseconds as a human-readable string.
 * e.g. 3 720 000 ms → "1 giờ 2 phút"
 */
export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes === 0) return 'Dưới 1 phút';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

/** Format a distance in km, e.g. 12.5 → "12,5 km". */
export function fmtKm(km: number | null | undefined): string {
  if (km == null) return '—';
  return km.toLocaleString('vi-VN') + ' km';
}
