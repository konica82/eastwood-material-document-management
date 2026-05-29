/**
 * Tests for cache behaviour and retry logic.
 */

vi.mock('googleapis', () => ({}));

import { cache, TTL, cacheKey, listCacheKey } from "../../../cache";
import { withRetry, SheetsError, QuotaExceededError } from "../../../sheets-client";

// ─── Cache ────────────────────────────────────────────────────────────────────

describe("cache", () => {
  beforeEach(() => cache.invalidate("*"));

  it("returns null for a missing key", () => {
    expect(cache.get("missing-key")).toBeNull();
  });

  it("returns a value within TTL", () => {
    cache.set("k1", { x: 1 }, 60);
    expect(cache.get("k1")).toEqual({ x: 1 });
  });

  it("returns null after TTL expires", async () => {
    cache.set("k2", "hello", 0.001); // 1 ms TTL
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get("k2")).toBeNull();
  });

  it("invalidates matching keys with glob pattern", () => {
    cache.set("cargo:NMQM:abc", "a", 60);
    cache.set("cargo:NMQM:def", "b", 60);
    cache.set("material:NMQM:ghi", "c", 60);
    cache.invalidate("cargo:NMQM:*");
    expect(cache.get("cargo:NMQM:abc")).toBeNull();
    expect(cache.get("cargo:NMQM:def")).toBeNull();
    expect(cache.get("material:NMQM:ghi")).toEqual("c");
  });

  it("second call returns cached value (skips fetch)", async () => {
    let calls = 0;
    const key = cacheKey("material", "NMQM", "mat-01");

    async function fetchMaterial() {
      const cached = cache.get(key);
      if (cached) return cached;
      calls++;
      const value = { id: "mat-01", ten: "Keo lai" };
      cache.set(key, value, TTL.REFERENCE);
      return value;
    }

    await fetchMaterial();
    await fetchMaterial();
    expect(calls).toBe(1); // only fetched once
  });
});

// ─── Retry logic ──────────────────────────────────────────────────────────────

describe("withRetry", () => {
  it("resolves immediately on success", async () => {
    const result = await withRetry(() => Promise.resolve("ok"), "test", "op");
    expect(result).toBe("ok");
  });

  it("retries on 429 and eventually succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 3) {
          const err: { response: { status: number }; message: string } = {
            response: { status: 429 },
            message: "Too Many Requests",
          };
          return Promise.reject(err);
        }
        return Promise.resolve("success");
      },
      "test",
      "op",
    );
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  }, 15_000);

  it("throws QuotaExceededError after max retries", async () => {
    const err = { response: { status: 429 }, message: "Too Many Requests" };
    await expect(
      withRetry(() => Promise.reject(err), "test", "op"),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  }, 15_000);

  it("throws SheetsError immediately for non-429 errors", async () => {
    const err = { response: { status: 404 }, message: "Not found" };
    await expect(
      withRetry(() => Promise.reject(err), "test", "op"),
    ).rejects.toBeInstanceOf(SheetsError);
  });

  it("attaches status code to SheetsError", async () => {
    const err = { response: { status: 403 }, message: "Forbidden" };
    try {
      await withRetry(() => Promise.reject(err), "test", "op");
    } catch (e) {
      expect(e).toBeInstanceOf(SheetsError);
      expect((e as SheetsError).statusCode).toBe(403);
    }
  });
});
