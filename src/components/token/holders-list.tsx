import { CopyButton } from "@/components/tokens/copy-button";
import { formatCompact, formatPercent, shortAddress } from "@/lib/format";
import type { Holder } from "@/lib/holders";
import { SectionEmpty, SectionSkeleton } from "./section-card";

type Props = {
  data: Holder[] | null;
  loading: boolean;
  error: string | null;
  symbol: string;
};

export function HoldersList({ data, loading, error, symbol }: Props) {
  return (
    <>
      {error ? (
        <SectionEmpty>Couldn't load holders — {error}</SectionEmpty>
      ) : loading && !data ? (
        <SectionSkeleton rows={8} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty>No holders found yet.</SectionEmpty>
      ) : (
        <ol className="flex flex-col p-2">
          {data.map((h) => (
            <li
              key={h.tokenAccount}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-primary/5"
            >
              <span className="w-7 shrink-0 font-mono text-xs text-subtle-foreground">
                #{h.rank}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2" title={h.owner}>
                <span className="truncate font-mono text-xs text-foreground/90">{shortAddress(h.owner, 4, 4)}</span>
                {h.label && (
                  <span className="shrink-0 rounded-full bg-tide/10 px-1.5 py-px text-[10px] font-medium text-tide">
                    {h.label}
                  </span>
                )}
              </span>
              <CopyButton value={h.owner} label="Copy wallet" />
              <div className="w-32 shrink-0 text-right">
                <p className="font-medium tabular-nums">
                  {formatCompact(h.amount)}{" "}
                  <span className="text-[10px] text-subtle-foreground">{symbol}</span>
                </p>
                <p className="text-[11px] text-subtle-foreground tabular-nums">
                  {formatPercent(h.percent)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
