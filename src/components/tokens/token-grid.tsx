import type { LaunchToken } from "@/lib/tokens";
import { TokenCard } from "./token-card";
import { TokenCardSkeleton } from "./token-card-skeleton";

type Props = {
  tokens: LaunchToken[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function TokenGrid({ tokens, loading, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
        <p className="text-sm text-destructive">Couldn't load tokens — {error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-foreground underline underline-offset-4 hover:text-tide"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading && tokens.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <TokenCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No tokens here yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tokens.map((t) => (
        <TokenCard key={t.mint} token={t} />
      ))}
    </div>
  );
}
