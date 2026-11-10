/**
 * The demo's in-memory backend: tokens, their bonding curves, trade history
 * and wallet balances.
 *
 * Seeded from `data.ts` when the page loads; launching and trading in the app
 * update it, so the UI responds as it would against a live chain. Everything
 * resets on reload. Nothing here talks to a network.
 *
 * Curve model: a constant-product curve on virtual reserves. Every token has a
 * 1B supply, sells 793.1M of it along the curve, raises the equivalent of
 * 85 SOL in its quote token, then graduates into an AMM pool seeded with the
 * raise and the remaining 206.9M tokens.
 */

import type { LaunchToken, MintType, SortKey, Trade } from "@/lib/tokens";
import { tokenArt } from "./art";
import {
  ASSETS,
  SOL_USD,
  STARTING_BALANCES,
  TOKEN_SEEDS,
  USDC_MINT,
  WSOL_MINT,
  type DemoAsset,
  type TokenSeed,
} from "./data";
import { fakeAddress, fakeSignature, gaussian, rng } from "./rng";

/* -------------------------------------------------------------------------- */
/*                                Curve model                                 */
/* -------------------------------------------------------------------------- */

export const SUPPLY = 1_000_000_000;
export const BASE_DECIMALS = 6;
/** Virtual base reserve at launch. The 73M above supply is never sold. */
const VIRTUAL_BASE = 1_073_000_000;
/** Virtual quote reserve at launch, in SOL. Sets the opening price. */
const VIRTUAL_QUOTE_SOL = 30;
/** Quote raised (SOL-equivalent) when the curve completes. */
export const RAISE_SOL = 85;
/** Base tokens sold along the curve. */
export const SELL_BASE = 793_100_000;
/** Fee on every curve/pool trade. */
export const CURVE_FEE = 0.01;
/** Fee on the hop between the payment asset and the curve's quote token. */
const ROUTER_FEE = 0.003;
/** Network fees + rent a launch costs, in SOL. */
export const LAUNCH_FEE_SOL = 0.02;

type Pool = {
  /** Base reserve (virtual while on the curve). */
  a: number;
  /** Quote reserve (virtual while on the curve). */
  b: number;
  /** Virtual quote reserve at launch. */
  vB0: number;
  /** Quote amount the curve raises. */
  raise: number;
  graduated: boolean;
  quote: DemoAsset;
};

/** Quote units per SOL. */
const perSol = (q: DemoAsset) => SOL_USD / q.usdPrice;

function curvePool(quote: DemoAsset, pct: number): Pool {
  const vB0 = VIRTUAL_QUOTE_SOL * perSol(quote);
  const raise = RAISE_SOL * perSol(quote);
  const k = VIRTUAL_BASE * vB0;
  const b = vB0 + (raise * Math.min(100, Math.max(0, pct))) / 100;
  return { a: k / b, b, vB0, raise, graduated: false, quote };
}

/** A graduated pool priced at `mcapUsd`, keeping the invariant it graduated with. */
function ammPool(quote: DemoAsset, mcapUsd: number): Pool {
  const base = curvePool(quote, 100);
  const k = (SUPPLY - SELL_BASE) * base.raise;
  const price = mcapUsd / SUPPLY / quote.usdPrice;
  return { ...base, a: Math.sqrt(k / price), b: Math.sqrt(k * price), graduated: true };
}

const spot = (p: Pool) => p.b / p.a;
const openingPrice = (p: Pool) => p.vB0 / VIRTUAL_BASE;
const curveEndB = (p: Pool) => p.vB0 + p.raise;
const progressOf = (p: Pool) =>
  p.graduated ? 100 : Math.min(100, Math.max(0, ((p.b - p.vB0) / p.raise) * 100));

/** Opening and graduation figures for a new SOL-paired launch. */
export function launchFigures() {
  const quote = ASSETS[WSOL_MINT];
  const open = curvePool(quote, 0);
  const end = curvePool(quote, 100);
  return {
    raiseUnits: open.raise,
    startMarketCapUsd: SUPPLY * spot(open) * quote.usdPrice,
    graduationMarketCapUsd: SUPPLY * spot(end) * quote.usdPrice,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   State                                    */
/* -------------------------------------------------------------------------- */

const tokens = new Map<string, LaunchToken>();
const pools = new Map<string, Pool>();
/** By poolId, newest first. */
const trades = new Map<string, Trade[]>();
const lastTradeAt = new Map<string, number>();
/** owner → mint → raw balance */
const balances = new Map<string, Map<string, bigint>>();

let version = 0;
const listeners = new Set<() => void>();

/** Lets views refetch after a trade or launch changes the data. */
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
export const getVersion = () => version;
function changed() {
  version++;
  for (const fn of listeners) fn();
}

function derive(t: LaunchToken) {
  const p = pools.get(t.mint)!;
  t.marketCap = SUPPLY * spot(p) * p.quote.usdPrice;
  t.finishingRate = progressOf(p);
}

const decimalsOf = (mint: string) => ASSETS[mint]?.decimals ?? BASE_DECIMALS;
const toUi = (raw: string | bigint, decimals: number) => Number(raw) / 10 ** decimals;
const toRaw = (ui: number, decimals: number) => BigInt(Math.max(0, Math.floor(ui * 10 ** decimals)));

/* -------------------------------------------------------------------------- */
/*                                  Seeding                                   */
/* -------------------------------------------------------------------------- */

const NOW = Date.now();
/** Wallets that show up in generated trades and holder lists. */
const CROWD = Array.from({ length: 40 }, (_, i) => fakeAddress(rng(`crowd:${i}`)));

function seedToken(seed: TokenSeed) {
  const rand = rng(`token:${seed.symbol}`);
  const quote = ASSETS[seed.quote === "USDC" ? USDC_MINT : WSOL_MINT];
  const pool =
    seed.graduatedMcapUsd != null ? ammPool(quote, seed.graduatedMcapUsd) : curvePool(quote, seed.progress ?? 0);

  const token: LaunchToken = {
    mint: fakeAddress(rand, "noah"),
    poolId: fakeAddress(rand),
    creator: fakeAddress(rand),
    createAt: NOW - seed.ageMinutes * 60_000,
    name: seed.name,
    symbol: seed.symbol,
    description: seed.description,
    imgUrl: tokenArt(seed.symbol, seed.glyph),
    website: seed.website,
    marketCap: 0,
    volumeU: seed.volumeU,
    finishingRate: 0,
    mintB: { address: quote.address, symbol: quote.symbol, name: quote.name, logoURI: quote.logoURI, decimals: quote.decimals },
    platformInfo: { name: "Noah" },
    configInfo: { name: "Constant product", tradeFeeRate: String(CURVE_FEE * 1_000_000) },
    decimals: BASE_DECIMALS,
    supply: SUPPLY,
    totalFundRaisingB: toRaw(pool.raise, quote.decimals).toString(),
    migrateAmmId: pool.graduated ? fakeAddress(rand) : undefined,
  };

  tokens.set(token.mint, token);
  pools.set(token.mint, pool);
  derive(token);

  const history = historyFor(token, pool, rand);
  trades.set(token.poolId, history);
  lastTradeAt.set(token.mint, history[0] ? history[0].blockTime * 1000 : token.createAt);
}

/**
 * Plausible trade history: denser toward now, priced along a path from the
 * opening price to today's, opening with the creator's dev buy.
 */
function historyFor(token: LaunchToken, pool: Pool, rand: () => number): Trade[] {
  const age = NOW - token.createAt;
  const n = Math.round(Math.min(60, Math.max(6, 4 + Math.sqrt(token.volumeU ?? 0) / 6 + age / 3_600_000)));
  const p0 = Math.log(openingPrice(pool));
  const p1 = Math.log(spot(pool));
  const sol = perSol(pool.quote);
  const out: Trade[] = [];

  for (let i = 0; i < n; i++) {
    const frac = 1 - rand() ** 2.4;
    const price = Math.exp(p0 + (p1 - p0) * frac + 0.12 * gaussian(rand));
    const amountB = Math.max(0.01, Math.exp(gaussian(rand) * 0.9) * 0.55) * sol;
    out.push({
      txid: fakeSignature(rand),
      owner: CROWD[Math.floor(rand() * CROWD.length)],
      blockTime: Math.floor((token.createAt + age * frac) / 1000),
      poolId: token.poolId,
      side: rand() < 0.62 ? "buy" : "sell",
      amountA: amountB / price,
      amountB,
    });
  }

  const devBuy = (0.5 + rand() * 2) * sol;
  out.push({
    txid: fakeSignature(rand),
    owner: token.creator,
    blockTime: Math.floor(token.createAt / 1000),
    poolId: token.poolId,
    side: "buy",
    amountA: devBuy / Math.exp(p0),
    amountB: devBuy,
  });

  return out.sort((x, y) => y.blockTime - x.blockTime);
}

TOKEN_SEEDS.forEach(seedToken);

/* -------------------------------------------------------------------------- */
/*                                   Reads                                    */
/* -------------------------------------------------------------------------- */

const copy = (t: LaunchToken): LaunchToken => ({ ...t, mintB: { ...t.mintB } });

export function listTokens(sort: SortKey, mintType: MintType): LaunchToken[] {
  const rows = [...tokens.values()].filter((t) => mintType === "default" || pools.get(t.mint)!.graduated);
  const key: Record<SortKey, (t: LaunchToken) => number> = {
    marketCap: (t) => t.marketCap,
    new: (t) => t.createAt,
    lastTrade: (t) => lastTradeAt.get(t.mint) ?? t.createAt,
  };
  return rows.sort((x, y) => key[sort](y) - key[sort](x)).map(copy);
}

export function getToken(mint: string): LaunchToken | null {
  const t = tokens.get(mint.trim());
  return t ? copy(t) : null;
}

export const getTrades = (poolId: string) => [...(trades.get(poolId) ?? [])];

/** What the chart needs to draw a token's history. */
export function chartBasis(mint: string) {
  const t = tokens.get(mint);
  const p = pools.get(mint);
  if (!t || !p) return null;
  return {
    createAt: t.createAt,
    openPrice: openingPrice(p),
    price: spot(p),
    quoteUsd: p.quote.usdPrice,
    volumeU: t.volumeU ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Wallets                                   */
/* -------------------------------------------------------------------------- */

function walletOf(owner: string) {
  let w = balances.get(owner);
  if (!w) {
    w = new Map();
    for (const { asset, amount } of STARTING_BALANCES) {
      const mint =
        Object.values(ASSETS).find((a) => a.symbol === asset)?.address ??
        [...tokens.values()].find((t) => t.symbol === asset)?.mint;
      if (mint) w.set(mint, toRaw(amount, decimalsOf(mint)));
    }
    balances.set(owner, w);
  }
  return w;
}

export function getBalances(owner: string) {
  return [...walletOf(owner)].map(([mint, raw]) => ({ mint, raw, decimals: decimalsOf(mint) }));
}

/* -------------------------------------------------------------------------- */
/*                                  Holders                                   */
/* -------------------------------------------------------------------------- */

export type HolderRow = { owner: string; tokenAccount: string; amount: number; label?: string };

export function topHolders(mint: string, limit = 20): HolderRow[] {
  const t = tokens.get(mint);
  const p = pools.get(mint);
  if (!t || !p) return [];

  const rand = rng(`holders:${mint}`);
  const inPool = p.graduated ? p.a : p.a - (VIRTUAL_BASE - SUPPLY);
  const rows: HolderRow[] = [
    {
      owner: p.graduated ? t.migrateAmmId! : t.poolId,
      tokenAccount: fakeAddress(rng(`vault:${mint}`)),
      amount: inPool,
      label: p.graduated ? "AMM pool" : "Bonding curve",
    },
  ];

  // Wallets that hold it in this session (including yours).
  let held = 0;
  for (const [owner, w] of balances) {
    const raw = w.get(mint);
    if (!raw) continue;
    const amount = toUi(raw, BASE_DECIMALS);
    held += amount;
    rows.push({ owner, tokenAccount: fakeAddress(rng(`ata:${owner}:${mint}`)), amount });
  }

  // The rest of the circulating supply, spread over a crowd with a long tail.
  // A brand-new token has no rest: its only holders are the curve and its buyers.
  const free = Math.max(0, SUPPLY - inPool - held) * 0.88;
  if (free >= 1) {
    const seen = new Set(rows.map((r) => r.owner));
    const owners = [t.creator, ...CROWD.slice().sort(() => rand() - 0.5)].filter((o) => !seen.has(o));
    const crowd = Math.min(owners.length, Math.max(1, Math.round(Math.log10(free) * 3)), limit);
    const weights = Array.from({ length: crowd }, () => rand() ** 3 + 0.01);
    const total = weights.reduce((s, w) => s + w, 0);
    weights.forEach((w, i) =>
      rows.push({ owner: owners[i], tokenAccount: fakeAddress(rng(`ata:${owners[i]}:${mint}`)), amount: (free * w) / total }),
    );
  }

  return rows
    .filter((r) => r.amount >= 1)
    .sort((x, y) => y.amount - x.amount)
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*                                   Swaps                                    */
/* -------------------------------------------------------------------------- */

export type SwapArgs = { inputMint: string; outputMint: string; amountRaw: string; slippageBps: number };

export type SwapComputation = {
  inputAmount: string;
  outputAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: number;
  routePlan: { poolId: string; inputMint: string; outputMint: string }[];
  side: "buy" | "sell";
  mint: string;
  /** Base and quote amounts that change hands on the curve/pool. */
  baseAmount: number;
  quoteAmount: number;
  /** Net quote added (buy) or removed (sell) from the pool. */
  poolQuote: number;
  /** This buy completes the curve. */
  completes: boolean;
};

/** Prices a swap between a launched token and SOL/USDC/USDT. Throws when it can't fill. */
export function computeSwap({ inputMint, outputMint, amountRaw, slippageBps }: SwapArgs): SwapComputation {
  const side = tokens.has(outputMint) ? "buy" : tokens.has(inputMint) ? "sell" : null;
  if (!side) throw new Error("No route for this pair right now.");
  const mint = side === "buy" ? outputMint : inputMint;
  const counter = ASSETS[side === "buy" ? inputMint : outputMint];
  if (!counter) throw new Error("No route for this pair right now.");

  const t = tokens.get(mint)!;
  const p = pools.get(mint)!;
  const direct = counter.address === p.quote.address;
  const hop: SwapComputation["routePlan"] = direct
    ? []
    : [{ poolId: "router", inputMint: counter.address, outputMint: p.quote.address }];
  const pool = { poolId: p.graduated ? t.migrateAmmId! : t.poolId };
  const k = p.a * p.b;
  const price = spot(p);

  if (side === "buy") {
    const conv = direct ? 1 : (counter.usdPrice / p.quote.usdPrice) * (1 - ROUTER_FEE);
    let counterIn = toUi(amountRaw, counter.decimals);
    let quoteNet = counterIn * conv * (1 - CURVE_FEE);
    let out = p.a - k / (p.b + quoteNet);
    let completes = false;

    if (!p.graduated) {
      const left = p.a - k / curveEndB(p);
      if (out >= left) {
        // The curve only has `left` to sell: fill that and spend just enough.
        out = left;
        quoteNet = curveEndB(p) - p.b;
        counterIn = quoteNet / (1 - CURVE_FEE) / conv;
        completes = true;
      }
    }
    if (!(out > 0) || counterIn * counter.usdPrice < 0.01) throw new Error("Amount is too small to trade.");

    const outRaw = toRaw(out, BASE_DECIMALS);
    return {
      inputAmount: toRaw(counterIn, counter.decimals).toString(),
      outputAmount: outRaw.toString(),
      otherAmountThreshold: ((outRaw * BigInt(10_000 - slippageBps)) / 10_000n).toString(),
      priceImpactPct: Math.max(0, (quoteNet / out / price - 1) * 100),
      routePlan: [...hop, { ...pool, inputMint: p.quote.address, outputMint: mint }],
      side,
      mint,
      baseAmount: out,
      quoteAmount: quoteNet / (1 - CURVE_FEE),
      poolQuote: quoteNet,
      completes,
    };
  }

  const baseIn = toUi(amountRaw, BASE_DECIMALS);
  const net = baseIn * (1 - CURVE_FEE);
  if (!p.graduated && p.a + net > VIRTUAL_BASE + 1e-6) {
    throw new Error("Not enough liquidity on the curve for this size — try a smaller amount.");
  }
  const quoteOut = p.b - k / (p.a + net);
  const conv = direct ? 1 : (p.quote.usdPrice / counter.usdPrice) * (1 - ROUTER_FEE);
  const counterOut = quoteOut * conv;
  if (!(counterOut > 0) || counterOut * counter.usdPrice < 0.0001) throw new Error("Amount is too small to trade.");

  const outRaw = toRaw(counterOut, counter.decimals);
  return {
    inputAmount: amountRaw,
    outputAmount: outRaw.toString(),
    otherAmountThreshold: ((outRaw * BigInt(10_000 - slippageBps)) / 10_000n).toString(),
    priceImpactPct: Math.max(0, (1 - quoteOut / net / price) * 100),
    routePlan: [{ ...pool, inputMint: mint, outputMint: p.quote.address }, ...hop.map((h) => ({ ...h, inputMint: h.outputMint, outputMint: h.inputMint }))],
    side,
    mint,
    baseAmount: baseIn,
    quoteAmount: quoteOut,
    poolQuote: quoteOut,
    completes: false,
  };
}

/**
 * Fills a swap for `owner`: moves balances, moves the curve, records the
 * trade, and graduates the token if the buy completed its curve.
 */
export function executeSwap(owner: string, args: SwapArgs) {
  const c = computeSwap(args);
  const w = walletOf(owner);
  const spend = BigInt(c.inputAmount);
  const have = w.get(args.inputMint) ?? 0n;
  if (spend > have) {
    const sym = ASSETS[args.inputMint]?.symbol ?? tokens.get(args.inputMint)?.symbol ?? "tokens";
    throw new Error(`Not enough ${sym} for this trade.`);
  }
  w.set(args.inputMint, have - spend);
  w.set(args.outputMint, (w.get(args.outputMint) ?? 0n) + BigInt(c.outputAmount));

  const t = tokens.get(c.mint)!;
  const p = pools.get(c.mint)!;
  if (c.side === "buy") {
    p.a -= c.baseAmount;
    p.b += c.poolQuote;
  } else {
    p.a += c.baseAmount * (1 - CURVE_FEE);
    p.b -= c.poolQuote;
  }
  if (c.completes) graduate(t, p);

  const signature = fakeSignature();
  const now = Date.now();
  trades.get(t.poolId)!.unshift({
    txid: signature,
    owner,
    blockTime: Math.floor(now / 1000),
    poolId: t.poolId,
    side: c.side,
    amountA: c.baseAmount,
    amountB: c.quoteAmount,
  });
  lastTradeAt.set(t.mint, now);
  t.volumeU = (t.volumeU ?? 0) + c.quoteAmount * p.quote.usdPrice;
  derive(t);
  changed();

  return { signature, computation: c, graduated: c.completes };
}

/** Curve complete: the raise and the unsold supply move into an AMM pool. */
function graduate(t: LaunchToken, p: Pool) {
  p.graduated = true;
  p.a = SUPPLY - SELL_BASE;
  p.b = p.raise;
  t.migrateAmmId = fakeAddress(Math.random, "");
}

/* -------------------------------------------------------------------------- */
/*                                  Launches                                  */
/* -------------------------------------------------------------------------- */

export type NewToken = {
  creator: string;
  name: string;
  symbol: string;
  description?: string;
  imgUrl: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  devBuySol: number;
};

/**
 * Creates a SOL-paired token on a fresh curve, with the creator's dev buy as
 * its first trade.
 */
export function createToken(input: NewToken) {
  const sol = ASSETS[WSOL_MINT];
  const w = walletOf(input.creator);
  const cost = toRaw(LAUNCH_FEE_SOL + input.devBuySol, sol.decimals);
  if ((w.get(WSOL_MINT) ?? 0n) < cost) {
    throw new Error(
      `Not enough SOL: this launch needs ${(LAUNCH_FEE_SOL + input.devBuySol).toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL including fees.`,
    );
  }
  w.set(WSOL_MINT, (w.get(WSOL_MINT) ?? 0n) - toRaw(LAUNCH_FEE_SOL, sol.decimals));

  const pool = curvePool(sol, 0);
  const token: LaunchToken = {
    mint: fakeAddress(Math.random, "noah"),
    poolId: fakeAddress(),
    creator: input.creator,
    createAt: Date.now(),
    name: input.name,
    symbol: input.symbol,
    description: input.description || undefined,
    imgUrl: input.imgUrl,
    website: input.website,
    twitter: input.twitter,
    telegram: input.telegram,
    marketCap: 0,
    volumeU: 0,
    finishingRate: 0,
    mintB: { address: sol.address, symbol: sol.symbol, name: sol.name, logoURI: sol.logoURI, decimals: sol.decimals },
    platformInfo: { name: "Noah" },
    configInfo: { name: "Constant product", tradeFeeRate: String(CURVE_FEE * 1_000_000) },
    decimals: BASE_DECIMALS,
    supply: SUPPLY,
    totalFundRaisingB: toRaw(pool.raise, sol.decimals).toString(),
  };
  tokens.set(token.mint, token);
  pools.set(token.mint, pool);
  trades.set(token.poolId, []);
  lastTradeAt.set(token.mint, token.createAt);
  derive(token);

  let signature = fakeSignature();
  if (input.devBuySol > 0) {
    signature = executeSwap(input.creator, {
      inputMint: WSOL_MINT,
      outputMint: token.mint,
      amountRaw: toRaw(input.devBuySol, sol.decimals).toString(),
      slippageBps: 100,
    }).signature;
  } else {
    changed();
  }

  return { mint: token.mint, poolId: token.poolId, signature };
}
