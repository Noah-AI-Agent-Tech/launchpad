/**
 * Token listings, lookups and trade history.
 *
 * Everything is served from the in-memory demo store (`src/mocks/store.ts`).
 * Calls resolve after a short delay so loading states still show, and take an
 * AbortSignal like a network call would.
 */

import { wait } from "@/mocks/rng";
import * as store from "@/mocks/store";

export type SortKey = "marketCap" | "new" | "lastTrade";
export type MintType = "default" | "graduated";

export type QuoteToken = {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
};

export type LaunchToken = {
  mint: string;
  poolId: string;
  creator: string;
  /** ms epoch */
  createAt: number;
  name: string;
  symbol: string;
  description?: string;
  imgUrl?: string;
  /** Metadata JSON the token was created with. */
  metadataUrl?: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  /** USD */
  marketCap: number;
  /** 24h volume, USD */
  volumeU?: number;
  /** Bonding-curve progress, 0–100. 100 = graduated. */
  finishingRate: number;
  mintB: QuoteToken;
  platformInfo?: { name?: string; web?: string; img?: string };
  configInfo?: { name?: string; tradeFeeRate?: string };
  decimals: number;
  supply: number;
  /** Quote-token amount (raw units, mintB.decimals) needed to graduate. */
  totalFundRaisingB?: string;
  /** Present once the token has migrated to an AMM pool. */
  migrateAmmId?: string;
};

export type Trade = {
  txid: string;
  owner: string;
  /** seconds epoch */
  blockTime: number;
  poolId: string;
  side: "buy" | "sell";
  /** Base (launched) token amount. */
  amountA: number;
  /** Quote token amount. */
  amountB: number;
};

export async function fetchTokenList(
  opts: { sort: SortKey; mintType: MintType; size?: number },
  signal?: AbortSignal,
) {
  await wait(450, signal);
  return { rows: store.listTokens(opts.sort, opts.mintType).slice(0, opts.size ?? 100) };
}

export async function fetchTokensByMints(ids: string[], signal?: AbortSignal) {
  if (ids.length === 0) return [];
  await wait(250, signal);
  return ids.map(store.getToken).filter((t): t is LaunchToken => t != null);
}

export async function fetchTrades(poolId: string, limit = 50, signal?: AbortSignal) {
  await wait(300, signal);
  return store.getTrades(poolId).slice(0, limit);
}

/** Quote-token amount the curve must raise before the token graduates. */
export function graduationTarget(t: LaunchToken) {
  if (!t.totalFundRaisingB) return null;
  return Number(t.totalFundRaisingB) / 10 ** t.mintB.decimals;
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const isMintAddress = (s: string) => BASE58.test(s.trim());

export const isGraduated = (t: LaunchToken) => t.finishingRate >= 100 || Boolean(t.migrateAmmId);
