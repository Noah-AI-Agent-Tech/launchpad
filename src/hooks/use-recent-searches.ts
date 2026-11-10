import { useCallback, useState } from "react";
import type { LaunchToken } from "@/lib/tokens";

const KEY = "noah:recent-searches";
const MAX = 5;

/** The slice of a token we persist for the "Recent" list. */
export type RecentToken = Pick<
  LaunchToken,
  "mint" | "name" | "symbol" | "imgUrl" | "metadataUrl" | "marketCap"
>;

function read(): RecentToken[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentToken[]) : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentToken[]>(read);

  const add = useCallback((t: LaunchToken) => {
    setRecent((prev) => {
      const next: RecentToken[] = [
        {
          mint: t.mint,
          name: t.name,
          symbol: t.symbol,
          imgUrl: t.imgUrl,
          metadataUrl: t.metadataUrl,
          marketCap: t.marketCap,
        },
        ...prev.filter((r) => r.mint !== t.mint),
      ].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private mode etc. */
      }
      return next;
    });
  }, []);

  return { recent, add };
}
