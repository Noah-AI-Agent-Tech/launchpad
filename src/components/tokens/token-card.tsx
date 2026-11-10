import { Globe, GraduationCap, Send } from "lucide-react";
import { Link } from "react-router";
import { XLogo } from "@/components/icons/x-logo";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./copy-button";
import { CurveProgress } from "./curve-progress";
import { TokenAvatar } from "./token-avatar";
import { formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { isGraduated, type LaunchToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type Props = {
  token: LaunchToken;
};

const socialLink =
  "relative z-10 flex size-7 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-primary/5 hover:text-foreground";

export function TokenCard({ token }: Props) {
  const graduated = isGraduated(token);
  const progress = graduated ? 100 : token.finishingRate;

  return (
    <article
      id={`token-${token.mint}`}
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/10 bg-card/55 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-primary/25 focus-within:border-tide/40",
      )}
    >
      {/* Whole card opens the token page; controls below sit above this link. */}
      <Link
        to={`/token/${token.mint}`}
        aria-label={`Open ${token.name}`}
        className="absolute inset-0 z-0 rounded-2xl outline-none"
      />
      {/* Faint watermark of the quote token. */}
      {token.mintB.logoURI && (
        <img
          src={token.mintB.logoURI}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-8 size-36 rounded-full opacity-[0.06] blur-[1px] grayscale transition-opacity duration-300 group-hover:opacity-10"
        />
      )}

      <header className="flex items-start gap-3">
        <TokenAvatar src={token.imgUrl} name={token.name} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-tide">
              ${token.symbol}
            </span>
            <span className="shrink-0 text-xs text-subtle-foreground">
              {timeAgo(token.createAt)}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{token.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {token.twitter && (
            <a href={token.twitter} target="_blank" rel="noreferrer" aria-label="X" className={socialLink}>
              <XLogo className="size-3" />
            </a>
          )}
          {token.telegram && (
            <a href={token.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className={socialLink}>
              <Send className="size-3.5" />
            </a>
          )}
          {token.website && (
            <a href={token.website} target="_blank" rel="noreferrer" aria-label="Website" className={socialLink}>
              <Globe className="size-3.5" />
            </a>
          )}
        </div>
      </header>

      <div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatUsd(token.marketCap)}
        </p>
        <p className="mt-0.5 text-xs text-subtle-foreground">Market cap</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Paired with</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          {token.mintB.logoURI && (
            <img src={token.mintB.logoURI} alt="" className="size-4 rounded-full" loading="lazy" />
          )}
          {token.mintB.symbol}
        </span>
        {token.platformInfo?.name && (
          <Badge variant="outline" className="h-[18px] border-primary/15 px-1.5 text-[10px] tracking-wide uppercase">
            {token.platformInfo.name}
          </Badge>
        )}
        {graduated && (
          <Badge className="h-[18px] gap-1 bg-success/15 px-1.5 text-[10px] tracking-wide text-success uppercase">
            <GraduationCap className="size-3" /> Graduated
          </Badge>
        )}
      </div>

      <CurveProgress value={progress} />

      <footer className="flex items-center justify-between gap-3 text-xs text-subtle-foreground">
        <span>
          Vol <span className="text-muted-foreground tabular-nums">{formatUsd(token.volumeU ?? 0)}</span>
        </span>
        <span className="relative z-10 inline-flex items-center gap-1.5 font-mono">
          {shortAddress(token.mint)}
          <CopyButton value={token.mint} label="Copy contract address" />
        </span>
      </footer>
    </article>
  );
}
