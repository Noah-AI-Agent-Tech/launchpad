/** Top holders of a token, from the demo store. */

import { SUPPLY, topHolders } from "@/mocks/store";
import { wait } from "@/mocks/rng";

export type Holder = {
  rank: number;
  /** Wallet that owns the token account. */
  owner: string;
  tokenAccount: string;
  amount: number;
  /** Share of total supply, 0–100. */
  percent: number;
  /** Set for program-owned accounts, e.g. "Bonding curve". */
  label?: string;
};

export async function fetchTopHolders(mint: string, signal?: AbortSignal): Promise<Holder[]> {
  await wait(300, signal);
  return topHolders(mint).map((h, i) => ({ ...h, rank: i + 1, percent: (h.amount / SUPPLY) * 100 }));
}
