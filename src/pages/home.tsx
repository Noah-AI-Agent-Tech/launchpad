import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SearchDialog } from "@/components/search/search-dialog";
import { TokenGrid } from "@/components/tokens/token-grid";
import { TokenToolbar } from "@/components/tokens/token-toolbar";
import { useTokens } from "@/hooks/use-tokens";
import type { MintType, SortKey } from "@/lib/tokens";

export function HomePage() {
  const [sort, setSort] = useState<SortKey>("marketCap");
  const [mintType, setMintType] = useState<MintType>("default");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const { tokens, loading, error, refresh } = useTokens(sort, mintType);

  // ⌘K / Ctrl+K opens the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <main className="mx-auto w-full flex-1 px-4 pt-28 pb-16 sm:pt-36 lg:px-6 xl:max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-6xl">
            Tokens on{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              Launchpad
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-foreground/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
            Live bonding-curve launches. Watch the Noah mark ride the curve, then
            graduate.
          </p>
        </div>

        <TokenToolbar
          sort={sort}
          mintType={mintType}
          loading={loading}
          onSort={setSort}
          onMintType={setMintType}
          onRefresh={refresh}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <div className="mt-6">
          <TokenGrid tokens={tokens} loading={loading} error={error} onRetry={refresh} />
        </div>
      </main>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        tokens={tokens}
        onSelect={(t) => navigate(`/token/${t.mint}`)}
      />
    </>
  );
}
