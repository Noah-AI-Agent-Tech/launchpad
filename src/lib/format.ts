const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatUsd(n: number | undefined | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n > 0 && n < 0.01) return "<$0.01";
  return usd.format(n);
}

/** Compact relative age: 12s, 45m, 16h, 3d. */
export function timeAgo(ms: number, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function shortAddress(addr: string, head = 4, tail = 4) {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

/** Plain compact number: 66.4M, 4.55K, 13.19. */
export function formatCompact(n: number | undefined | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n !== 0 && Math.abs(n) < 0.01) return n.toPrecision(2);
  return compact.format(n);
}

export function formatPercent(n: number, digits = 2) {
  return `${n.toFixed(digits)}%`;
}
