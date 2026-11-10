/**
 * OHLCV candles for the token page chart, generated from the demo store: a
 * random walk from the token's opening price to its current one, the same on
 * every load.
 */

import { chartBasis, SUPPLY } from "@/mocks/store";
import { gaussian, rng, wait } from "@/mocks/rng";

export type ChartInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type ChartType = "price" | "mcap";

export const CHART_INTERVALS: { key: ChartInterval; label: string; seconds: number }[] = [
  { key: "1m", label: "1m", seconds: 60 },
  { key: "5m", label: "5m", seconds: 300 },
  { key: "15m", label: "15m", seconds: 900 },
  { key: "1h", label: "1h", seconds: 3600 },
  { key: "4h", label: "4h", seconds: 14_400 },
  { key: "1d", label: "1D", seconds: 86_400 },
];

export type Candle = {
  /** seconds epoch, bucket open */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** USD */
  volume: number;
};

export async function fetchCandles(
  mint: string,
  interval: ChartInterval,
  type: ChartType,
  signal?: AbortSignal,
  maxCandles = 500,
): Promise<Candle[]> {
  await wait(350, signal);
  const basis = chartBasis(mint);
  if (!basis) return [];

  const step = CHART_INTERVALS.find((i) => i.key === interval)?.seconds ?? 900;
  const now = Math.floor(Date.now() / 1000);
  const born = Math.floor(basis.createAt / 1000);
  const last = Math.floor(now / step) * step;
  const first = Math.max(Math.floor(born / step) * step, last - (maxCandles - 1) * step);
  const count = (last - first) / step + 1;

  // Log-price path pinned to the opening price at launch and today's price at
  // the last candle (a Brownian bridge), so the chart agrees with the market cap.
  const rand = rng(`candles:${mint}:${interval}`);
  const lifetime = Math.max(1, now - born);
  const logOpen = Math.log(basis.openPrice);
  const logNow = Math.log(basis.price);
  const at = (t: number) => logOpen + (logNow - logOpen) * Math.min(1, Math.max(0, (t - born) / lifetime));

  const vol = 0.06 * Math.sqrt(step / 900);
  const walk: number[] = [0];
  for (let i = 1; i < count; i++) walk.push(walk[i - 1] + vol * gaussian(rand));
  const drift = walk[count - 1];

  const scale = (type === "mcap" ? SUPPLY : 1) * basis.quoteUsd;
  const avgVolume = (basis.volumeU / 86_400) * step;
  const closes = walk.map((w, i) => {
    const t = first + i * step;
    const bridge = count > 1 ? w - (drift * i) / (count - 1) : 0;
    // Anchor the very first candle at the opening price when it holds the launch.
    const noise = i === 0 && first <= born ? 0 : bridge;
    return Math.exp(at(Math.min(now, t + step)) + noise) * scale;
  });
  closes[count - 1] = basis.price * scale;

  const candles: Candle[] = [];
  let prev = first <= born ? basis.openPrice * scale : closes[0] * Math.exp(vol * gaussian(rand) * 0.5);
  for (let i = 0; i < count; i++) {
    const open = prev;
    const close = closes[i];
    const wick = Math.abs(gaussian(rand)) * vol * 0.6;
    candles.push({
      time: first + i * step,
      open,
      close,
      high: Math.max(open, close) * (1 + wick),
      low: Math.min(open, close) * (1 - wick * 0.8),
      volume: avgVolume * Math.exp(gaussian(rand) * 0.7) * (1 + Math.abs(close - open) / Math.max(open, 1e-18)),
    });
    prev = close;
  }
  return candles;
}
