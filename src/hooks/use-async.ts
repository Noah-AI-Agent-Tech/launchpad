import { useCallback, useEffect, useState } from "react";

/**
 * Runs `fn` once per `key` change (and on manual `refresh`). Deliberately no
 * polling: token detail data is fetched on demand only.
 */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fn(ctrl.signal)
      .then((d) => setData(d))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // `fn` is intentionally excluded; `key` identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { data, loading, error, refresh };
}
