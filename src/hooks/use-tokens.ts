import { useCallback, useEffect, useState } from "react";
import { useStoreVersion } from "@/hooks/use-store-version";
import { fetchTokenList, type LaunchToken, type MintType, type SortKey } from "@/lib/tokens";

export function useTokens(sort: SortKey, mintType: MintType) {
  const [tokens, setTokens] = useState<LaunchToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const version = useStoreVersion();

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchTokenList({ sort, mintType }, ctrl.signal)
      .then((d) => setTokens(d.rows))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load tokens");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [sort, mintType, tick, version]);

  return { tokens, loading, error, refresh };
}
