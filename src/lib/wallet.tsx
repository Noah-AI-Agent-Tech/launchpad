import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import type {
  StandardConnectFeature,
  StandardDisconnectFeature,
  StandardEventsFeature,
} from "@wallet-standard/features";
import { DEMO_WALLET_ICON } from "@/mocks/art";
import { fakeAddress, rng } from "@/mocks/rng";

/**
 * Wallet connection for the demo.
 *
 * Two ways in: any Solana wallet installed in the browser (Phantom, Solflare,
 * Backpack…), found through the Wallet Standard, or the built-in demo wallet
 * for visitors without one. Either way the wallet only provides an address —
 * launches and trades run against the demo store, so nothing is ever signed or
 * sent, and no wallet prompt opens after connecting.
 */

const SOLANA_CHAIN = "solana:mainnet";
const LAST_WALLET_KEY = "noah:wallet";

export const DEMO_WALLET_NAME = "Demo wallet";
const DEMO_ADDRESS = fakeAddress(rng("demo-wallet"));

export type ConnectedWallet = { name: string; icon: string; demo: boolean };
export type Account = { address: string };

type Ctx = {
  /** Installed wallets that support Solana. */
  wallets: Wallet[];
  wallet: ConnectedWallet | null;
  account: Account | null;
  connecting: boolean;
  error: string | null;
  connect: (wallet: Wallet) => Promise<void>;
  connectDemo: () => void;
  disconnect: () => Promise<void>;
  /** Open/close the connect dialog from anywhere. */
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

const WalletContext = createContext<Ctx | null>(null);

const isSolana = (w: Wallet) => w.chains.some((c) => c.startsWith("solana:")) && "standard:connect" in w.features;

const connectFeature = (w: Wallet) => (w.features as StandardConnectFeature)["standard:connect"];
const disconnectFeature = (w: Wallet) => (w.features as Partial<StandardDisconnectFeature>)["standard:disconnect"];
const eventsFeature = (w: Wallet) => (w.features as Partial<StandardEventsFeature>)["standard:events"];

function remember(name: string | null) {
  try {
    if (name) localStorage.setItem(LAST_WALLET_KEY, name);
    else localStorage.removeItem(LAST_WALLET_KEY);
  } catch {
    /* storage unavailable */
  }
}

function lastWallet() {
  try {
    return localStorage.getItem(LAST_WALLET_KEY);
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>(() => getWallets().get().filter(isSolana));
  /** The installed wallet behind the connection, if it isn't the demo one. */
  const [standard, setStandard] = useState<Wallet | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(() =>
    lastWallet() === DEMO_WALLET_NAME ? { name: DEMO_WALLET_NAME, icon: DEMO_WALLET_ICON, demo: true } : null,
  );
  const [account, setAccount] = useState<Account | null>(() =>
    lastWallet() === DEMO_WALLET_NAME ? { address: DEMO_ADDRESS } : null,
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Wallets register themselves as their extensions load.
  useEffect(() => {
    const { on, get } = getWallets();
    const sync = () => setWallets(get().filter(isSolana));
    const offRegister = on("register", sync);
    const offUnregister = on("unregister", sync);
    sync();
    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  const adopt = useCallback((w: Wallet, accounts: readonly WalletAccount[]) => {
    const solana = accounts.find((a) => a.chains.includes(SOLANA_CHAIN)) ?? accounts[0] ?? null;
    setStandard(solana ? w : null);
    setWallet(solana ? { name: w.name, icon: w.icon, demo: false } : null);
    setAccount(solana ? { address: solana.address } : null);
    remember(solana ? w.name : null);
  }, []);

  const connect = useCallback(
    async (w: Wallet, silent = false) => {
      setConnecting(true);
      setError(null);
      try {
        const { accounts } = await connectFeature(w).connect(silent ? { silent: true } : undefined);
        adopt(w, accounts);
      } catch (e) {
        if (!silent) setError(e instanceof Error ? e.message : "Couldn't connect wallet");
      } finally {
        setConnecting(false);
      }
    },
    [adopt],
  );

  const connectDemo = useCallback(() => {
    setError(null);
    setStandard(null);
    setWallet({ name: DEMO_WALLET_NAME, icon: DEMO_WALLET_ICON, demo: true });
    setAccount({ address: DEMO_ADDRESS });
    remember(DEMO_WALLET_NAME);
  }, []);

  const disconnect = useCallback(async () => {
    if (standard) {
      try {
        await disconnectFeature(standard)?.disconnect();
      } catch {
        /* wallet may not support it; drop our reference regardless */
      }
    }
    setStandard(null);
    setWallet(null);
    setAccount(null);
    remember(null);
  }, [standard]);

  // Silently resume the last installed wallet once it shows up.
  useEffect(() => {
    if (wallet) return;
    const last = lastWallet();
    const w = last ? wallets.find((x) => x.name === last) : undefined;
    if (w) void connect(w, true);
  }, [wallets, wallet, connect]);

  // Follow account switches / disconnects made inside the wallet.
  useEffect(() => {
    if (!standard) return;
    return eventsFeature(standard)?.on("change", ({ accounts }) => {
      if (accounts) adopt(standard, accounts);
    });
  }, [standard, adopt]);

  const value = useMemo<Ctx>(
    () => ({
      wallets,
      wallet,
      account,
      connecting,
      error,
      connect: (w) => connect(w),
      connectDemo,
      disconnect,
      dialogOpen,
      setDialogOpen,
    }),
    [wallets, wallet, account, connecting, error, connect, connectDemo, disconnect, dialogOpen],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
