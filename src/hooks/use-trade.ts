import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useStoreVersion } from "@/hooks/use-store-version";
import type { LaunchToken } from "@/lib/tokens";
import {
  COUNTER_ASSETS,
  executeSwap,
  fetchHoldings,
  quoteSwap,
  toRaw,
  WSOL_MINT,
  type Holding,
  type SwapQuote,
} from "@/lib/trade";
import { useWallet } from "@/lib/wallet";

export type Side = "buy" | "sell";

export type TradeAsset = {
  mint: string;
  symbol: string;
  decimals: number;
  logo?: string;
  usdPrice?: number;
};

const fmtAmount = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 2 : n >= 1 ? 4 : 6 });

export type TradeResult = {
  signature: string;
  side: Side;
  /** What left the wallet. */
  paid: { amount: number; symbol: string; logo?: string };
  /** What arrived. */
  received: { amount: number; minimum: number; symbol: string; logo?: string };
};

export type TradeStage = "idle" | "preparing" | "signing" | "confirming" | "done" | "error";

/**
 * State for the token page's buy/sell card: the wallet's balances, a live
 * quote for what's typed, and the trade itself. Buys can be paid in SOL, USDC
 * or USDT; sells spend the launched token into any of them.
 */
export function useTrade(token: LaunchToken) {
  const { account } = useWallet();
  const toast = useToast();
  const owner = account?.address ?? null;
  const version = useStoreVersion();

  const base: TradeAsset = useMemo(
    () => ({ mint: token.mint, symbol: token.symbol, decimals: token.decimals, logo: token.imgUrl }),
    [token.mint, token.symbol, token.decimals, token.imgUrl],
  );

  /** Everything that can pay for a buy, or be received from a sell. */
  const counterAssets: TradeAsset[] = useMemo(
    () => COUNTER_ASSETS.map((a) => ({ mint: a.address, symbol: a.symbol, decimals: a.decimals, logo: a.logoURI, usdPrice: a.usdPrice })),
    [],
  );

  /* ------------------------------- balances ------------------------------- */

  const [holdings, setHoldings] = useState<Map<string, Holding> | null>(null);
  const [holdingsTick, setHoldingsTick] = useState(0);
  const refreshHoldings = useCallback(() => setHoldingsTick((t) => t + 1), []);

  useEffect(() => {
    if (!owner) {
      setHoldings(null);
      return;
    }
    const ctrl = new AbortController();
    fetchHoldings(owner, ctrl.signal)
      .then(setHoldings)
      .catch(() => !ctrl.signal.aborted && setHoldings(new Map()));
    return () => ctrl.abort();
  }, [owner, holdingsTick, version]);

  const balanceOf = useCallback((mint: string) => holdings?.get(mint) ?? null, [holdings]);

  /* --------------------------------- form --------------------------------- */

  const [side, setSideState] = useState<Side>("buy");
  const [counterMint, setCounterMint] = useState(WSOL_MINT);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(100);

  const setSide = (s: Side) => {
    setSideState(s);
    setAmount("");
    setStage("idle");
    setError(null);
  };

  const counter = counterAssets.find((a) => a.mint === counterMint) ?? counterAssets[0];
  const input = side === "buy" ? counter : base;
  const output = side === "buy" ? base : counter;
  const inputBalance = balanceOf(input.mint);
  const amountRaw = toRaw(amount, input.decimals);
  const insufficient = Boolean(holdings) && amountRaw !== "0" && BigInt(amountRaw) > (inputBalance?.raw ?? 0n);

  /* --------------------------------- quote -------------------------------- */

  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (amountRaw === "0") {
      setQuoting(false);
      return;
    }
    setQuoting(true);
    const ctrl = new AbortController();
    // Typed amounts settle before pricing — one quote per pause, not per key.
    const t = setTimeout(() => {
      quoteSwap({ inputMint: input.mint, outputMint: output.mint, amountRaw, slippageBps }, ctrl.signal)
        .then(setQuote)
        .catch((e: unknown) => !ctrl.signal.aborted && setQuoteError(e instanceof Error ? e.message : "Couldn't price the trade."))
        .finally(() => !ctrl.signal.aborted && setQuoting(false));
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [input.mint, output.mint, amountRaw, slippageBps, version]);

  /* --------------------------------- trade -------------------------------- */

  const [stage, setStage] = useState<TradeStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TradeResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const execute = useCallback(async () => {
    if (!owner || amountRaw === "0") return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setError(null);
    setResult(null);

    try {
      setStage("preparing");
      // Price again at the moment of trading: the one on screen may be seconds old.
      const args = { inputMint: input.mint, outputMint: output.mint, amountRaw, slippageBps };
      const fresh = await quoteSwap(args, ctrl.signal);

      setStage("signing");
      const { signature, graduated } = await executeSwap(owner, args, () => setStage("confirming"), ctrl.signal);

      const r: TradeResult = {
        signature,
        side,
        paid: { amount: Number(fresh.data.inputAmount) / 10 ** input.decimals, symbol: input.symbol, logo: input.logo },
        received: {
          amount: Number(fresh.data.outputAmount) / 10 ** output.decimals,
          minimum: Number(fresh.data.otherAmountThreshold) / 10 ** output.decimals,
          symbol: output.symbol,
          logo: output.logo,
        },
      };
      setResult(r);
      setStage("done");
      toast({
        tone: "success",
        title: r.side === "buy" ? `Bought ${r.received.symbol}` : `Sold ${r.paid.symbol}`,
        description: `${fmtAmount(r.paid.amount)} ${r.paid.symbol} → ${fmtAmount(r.received.amount)} ${r.received.symbol}`,
      });
      if (graduated) {
        toast({
          tone: "success",
          title: `${base.symbol} graduated`,
          description: "That trade completed the curve. It now trades against its AMM pool.",
        });
      }
      setAmount("");
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const msg = e instanceof Error ? e.message : "Trade failed.";
      setError(msg);
      setStage("error");
      toast({ tone: "error", title: side === "buy" ? `Couldn't buy ${base.symbol}` : `Couldn't sell ${base.symbol}`, description: msg, duration: 10_000 });
    }
  }, [owner, amountRaw, input, output, slippageBps, side, toast, base.symbol]);

  return {
    side,
    setSide,
    base,
    counter,
    counterAssets,
    payOptions: counterAssets,
    setCounterMint,
    input,
    output,
    amount,
    setAmount,
    slippageBps,
    setSlippageBps,
    holdings,
    balanceOf,
    inputBalance,
    insufficient,
    quote,
    quoting,
    quoteError,
    stage,
    error,
    result,
    busy: stage === "preparing" || stage === "signing" || stage === "confirming",
    execute,
    refreshHoldings,
  };
}
