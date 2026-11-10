import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { useStoreVersion } from "@/hooks/use-store-version";
import { fetchTopHolders } from "@/lib/holders";
import { fetchTrades, type LaunchToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { HoldersList } from "./holders-list";
import { cardClass } from "./section-card";
import { TradesTable } from "./trades-table";

type Tab = "trades" | "holders";

/** Trades and top holders in one panel, switched by tabs. Refreshes after your own trades. */
export function ActivityCard({ token, className }: { token: LaunchToken; className?: string }) {
  const [tab, setTab] = useState<Tab>("trades");
  const version = useStoreVersion();

  const trades = useAsync(
    (signal) => fetchTrades(token.poolId, 50, signal),
    `trades:${token.poolId}:${version}`,
  );
  const holders = useAsync(
    (signal) => fetchTopHolders(token.mint, signal),
    `holders:${token.mint}:${version}`,
  );
  const active = tab === "trades" ? trades : holders;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "trades", label: "Trades", count: trades.data?.length },
    { key: "holders", label: "Top holders", count: holders.data?.length },
  ];

  return (
    <section className={cn(cardClass, className)}>
      <header className="flex h-12 items-center gap-1 border-b border-primary/10 px-2">
        <div role="tablist" aria-label="Activity" className="flex items-center gap-1">
          {tabs.map((t) => {
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`activity-${t.key}`}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
                  selected
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.count != null && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-mono text-[10px] tabular-nums",
                      selected ? "bg-tide/15 text-tide" : "bg-primary/5 text-subtle-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          className="ml-auto"
          onClick={active.refresh}
          disabled={active.loading}
        >
          <RefreshCw className={cn("size-3.5", active.loading && "animate-spin")} />
        </Button>
      </header>

      <div id={`activity-${tab}`} role="tabpanel">
        {tab === "trades" ? (
          <TradesTable
            data={trades.data}
            loading={trades.loading}
            error={trades.error}
            symbol={token.symbol}
            quoteSymbol={token.mintB.symbol}
          />
        ) : (
          <HoldersList
            data={holders.data}
            loading={holders.loading}
            error={holders.error}
            symbol={token.symbol}
          />
        )}
      </div>
    </section>
  );
}
