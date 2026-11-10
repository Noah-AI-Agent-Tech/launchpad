import { CopyButton } from "@/components/tokens/copy-button";
import { formatCompact, shortAddress, timeAgo } from "@/lib/format";
import type { Trade } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { SectionEmpty, SectionSkeleton } from "./section-card";

type Props = {
  data: Trade[] | null;
  loading: boolean;
  error: string | null;
  symbol: string;
  quoteSymbol: string;
};

const th = "px-4 py-2.5 text-left text-[11px] font-medium tracking-wide text-subtle-foreground uppercase";
const td = "px-4 py-3 text-sm";

export function TradesTable({ data, loading, error, symbol, quoteSymbol }: Props) {
  return (
    <>
      {error ? (
        <SectionEmpty>Couldn't load trades — {error}</SectionEmpty>
      ) : loading && !data ? (
        <SectionSkeleton rows={6} />
      ) : !data || data.length === 0 ? (
        <SectionEmpty>No trades yet.</SectionEmpty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="border-b border-primary/10">
              <tr>
                <th className={th}>Account</th>
                <th className={th}>Type</th>
                <th className={cn(th, "text-right")}>{symbol}</th>
                <th className={cn(th, "text-right")}>{quoteSymbol}</th>
                <th className={cn(th, "text-right")}>Time</th>
                <th className={cn(th, "text-right")}>Tx</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr
                  key={t.txid}
                  className="border-b border-primary/5 transition-colors last:border-0 hover:bg-primary/5"
                >
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <span title={t.owner}>{shortAddress(t.owner, 4, 4)}</span>
                      <CopyButton value={t.owner} label="Copy wallet" />
                    </span>
                  </td>
                  <td className={td}>
                    <span
                      className={cn(
                        "text-xs font-semibold tracking-wide uppercase",
                        t.side === "buy" ? "text-success" : "text-destructive",
                      )}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className={cn(td, "text-right font-medium tabular-nums")}>
                    {formatCompact(t.amountA)}
                  </td>
                  <td className={cn(td, "text-right text-muted-foreground tabular-nums")}>
                    {formatCompact(t.amountB)}
                  </td>
                  <td className={cn(td, "text-right text-muted-foreground")}>
                    {timeAgo(t.blockTime * 1000)} ago
                  </td>
                  <td className={cn(td, "text-right")}>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-subtle-foreground" title={t.txid}>
                      {shortAddress(t.txid, 4, 4)}
                      <CopyButton value={t.txid} label="Copy transaction signature" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
