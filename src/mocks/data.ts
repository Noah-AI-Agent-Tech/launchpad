/**
 * Demo fixtures: the quote tokens and the launches the site opens with.
 *
 * Every value here is made up. Market caps, curve progress and volumes are
 * starting points; trades made in the app move them from there.
 */

import { SOL_LOGO, USDC_LOGO, USDT_LOGO } from "./art";

/** Fixed USD prices for the demo. */
export const SOL_USD = 182.4;

export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export type DemoAsset = {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
  usdPrice: number;
};

/** Assets the demo can price: SOL and two dollar stablecoins. */
export const ASSETS: Record<string, DemoAsset> = {
  [WSOL_MINT]: { address: WSOL_MINT, symbol: "SOL", name: "Solana", logoURI: SOL_LOGO, decimals: 9, usdPrice: SOL_USD },
  [USDC_MINT]: { address: USDC_MINT, symbol: "USDC", name: "USD Coin", logoURI: USDC_LOGO, decimals: 6, usdPrice: 1 },
  [USDT_MINT]: { address: USDT_MINT, symbol: "USDT", name: "Tether USD", logoURI: USDT_LOGO, decimals: 6, usdPrice: 1 },
};

export type TokenSeed = {
  name: string;
  symbol: string;
  /** Text drawn on the generated artwork; defaults to the symbol's first letters. */
  glyph?: string;
  description?: string;
  /** How long ago it launched. */
  ageMinutes: number;
  /** Curve progress 0–100 for tokens still on the curve… */
  progress?: number;
  /** …or the current market cap (USD) for graduated ones. */
  graduatedMcapUsd?: number;
  /** 24h volume, USD. */
  volumeU: number;
  quote?: "SOL" | "USDC";
  website?: string;
};

const H = 60;
const D = 24 * H;

export const TOKEN_SEEDS: TokenSeed[] = [
  { name: "Monsoon", symbol: "MNSN", glyph: "🌧", ageMinutes: 9 * D, graduatedMcapUsd: 2_640_000, volumeU: 418_000, description: "The season everyone waits for. Graduated on day two." },
  { name: "Noah Wave", symbol: "WAVE", glyph: "🌊", ageMinutes: 6 * D + 5 * H, graduatedMcapUsd: 1_842_000, volumeU: 296_500, description: "The first wave off the Noah launchpad.", website: "https://trynoah.ai" },
  { name: "Ark Protocol", symbol: "ARK", ageMinutes: 4 * D + 2 * H, graduatedMcapUsd: 918_400, volumeU: 121_300, description: "Two of every agent, one ark." },
  { name: "Rainmaker", symbol: "RAIN", glyph: "☔", ageMinutes: 3 * D, graduatedMcapUsd: 406_900, volumeU: 64_200 },
  { name: "Tidal Cat", symbol: "TCAT", glyph: "🐱", ageMinutes: 19 * H, progress: 92.4, volumeU: 58_900, description: "A cat that only comes in with the tide." },
  { name: "Coral Index", symbol: "CORAL", glyph: "🪸", ageMinutes: 2 * D + 3 * H, progress: 71.8, volumeU: 22_400, quote: "USDC", description: "A dollar-paired reef of the week's best launches." },
  { name: "Deep Current", symbol: "CURR", ageMinutes: 14 * H, progress: 78.2, volumeU: 31_700 },
  { name: "Sandbar", symbol: "SAND", glyph: "🏝", ageMinutes: 11 * H, progress: 64.5, volumeU: 19_800 },
  { name: "Lighthouse", symbol: "LITE", glyph: "🗼", ageMinutes: 26 * H, progress: 55.1, volumeU: 14_300, description: "Signals for ships lost in the timeline." },
  { name: "Moon Jelly", symbol: "JELLY", glyph: "🪼", ageMinutes: 7 * H, progress: 47.6, volumeU: 17_100 },
  { name: "Salty Dog", symbol: "SALTY", glyph: "🐶", ageMinutes: 5 * H + 20, progress: 38.3, volumeU: 12_900 },
  { name: "Pelican", symbol: "PELI", glyph: "🐦", ageMinutes: 31 * H, progress: 31.2, volumeU: 6_200 },
  { name: "Kelp Forest", symbol: "KELP", glyph: "🌿", ageMinutes: 3 * H + 40, progress: 26.4, volumeU: 8_400 },
  { name: "Paper Boat", symbol: "BOAT", glyph: "⛵", ageMinutes: 2 * H + 15, progress: 22.0, volumeU: 7_350 },
  { name: "Harbor Pass", symbol: "HRBR", ageMinutes: 20 * H, progress: 18.1, volumeU: 2_900, quote: "USDC" },
  { name: "Sunset Sail", symbol: "SAIL", glyph: "🌅", ageMinutes: 95, progress: 15.3, volumeU: 5_100 },
  { name: "Driftwood", symbol: "DRIFT", ageMinutes: 3 * D, progress: 12.2, volumeU: 840 },
  { name: "Seafoam", symbol: "FOAM", glyph: "🫧", ageMinutes: 52, progress: 9.1, volumeU: 3_200 },
  { name: "Anchor Agent", symbol: "ANCHR", glyph: "⚓", ageMinutes: 38, progress: 6.4, volumeU: 2_450, description: "An AI agent that never drifts off-topic." },
  { name: "Starboard", symbol: "STAR", glyph: "⭐", ageMinutes: 27, progress: 4.2, volumeU: 1_380 },
  { name: "Whale Pod", symbol: "POD", glyph: "🐋", ageMinutes: 18, progress: 3.1, volumeU: 1_120 },
  { name: "Gull", symbol: "GULL", ageMinutes: 11, progress: 2.0, volumeU: 610 },
  { name: "Bluefin", symbol: "FIN", glyph: "🐟", ageMinutes: 7, progress: 1.4, volumeU: 330 },
  { name: "Flood Gate", symbol: "FLOOD", ageMinutes: 3, progress: 0.6, volumeU: 95 },
];

/**
 * What a freshly connected wallet holds in the demo: some SOL and stablecoins
 * to buy with, and a few launched tokens to sell.
 */
export const STARTING_BALANCES: { asset: string; amount: number }[] = [
  { asset: "SOL", amount: 25 },
  { asset: "USDC", amount: 1_250 },
  { asset: "USDT", amount: 400 },
  { asset: "WAVE", amount: 1_250_000 },
  { asset: "TCAT", amount: 3_400_000 },
  { asset: "JELLY", amount: 8_000_000 },
];
