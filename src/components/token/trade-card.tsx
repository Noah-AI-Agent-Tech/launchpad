import { useState } from "react";
import { ChevronDown, Loader2, RefreshCw, Settings2, Wallet } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { TokenAvatar } from "@/components/tokens/token-avatar";
import { Button } from "@/components/ui/button";
import { useTrade, type TradeAsset } from "@/hooks/use-trade";
import type { LaunchToken } from "@/lib/tokens";
import { fromRaw, rawToInput, SOL_FEE_RESERVE, WSOL_MINT } from "@/lib/trade";
import { useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";
import { cardClass } from "./section-card";

const SLIPPAGES = [50, 100, 300, 500];

const fmt = (n: number, max = 6) =>
  !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 2 : n >= 1 ? 4 : max });

/** Buy with SOL, USDC or USDT; sell what you hold. */
export function TradeCard({ token, className }: { token: LaunchToken; className?: string }) {
  const t = useTrade(token);
  const { account, setDialogOpen } = useWallet();
  const connected = Boolean(account);

  const buying = t.side === "buy";
  const bal = t.inputBalance;
  const heldBase = t.balanceOf(t.base.mint);
  const holdsNothing = !buying && t.holdings !== null && (heldBase?.raw ?? 0n) === 0n;

  const setFraction = (f: number) => {
    if (!bal) return;
    let raw = (bal.raw * BigInt(Math.round(f * 100))) / 100n;
    // Leave SOL for fees and any token account the swap has to open.
    if (t.input.mint === WSOL_MINT && f === 1) {
      const reserve = BigInt(Math.round(SOL_FEE_RESERVE * 1e9));
      raw = raw > reserve ? raw - reserve : 0n;
    }
    t.setAmount(rawToInput(raw, bal.decimals));
  };

  const q = t.quote?.data;
  const impact = q?.priceImpactPct ?? 0;
  const route = q ? routeLabel(q.routePlan, [t.base, ...t.counterAssets], token.mintB.symbol) : null;

  return (
    <section className={cn(cardClass, "p-4", className)}>
      {/* Buy / Sell */}
      <div className="grid grid-cols-2 rounded-xl bg-black/25 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => t.setSide(s)}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold capitalize transition-colors",
              t.side === s
                ? s === "buy"
                  ? "bg-success text-jet"
                  : "bg-destructive text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{buying ? "You pay" : "You sell"}</span>
        <div className="flex items-center gap-2">
          {connected && (
            <button
              type="button"
              onClick={() => bal && t.setAmount(rawToInput(bal.raw, bal.decimals))}
              className="flex items-center gap-1 text-subtle-foreground hover:text-foreground"
              title="Use full balance"
            >
              <Wallet className="size-3" />
              {t.holdings === null ? "…" : fmt(bal?.ui ?? 0)} {t.input.symbol}
            </button>
          )}
          <SlippageButton value={t.slippageBps} onChange={t.setSlippageBps} />
        </div>
      </div>

      <div
        className={cn(
          "mt-1.5 flex items-center gap-2 rounded-xl border bg-black/25 py-1.5 pr-1.5 pl-3 transition-colors focus-within:border-white/25",
          t.insufficient ? "border-destructive/50" : "border-white/10",
        )}
      >
        <input
          value={t.amount}
          onChange={(e) => t.setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
          inputMode="decimal"
          placeholder="0.0"
          aria-label={buying ? "Amount to pay" : "Amount to sell"}
          disabled={holdsNothing}
          className="h-10 min-w-0 flex-1 bg-transparent font-mono text-xl text-white outline-none placeholder:text-subtle-foreground disabled:opacity-50"
        />
        {buying ? (
          <AssetPicker value={t.counter} options={t.payOptions} onChange={(m) => t.setCounterMint(m)} balanceOf={t.balanceOf} />
        ) : (
          <AssetChip asset={t.base} />
        )}
      </div>

      {/* Quick amounts */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {buying && t.input.mint === WSOL_MINT
          ? [0.1, 0.5, 1].map((v) => <Chip key={v} onClick={() => t.setAmount(String(v))}>{v} SOL</Chip>)
          : [0.25, 0.5, 0.75].map((f) => (
              <Chip key={f} onClick={() => setFraction(f)} disabled={!bal}>
                {f * 100}%
              </Chip>
            ))}
        <Chip onClick={() => setFraction(1)} disabled={!bal}>
          Max
        </Chip>
      </div>

      {/* Receive side */}
      {!buying && (
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Receive in</span>
          <AssetPicker value={t.counter} options={t.counterAssets} onChange={(m) => t.setCounterMint(m)} balanceOf={t.balanceOf} compact />
        </div>
      )}

      {/* Quote */}
      <dl className="mt-4 space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs">
        <Row k="You receive">
          {t.quoting ? (
            <Loader2 className="size-3.5 animate-spin text-subtle-foreground" />
          ) : q ? (
            <span className="font-mono text-sm font-semibold text-white">
              ≈ {fmt(fromRaw(q.outputAmount, t.output.decimals))} {t.output.symbol}
            </span>
          ) : (
            <span className="text-subtle-foreground">— {t.output.symbol}</span>
          )}
        </Row>
        <Row k="Minimum received">
          <span className="font-mono">{q ? `${fmt(fromRaw(q.otherAmountThreshold, t.output.decimals))} ${t.output.symbol}` : "—"}</span>
        </Row>
        <Row k="Price impact">
          <span className={cn("font-mono", impact >= 5 ? "text-destructive" : impact >= 2 ? "text-warning" : "")}>
            {q ? `${impact.toFixed(2)}%` : "—"}
          </span>
        </Row>
        {route && (
          <Row k="Route">
            <span className="truncate font-mono text-[11px] text-subtle-foreground">{route}</span>
          </Row>
        )}
      </dl>

      {/* Action */}
      {!connected ? (
        <Button className="mt-4 w-full" size="lg" onClick={() => setDialogOpen(true)}>
          <Wallet className="size-4" /> Connect wallet
        </Button>
      ) : (
        <Button
          className={cn(
            "mt-4 w-full",
            buying ? "bg-success text-jet hover:bg-success/90" : "bg-destructive text-white hover:bg-destructive/90",
          )}
          size="lg"
          disabled={t.busy || holdsNothing || t.insufficient || !q || t.quoting}
          onClick={() => void t.execute()}
        >
          {t.busy && <Loader2 className="size-4 animate-spin" />}
          {t.stage === "preparing"
            ? "Preparing…"
            : t.stage === "signing"
              ? "Signing…"
              : t.stage === "confirming"
                ? "Confirming…"
                : holdsNothing
                  ? `You don't hold ${t.base.symbol}`
                  : t.insufficient
                    ? `Not enough ${t.input.symbol}`
                    : `${buying ? "Buy" : "Sell"} ${t.base.symbol}`}
        </Button>
      )}

      {t.quoteError && !t.busy && <p className="mt-2 text-xs text-destructive">{t.quoteError}</p>}
      {connected && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-subtle-foreground">
          <span>
            You hold {t.holdings === null ? "…" : fmt(heldBase?.ui ?? 0)} {t.base.symbol}
          </span>
          <button type="button" onClick={t.refreshHoldings} className="flex items-center gap-1 hover:text-foreground">
            <RefreshCw className="size-3" /> Balances
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="flex min-w-0 justify-end text-right text-foreground/90">{children}</dd>
    </div>
  );
}

function Chip({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function AssetChip({ asset }: { asset: TradeAsset }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white">
      <TokenAvatar src={asset.logo} name={asset.symbol} className="size-5 rounded-full" />
      {asset.symbol}
    </span>
  );
}

/** Token selector: logo + symbol, with each option's wallet balance. */
function AssetPicker({
  value,
  options,
  onChange,
  balanceOf,
  compact,
}: {
  value: TradeAsset;
  options: TradeAsset[];
  onChange: (mint: string) => void;
  balanceOf: (mint: string) => { ui: number } | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 font-medium text-white transition-colors hover:bg-white/15",
          compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
        )}
      >
        <TokenAvatar src={value.logo} name={value.symbol} className={cn("rounded-full", compact ? "size-4" : "size-5")} />
        {value.symbol}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 max-h-72 w-60 overflow-y-auto rounded-xl border border-white/10 bg-charcoal/95 p-1 shadow-xl backdrop-blur-md"
        >
          {options.map((o) => (
            <button
              key={o.mint}
              type="button"
              onClick={() => {
                onChange(o.mint);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/5",
                o.mint === value.mint && "bg-white/5",
              )}
            >
              <TokenAvatar src={o.logo} name={o.symbol} className="size-5 rounded-full" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-white">{o.symbol}</span>
                <span className="block font-mono text-[10px] text-subtle-foreground">
                  {o.mint.slice(0, 4)}…{o.mint.slice(-4)}
                </span>
              </span>
              <span className="ml-auto text-right">
                <span className="block font-mono text-xs text-muted-foreground">{fmt(balanceOf(o.mint)?.ui ?? 0, 4)}</span>
                {o.usdPrice != null && (balanceOf(o.mint)?.ui ?? 0) > 0 && (
                  <span className="block font-mono text-[10px] text-subtle-foreground">
                    ${fmt((balanceOf(o.mint)?.ui ?? 0) * o.usdPrice, 2)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function SlippageButton({ value, onChange }: { value: number; onChange: (bps: number) => void }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-subtle-foreground transition-colors hover:text-foreground">
        <Settings2 className="size-3" /> {value / 100}%
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 rounded-xl border border-white/10 bg-charcoal/95 p-3 shadow-xl backdrop-blur-md"
        >
          <p className="text-xs font-medium text-white">Max slippage</p>
          <p className="mt-0.5 text-[11px] text-subtle-foreground">The trade fails rather than fill worse than this.</p>
          <div className="mt-2 flex gap-1">
            {SLIPPAGES.map((s) => (
              <PopoverPrimitive.Close
                key={s}
                onClick={() => onChange(s)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
                  value === s ? "bg-white text-jet" : "bg-white/5 text-muted-foreground hover:text-white",
                )}
              >
                {s / 100}%
              </PopoverPrimitive.Close>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** "SOL → SPYx → PEPE" from the router's hops, naming mints we know. */
function routeLabel(plan: { inputMint: string; outputMint: string }[], known: TradeAsset[], quoteSymbol: string) {
  if (plan.length === 0) return null;
  const name = (mint: string) => known.find((a) => a.mint === mint)?.symbol ?? (mint === "" ? quoteSymbol : `${mint.slice(0, 4)}…`);
  return [plan[0].inputMint, ...plan.map((p) => p.outputMint)].map(name).join(" → ");
}
