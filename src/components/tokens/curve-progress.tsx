import { NoahMark } from "@/components/icons/noah-mark";
import { cn } from "@/lib/utils";

const SEGMENTS = 16;

/** Color tier for a bonding-curve percentage. Warms up as it fills. */
export function progressTier(pct: number) {
  if (pct >= 100)
    return { label: "Graduated", color: "var(--success)", text: "text-success" };
  if (pct >= 66)
    return { label: "Heating up", color: "var(--color-sunset)", text: "text-sunset" };
  if (pct >= 33)
    return { label: "Rising", color: "var(--color-sand)", text: "text-sand" };
  return { label: "Early", color: "var(--color-tide)", text: "text-tide" };
}

type Props = {
  /** 0–100 */
  value: number;
  className?: string;
};

/**
 * Stepped bonding-curve bar. Filled steps take the tier color and the Noah
 * mark rides the leading edge, like a boat on the wave.
 */
export function CurveProgress({ value, className }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const tier = progressTier(pct);
  const filled = Math.round((pct / 100) * SEGMENTS);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`Bonding curve ${tier.label.toLowerCase()}`}
        className="relative flex-1 py-2"
      >
        <div className="flex h-1.5 gap-[3px]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className="flex-1 rounded-full bg-foreground/10 transition-colors duration-300"
              style={
                i < filled
                  ? { background: tier.color, opacity: 0.55 + (0.45 * (i + 1)) / filled }
                  : undefined
              }
            />
          ))}
        </div>
        {/* Positioned with calc() rather than translate: WebKit mis-composites
            transformed children beneath backdrop-filter layers. */}
        <NoahMark
          className="absolute size-[18px] rounded-[5px] ring-2 ring-background transition-[left] duration-500"
          style={{
            left: `calc(${pct}% - 9px)`,
            top: "calc(50% - 9px)",
            boxShadow: `0 0 12px 1px ${tier.color}`,
          }}
        />
      </div>
      <span
        className={cn("w-11 shrink-0 text-right font-mono text-xs tabular-nums", tier.text)}
      >
        {pct >= 100 ? "100%" : `${pct.toFixed(pct < 10 ? 1 : 0)}%`}
      </span>
    </div>
  );
}
