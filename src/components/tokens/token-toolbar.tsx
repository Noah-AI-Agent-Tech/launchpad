import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MintType, SortKey } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type Props = {
  sort: SortKey;
  mintType: MintType;
  loading: boolean;
  onSort: (s: SortKey) => void;
  onMintType: (m: MintType) => void;
  onRefresh: () => void;
  onOpenSearch: () => void;
};

const sorts: { key: SortKey; label: string }[] = [
  { key: "marketCap", label: "Market cap" },
  { key: "new", label: "Newest" },
];

export function TokenToolbar({ sort, loading, onSort, onRefresh, onOpenSearch }: Props) {
  // `mintType` / `onMintType` stay in the props so the Graduated filter can
  // come back without touching the page; it's just not rendered for now.
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Segmented pill: outlined track, filled thumb on the active option. */}
      <div
        role="radiogroup"
        aria-label="Sort"
        className="inline-flex h-10 items-center gap-0.5 rounded-full border border-primary/15 bg-jet/50 p-1 backdrop-blur-sm"
      >
        {sorts.map(({ key, label }) => {
          const active = sort === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSort(key)}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3.5 font-mono text-xs transition-colors select-none sm:text-[13px]",
                active
                  ? "bg-tide/15 text-tide"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl bg-jet/50 px-3 text-[13px] text-muted-foreground backdrop-blur-sm transition-colors hover:bg-jet/70 hover:text-foreground sm:h-10 sm:w-64 sm:flex-none sm:px-3.5 sm:text-sm"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search tokens</span>
          <kbd className="hidden rounded border border-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
        <Button
          variant="outline"
          size="icon-lg"
          className="size-9 rounded-xl bg-jet/50 ring-0 backdrop-blur-sm hover:bg-jet/70 sm:size-10"
          aria-label="Refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
