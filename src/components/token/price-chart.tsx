import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  type AutoscaleInfo,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { useStoreVersion } from "@/hooks/use-store-version";
import { formatUsd } from "@/lib/format";
import {
  CHART_INTERVALS,
  fetchCandles,
  type Candle,
  type ChartInterval,
  type ChartType,
} from "@/lib/chart";
import { cn } from "@/lib/utils";
import { cardClass } from "./section-card";

// Theme colors as plain hex/rgba — the chart draws to canvas, so CSS vars
// can't be used directly. Values mirror index.css.
const UP = "#4ade80";
const DOWN = "#f26d6d";
const TEXT = "rgba(255,255,255,0.5)";
const GRID = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.1)";
const CROSSHAIR = "#94EDFF";

/** Tiny prices need many decimals; market caps read better compact. */
function makeFormatter(type: ChartType) {
  // Ticks below zero only occur in the volume margin; leave them unlabelled.
  if (type === "mcap") return (p: number) => (p < 0 ? "" : formatUsd(p));
  return (p: number) => {
    if (p < 0) return "";
    if (p < 1e-12) return "$0";
    if (p >= 1) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
    // Fixed decimals (4 significant digits), never exponent notation.
    const decimals = Math.min(12, Math.max(2, -Math.floor(Math.log10(p)) + 3));
    return `$${p.toFixed(decimals)}`;
  };
}

/** Smallest price step so the scale doesn't collapse for sub-cent prices. */
function minMoveFor(candles: Candle[]) {
  const min = Math.min(...candles.map((c) => c.low).filter((v) => v > 0));
  if (!Number.isFinite(min)) return 0.01;
  return 10 ** (Math.floor(Math.log10(min)) - 3);
}

type Props = {
  mint: string;
  symbol: string;
  className?: string;
};

/**
 * Candlestick + volume chart drawn with TradingView Lightweight Charts, fed by
 * demo candles. Reloads per interval/type and after your own trades.
 */
export function PriceChart({ mint, symbol, className }: Props) {
  const [interval, setInterval] = useState<ChartInterval>("15m");
  const [type, setType] = useState<ChartType>("price");
  const version = useStoreVersion();

  const { data, loading, error, refresh } = useAsync(
    (signal) => fetchCandles(mint, interval, type, signal),
    `candles:${mint}:${interval}:${type}:${version}`,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  /** Candles by bucket time, for the crosshair legend. */
  const byTimeRef = useRef<Map<number, Candle>>(new Map());
  const [hovered, setHovered] = useState<Candle | null>(null);

  // Create the chart once per mount; size follows the container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: TEXT,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: true,
      },
      grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
      rightPriceScale: { borderColor: BORDER, scaleMargins: { top: 0.14, bottom: 0.22 } },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: CROSSHAIR, width: 1, style: 3, labelBackgroundColor: "#1a1a1a" },
        horzLine: { color: CROSSHAIR, width: 1, style: 3, labelBackgroundColor: "#1a1a1a" },
      },
      handleScale: { axisPressedMouseMove: true },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
      // Prices/market caps never go negative; don't let the axis either.
      autoscaleInfoProvider: (original: () => AutoscaleInfo | null) => {
        const info = original();
        if (info?.priceRange && info.priceRange.minValue < 0) {
          info.priceRange = { ...info.priceRange, minValue: 0 };
        }
        return info;
      },
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      const t = typeof param.time === "number" ? param.time : null;
      setHovered(t != null ? (byTimeRef.current.get(t) ?? null) : null);
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // Push data whenever it changes.
  useEffect(() => {
    const candles = candleRef.current;
    const volume = volumeRef.current;
    const chart = chartRef.current;
    if (!candles || !volume || !chart || !data) return;

    byTimeRef.current = new Map(data.map((c) => [c.time, c]));
    candles.applyOptions({
      priceFormat: {
        type: "custom",
        formatter: makeFormatter(type),
        minMove: type === "mcap" ? 1 : minMoveFor(data),
      },
    });
    candles.setData(
      data.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volume.setData(
      data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(74,222,128,0.35)" : "rgba(242,109,109,0.35)",
      })),
    );
    chart.timeScale().fitContent();
  }, [data, type]);

  // Legend shows the hovered candle, or the latest one when idle.
  const legend = hovered ?? data?.[data.length - 1] ?? null;
  const change = legend && legend.open > 0 ? ((legend.close - legend.open) / legend.open) * 100 : null;
  const fmt = makeFormatter(type);
  const intervalLabel = CHART_INTERVALS.find((i) => i.key === interval)?.label ?? interval;

  return (
    <section className={cn(cardClass, "overflow-hidden", className)}>
      <header className="flex flex-wrap items-center gap-2 border-b border-primary/10 px-3 py-2">
        <div role="radiogroup" aria-label="Interval" className="flex items-center gap-0.5">
          {CHART_INTERVALS.map((i) => (
            <button
              key={i.key}
              type="button"
              role="radio"
              aria-checked={interval === i.key}
              onClick={() => setInterval(i.key)}
              className={cn(
                "h-7 rounded-md px-2 font-mono text-xs transition-colors",
                interval === i.key
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>

        <span className="mx-1 h-4 w-px bg-primary/10" />

        <div role="radiogroup" aria-label="Chart type" className="flex items-center gap-0.5">
          {(["price", "mcap"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setType(t)}
              className={cn(
                "h-7 rounded-md px-2 text-xs font-medium transition-colors",
                type === t ? "bg-tide/15 text-tide" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "price" ? "Price" : "Market cap"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh chart"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="relative h-[420px] sm:h-[480px]">
        <div ref={containerRef} className="absolute inset-0" />

        {legend && (
          <div className="pointer-events-none absolute top-2 left-3 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums">
            <span className="font-sans font-semibold text-foreground">
              {symbol} · {intervalLabel}
            </span>
            <Ohlc label="O" value={fmt(legend.open)} />
            <Ohlc label="H" value={fmt(legend.high)} />
            <Ohlc label="L" value={fmt(legend.low)} />
            <Ohlc label="C" value={fmt(legend.close)} />
            {change != null && (
              <span className={change >= 0 ? "text-success" : "text-destructive"}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            )}
            <span className="text-muted-foreground">
              Vol <span className="text-foreground/80">{formatUsd(legend.volume)}</span>
            </span>
          </div>
        )}

        {(error || (data && data.length === 0)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/40 text-sm text-muted-foreground">
            {error ? `Couldn't load chart — ${error}` : `No ${symbol} trades yet.`}
          </div>
        )}
        {loading && !data && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        )}
      </div>
    </section>
  );
}

function Ohlc({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-subtle-foreground">{label} </span>
      <span className="text-foreground/80">{value}</span>
    </span>
  );
}
