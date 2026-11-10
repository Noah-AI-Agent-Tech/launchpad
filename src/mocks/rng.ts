/**
 * Deterministic randomness for the demo data, so every visit sees the same
 * tokens, trades and charts.
 */

/** 32-bit string hash (FNV-1a). */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32): returns floats in [0, 1). */
export function rng(seed: number | string) {
  let a = typeof seed === "string" ? hash(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample from a uniform source (Box–Muller). */
export function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** A Solana-looking base58 string. Not a real key — demo data only. */
export function fakeAddress(rand: () => number = Math.random, suffix = "", length = 44) {
  let s = "";
  for (let i = 0; i < length - suffix.length; i++) s += BASE58[Math.floor(rand() * BASE58.length)];
  return s + suffix;
}

/** A transaction-signature-looking string (88 chars). */
export const fakeSignature = (rand: () => number = Math.random) => fakeAddress(rand, "", 88);

/** Resolves after `ms`, or rejects when `signal` aborts. Stands in for network latency. */
export function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
