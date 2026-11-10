import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { launchToken, type LaunchInput, type LaunchResult, type LaunchStep } from "@/lib/launch";
import { useWallet } from "@/lib/wallet";

/**
 * Drives a launch from a validated form to a live token.
 *
 * Progress is surfaced as a coarse stage rather than a percentage, so the user
 * can see which step is running.
 */

export type LaunchStage = "idle" | LaunchStep | "done" | "error";

/** How each stage reads in the UI. */
export const STAGE_LABEL: Record<LaunchStage, string> = {
  idle: "",
  uploading: "Uploading artwork and metadata…",
  building: "Preparing the launch…",
  signing: "Signing the launch transaction…",
  confirming: "Confirming on Solana…",
  done: "Launched",
  error: "",
};

export type { LaunchResult };

export function useLaunch() {
  const { account } = useWallet();
  const toast = useToast();

  const [stage, setStage] = useState<LaunchStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  // Abort any in-flight launch when the component unmounts or a retry starts.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStage("idle");
    setError(null);
    setResult(null);
  }, []);

  const launch = useCallback(
    async (input: Omit<LaunchInput, "creator">): Promise<LaunchResult | null> => {
      if (!account) {
        const msg = "Connect a wallet first.";
        setError(msg);
        setStage("error");
        toast({ tone: "error", title: "Can't launch yet", description: msg });
        return null;
      }

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setError(null);
      setResult(null);

      try {
        const launched = await launchToken({ ...input, creator: account.address }, setStage, ctrl.signal);
        setResult(launched);
        setStage("done");
        toast({ tone: "success", title: `$${input.symbol} is live`, description: "Your token is trading on its bonding curve." });
        return launched;
      } catch (e) {
        if (ctrl.signal.aborted) return null;
        const msg = e instanceof Error ? e.message : "Launch failed.";
        setError(msg);
        setStage("error");
        toast({ tone: "error", title: "Launch failed", description: msg, duration: 10_000 });
        return null;
      }
    },
    [account, toast],
  );

  return { launch, reset, stage, error, result, busy: isBusy(stage) };
}

const isBusy = (s: LaunchStage) => s !== "idle" && s !== "done" && s !== "error";
