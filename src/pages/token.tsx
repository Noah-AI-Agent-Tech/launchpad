import { Globe, GraduationCap, Send } from "lucide-react";
import { useParams } from "react-router";
import { BackLink } from "@/components/layout/back-link";
import { XLogo } from "@/components/icons/x-logo";
import { ActivityCard } from "@/components/token/activity-card";
import { AddressRow } from "@/components/token/address-row";
import { TradeCard } from "@/components/token/trade-card";
import { BondingCurveCard } from "@/components/token/bonding-curve-card";
import { PriceChart } from "@/components/token/price-chart";
import { cardClass, SectionCard, SectionSkeleton } from "@/components/token/section-card";
import { CopyButton } from "@/components/tokens/copy-button";
import { TokenAvatar } from "@/components/tokens/token-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { useStoreVersion } from "@/hooks/use-store-version";
import { formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { fetchTokensByMints, isGraduated, isMintAddress, type LaunchToken } from "@/lib/tokens";

const socialLink =
  "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground";

export function TokenPage() {
  const { mint = "" } = useParams();
  const valid = isMintAddress(mint);
  // Refetch after a trade so the market cap and curve move with it.
  const version = useStoreVersion();

  const { data, loading, error } = useAsync(async (signal) => {
    if (!valid) return null;
    const rows = await fetchTokensByMints([mint], signal);
    return rows[0] ?? null;
  }, `token:${mint}:${version}`);

  // Keep showing the token while it refetches; only the first load shows a skeleton.
  const token = data?.mint === mint ? data : null;
  const missing = valid && !error && !loading && !data;

  return (
    <main className="mx-auto w-full flex-1 px-4 pt-24 pb-16 lg:px-6 xl:max-w-7xl">
      <BackLink />

      {!valid || error || missing ? (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {!valid
              ? "That doesn't look like a token address."
              : error
                ? `Couldn't load token — ${error}`
                : "No token found for this address."}
          </p>
        </div>
      ) : !token ? (
        <TokenSkeleton />
      ) : (
        <TokenDetail token={token} />
      )}
    </main>
  );
}

function TokenDetail({ token }: { token: LaunchToken }) {
  const graduated = isGraduated(token);
  const quote = token.mintB;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Identity */}
      <header className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-4">
          <TokenAvatar
            src={token.imgUrl}
           
            name={token.name}
            className="size-16 rounded-2xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {token.name}
              </h1>
              <span className="text-lg text-tide">${token.symbol}</span>
              {graduated ? (
                <Badge className="h-[18px] gap-1 bg-success/15 px-1.5 text-[10px] tracking-wide text-success uppercase">
                  <GraduationCap className="size-3" /> Graduated
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="h-[18px] border-tide/30 px-1.5 text-[10px] tracking-wide text-tide uppercase"
                >
                  On curve
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Paired with</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                {quote.logoURI && (
                  <img
                    src={quote.logoURI}
                    alt=""
                    className="size-4 rounded-full"
                  />
                )}
                {quote.symbol}
              </span>
              {token.platformInfo?.name && (
                <Badge
                  variant="outline"
                  className="h-[18px] border-primary/15 px-1.5 text-[10px] tracking-wide uppercase"
                >
                  {token.platformInfo.name}
                </Badge>
              )}
              <span className="text-subtle-foreground">·</span>
              <span>created {timeAgo(token.createAt)} ago</span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/10 bg-surface px-2 py-0.5 font-mono text-xs text-foreground/90">
                CA {shortAddress(token.mint, 6, 6)}
                <CopyButton value={token.mint} label="Copy contract address" />
              </span>
            </div>
            {token.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {token.description}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
            <div className="flex items-center gap-1.5">
              {token.twitter && (
                <a
                  href={token.twitter}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className={socialLink}
                >
                  <XLogo className="size-3.5" />
                </a>
              )}
              {token.telegram && (
                <a
                  href={token.telegram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                  className={socialLink}
                >
                  <Send className="size-4" />
                </a>
              )}
              {token.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Website"
                  className={socialLink}
                >
                  <Globe className="size-4" />
                </a>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-subtle-foreground">Market cap</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatUsd(token.marketCap)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: chart, buy/sell, bonding curve, addresses, then trades/holders.
          Desktop: chart + activity left, info cards right. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:items-start">
        <PriceChart mint={token.mint} symbol={token.symbol} className="min-w-0 lg:col-start-1 lg:row-start-1" />

        <aside className="contents lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <TradeCard token={token} />
          <BondingCurveCard token={token} />
          <SectionCard
            title="Addresses"
            bodyClassName="divide-y divide-primary/10 px-4 py-1"
          >
            <AddressRow label="Token mint" value={token.mint} />
            <AddressRow label="Curve pool" value={token.poolId} />
            {token.migrateAmmId && <AddressRow label="AMM pool" value={token.migrateAmmId} />}
            <AddressRow label={`Quote mint (${quote.symbol})`} value={quote.address} />
            <AddressRow label="Creator" value={token.creator} />
          </SectionCard>
        </aside>

        <ActivityCard token={token} className="min-w-0 lg:col-start-1 lg:row-start-2" />
      </div>
    </div>
  );
}

function TokenSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-4">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2.5 pt-1">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-3.5 w-72" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-1 border-b border-primary/10 px-3 py-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-9" />
              ))}
            </div>
            <div className="flex h-[420px] items-end gap-1 p-4 sm:h-[480px]">
              {Array.from({ length: 40 }, (_, i) => (
                <Skeleton
                  key={i}
                  className="w-full"
                  style={{ height: `${20 + ((i * 37) % 60)}%` }}
                />
              ))}
            </div>
          </div>
          <div className={cardClass}>
            <div className="flex h-12 items-center gap-2 border-b border-primary/10 px-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <SectionSkeleton rows={6} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className={cardClass}>
            <div className="flex h-12 items-center border-b border-primary/10 px-4">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-col gap-4 p-4">
              <Skeleton className="h-1.5 w-full rounded-full" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className={cardClass}>
            <div className="flex h-12 items-center border-b border-primary/10 px-4">
              <Skeleton className="h-4 w-20" />
            </div>
            <SectionSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
