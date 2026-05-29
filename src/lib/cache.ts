/**
 * In-memory TTL cache, namespaced by plantId.
 *
 * Key format:
 *   "{entity}:{plantId}:{id}"           — single record
 *   "{entity}:{plantId}:list:{hash}"    — list query result
 *
 * TODO: replace with Redis adapter for multi-instance deployments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

export const cache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  },

  set<T>(key: string, value: T, ttlSeconds: number): void {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  /** Invalidate all keys matching a glob pattern (only * wildcard supported). */
  invalidate(pattern: string): void {
    const regex = new RegExp(
      "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
    );
    for (const key of store.keys()) {
      if (regex.test(key)) store.delete(key);
    }
  },
};

// ─── TTL constants (seconds) ──────────────────────────────────────────────────

export const TTL = {
  REFERENCE: 300,    // materials, suppliers, plots, drivers
  CARGO_LIST: 30,
  CARGO_DETAIL: 60,
  DASHBOARD: 60,
  USER: 600,
} as const;

// ─── Key builders ─────────────────────────────────────────────────────────────

export function cacheKey(entity: string, plantId: string, id: string): string {
  return `${entity}:${plantId}:${id}`;
}

export function listCacheKey(
  entity: string,
  plantId: string,
  queryHash: string,
): string {
  return `${entity}:${plantId}:list:${queryHash}`;
}

/** Stable hash for a ListQuery object. */
export function hashQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return "all";
  return Buffer.from(JSON.stringify(query)).toString("base64url");
}
