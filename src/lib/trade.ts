/**
 * Buying and selling a launched token, against the demo store.
 *
 *   buy   SOL / USDC / USDT → (the curve's quote token) → curve → token
 *   sell  token → curve → (quote token) → SOL / USDC / USDT
 *
 * When the payment asset isn't the curve's quote token, a router hop converts
 * it first, folded into the same trade. Once a token graduates, the same call
 * trades against its AMM pool instead of the curve.
 */

import { ASSETS, USDC_MINT, USDT_MINT, WSOL_MINT } from "@/mocks/data";
import { wait } from "@/mocks/rng";
import * as store from "@/mocks/store";

export { USDC_MINT, USDT_MINT, WSOL_MINT };

/** Logos and prices for the assets you can pay with or receive. */
export const COUNTER_ASSETS = Object.values(ASSETS);

/** SOL kept back on "Max" for fees. */
export const SOL_FEE_RESERVE = 0.01;

/* -------------------------------------------------------------------------- */
/*                                  Balances                                  */
/* -------------------------------------------------------------------------- */

export type Holding = {
  mint: string;
  raw: bigint;
  decimals: number;
  ui: number;
};

/** Everything the wallet holds, by mint. */
export async function fetchHoldings(owner: string, signal?: AbortSignal): Promise<Map<string, Holding>> {
  await wait(250, signal);
  return new Map(
    store.getBalances(owner).map((b) => [b.mint, { ...b, ui: Number(b.raw) / 10 ** b.decimals }]),
  );
}

/* -------------------------------------------------------------------------- */
/*                                Quote + trade                               */
/* -------------------------------------------------------------------------- */

export type SwapQuote = {
  data: {
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    /** Minimum out after slippage. */
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    routePlan: { poolId: string; inputMint: string; outputMint: string }[];
  };
};

type SwapArgs = { inputMint: string; outputMint: string; amountRaw: string; slippageBps: number };

export async function quoteSwap(args: SwapArgs, signal?: AbortSignal): Promise<SwapQuote> {
  await wait(300, signal);
  const c = store.computeSwap(args);
  return {
    data: {
      inputMint: args.inputMint,
      inputAmount: c.inputAmount,
      outputMint: args.outputMint,
      outputAmount: c.outputAmount,
      otherAmountThreshold: c.otherAmountThreshold,
      slippageBps: args.slippageBps,
      priceImpactPct: c.priceImpactPct,
      routePlan: c.routePlan,
    },
  };
}

/**
 * Signs and settles a trade for `owner`. `onSigned` fires between the two, so
 * the UI can move from "signing" to "confirming". Returns the signature.
 */
export async function executeSwap(
  owner: string,
  args: SwapArgs,
  onSigned: () => void,
  signal?: AbortSignal,
): Promise<{ signature: string; graduated: boolean }> {
  await wait(700, signal);
  onSigned();
  await wait(900, signal);
  const { signature, graduated } = store.executeSwap(owner, args);
  return { signature, graduated };
}

/* -------------------------------------------------------------------------- */
/*                                  Amounts                                   */
/* -------------------------------------------------------------------------- */

/** "1.5" → raw integer string at `decimals`, without floating-point drift. */
export function toRaw(value: string, decimals: number): string {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed)) return "0";
  const [whole = "0", fraction = ""] = trimmed.split(".");
  const raw = `${whole}${(fraction + "0".repeat(decimals)).slice(0, decimals)}`.replace(/^0+(?=\d)/, "");
  return /^\d+$/.test(raw) ? raw : "0";
}

/** Raw → number for display. Precision past ~15 digits doesn't matter on screen. */
export const fromRaw = (raw: string | bigint, decimals: number) => Number(raw) / 10 ** decimals;

/** Raw → the exact decimal string, for filling an input ("Max"). */
export function rawToInput(raw: bigint, decimals: number): string {
  const s = raw.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const fraction = s.slice(s.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
