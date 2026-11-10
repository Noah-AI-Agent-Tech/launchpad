import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Flame, Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CopyButton } from "@/components/tokens/copy-button";
import { TokenAvatar } from "@/components/tokens/token-avatar";
import { useRecentSearches, type RecentToken } from "@/hooks/use-recent-searches";
import { formatUsd, shortAddress } from "@/lib/format";
import { fetchTokensByMints, isMintAddress, type LaunchToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currently loaded tokens; searched locally and used for "Trending". */
  tokens: LaunchToken[];
  onSelect: (token: LaunchToken) => void;
};

export function SearchDialog({ open, onOpenChange, tokens, onSelect }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden bg-charcoal p-0 sm:max-w-lg data-open:slide-in-from-top-2"
      >
        <DialogTitle className="sr-only">Search tokens</DialogTitle>
        {/* Content unmounts on close, so the palette's state resets for free. */}
        <SearchPalette
          tokens={tokens}
          onSelect={(t) => {
            onSelect(t);
            onOpenChange(false);
          }}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </DialogPrimitive.Root>
  );
}

type Row = RecentToken | LaunchToken;

type PaletteProps = {
  tokens: LaunchToken[];
  onSelect: (token: LaunchToken) => void;
  onClose: () => void;
};

function SearchPalette({ tokens, onSelect, onClose }: PaletteProps) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<LaunchToken[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState(0);
  const { recent, add } = useRecentSearches();
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const trending = useMemo(
    () => [...tokens].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5),
    [tokens],
  );

  const local = useMemo(() => {
    if (!q) return [];
    return tokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.mint.toLowerCase() === q,
      )
      .slice(0, 20);
  }, [tokens, q]);

  // Fall back to a lookup by mint when the query is an address that isn't in
  // the loaded list.
  const needsRemote = Boolean(q) && local.length === 0 && isMintAddress(query);
  const remoteId = needsRemote ? query.trim() : null;
  useEffect(() => {
    if (!remoteId) return;
    const ctrl = new AbortController();
    setSearching(true);
    fetchTokensByMints([remoteId], ctrl.signal)
      .then((rows) => setRemote(rows))
      .catch(() => setRemote([]))
      .finally(() => {
        if (!ctrl.signal.aborted) setSearching(false);
      });
    return () => ctrl.abort();
  }, [remoteId]);

  const results: LaunchToken[] =
    local.length > 0 ? local : needsRemote ? (remote ?? []) : [];
  const rows: Row[] = q ? results : [...recent, ...trending];
  const active = rows.length ? Math.min(cursor, rows.length - 1) : 0;

  const choose = (row: Row) => {
    const full = "poolId" in row ? row : tokens.find((t) => t.mint === row.mint);
    if (!full) return;
    add(full);
    onSelect(full);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((active + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((active - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(rows[active]);
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // A div, not a <button>: rows contain their own copy button, and nested
  // buttons are invalid HTML. Keyboard selection is handled on the input.
  const renderRow = (row: Row, i: number) => (
    <div
      key={row.mint}
      role="option"
      aria-selected={i === active}
      data-index={i}
      onMouseEnter={() => setCursor(i)}
      onClick={() => choose(row)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        i === active ? "border-primary/15 bg-primary/5" : "border-transparent bg-surface/60",
      )}
    >
      <TokenAvatar src={row.imgUrl} name={row.name} className="size-10 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold">{row.name}</span>
          <span className="shrink-0 text-xs text-tide">${row.symbol}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-subtle-foreground">
          {shortAddress(row.mint)}
          <CopyButton value={row.mint} label="Copy contract address" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] tracking-wide text-subtle-foreground uppercase">Market cap</p>
        <p className="text-sm font-medium tabular-nums">{formatUsd(row.marketCap)}</p>
      </div>
    </div>
  );

  return (
    <div onKeyDown={onKeyDown} className="min-w-0">
      <div className="flex items-center gap-3 border-b border-primary/10 px-4 py-3.5">
        <Search className="size-5 shrink-0 text-subtle-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          placeholder="SEARCH TOKEN"
          aria-label="Search tokens by name, ticker or address"
          className="min-w-0 flex-1 bg-transparent text-base tracking-widest outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-primary/10 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground hover:text-foreground"
        >
          ESC
        </button>
      </div>

      <div ref={listRef} role="listbox" aria-label="Tokens" className="max-h-[60vh] overflow-y-auto p-4">
        {q ? (
          searching ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm break-all text-muted-foreground">
              No tokens match “{query.trim()}”.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">{results.map(renderRow)}</div>
          )
        ) : (
          <>
            <Section icon={Clock} title="Recent Searched">
              {recent.length === 0 ? (
                <p className="px-1 text-sm text-muted-foreground">No recent searches yet.</p>
              ) : (
                recent.map(renderRow)
              )}
            </Section>
            <Section icon={Flame} title="Trending Now" className="mt-5">
              {trending.map((t, i) => renderRow(t, recent.length + i))}
            </Section>
          </>
        )}
      </div>

      <div className="flex gap-4 border-t border-primary/10 px-4 py-2 text-[11px] text-subtle-foreground">
        <Hint keys="↑↓" label="navigate" />
        <Hint keys="↵" label="open" />
        <Hint keys="esc" label="close" />
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: typeof Clock;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/90">
        <Icon className={cn("size-4", Icon === Flame ? "text-sunset" : "text-muted-foreground")} />
        {title}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-primary/10 bg-surface px-1 font-mono">{keys}</kbd>
      {label}
    </span>
  );
}
