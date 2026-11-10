import { useEffect, useRef } from "react";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { DEMO_WALLET_ICON } from "@/mocks/art";
import { CopyButton } from "@/components/tokens/copy-button";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalHeader, modalPanelClass } from "@/components/ui/modal";
import { shortAddress } from "@/lib/format";
import { DEMO_WALLET_NAME, useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

/** Suggested when not installed, so a first-time visitor has somewhere to go. */
const SUGGESTED = [
  { name: "Phantom", href: "https://phantom.app/download" },
  { name: "Solflare", href: "https://solflare.com/download" },
  { name: "Backpack", href: "https://backpack.app/download" },
];

/**
 * Pick a Solana wallet (or the built-in demo wallet) — that's the whole login.
 * Once connected, the dialog shows the wallet with a way to disconnect.
 */
export function ConnectDialog() {
  const {
    wallets,
    wallet,
    account,
    connecting,
    error: walletError,
    connect,
    connectDemo,
    disconnect,
    dialogOpen,
    setDialogOpen,
  } = useWallet();

  const view = !account || !wallet ? "pick" : "account";

  // Close as soon as a connection made from this dialog completes.
  const connectingHere = useRef(false);
  useEffect(() => {
    if (!dialogOpen) {
      connectingHere.current = false;
      return;
    }
    if (view === "pick") connectingHere.current = true;
    else if (connectingHere.current) {
      connectingHere.current = false;
      setDialogOpen(false);
    }
  }, [dialogOpen, view, setDialogOpen]);

  const onOpenChange = (open: boolean) => setDialogOpen(open);

  const installed = new Set(wallets.map((w) => w.name));
  const suggestions = SUGGESTED.filter((s) => !installed.has(s.name));

  return (
    <Modal open={dialogOpen} onOpenChange={onOpenChange} className="max-w-[520px]">
      {view === "pick" && (
        <>
          <ModalHeader
            title="Connect Wallet"
            description={
              wallets.length > 0
                ? "Choose a Solana wallet, or try the demo wallet. Nothing is ever signed or sent — this is a demo."
                : "No Solana wallet was found in this browser. Use the demo wallet to try everything out."
            }
          />
          <ModalBody>
            <ul className="grid grid-cols-3 gap-2">
              <li>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={connectDemo}
                  className="flex w-full flex-col items-center gap-2 rounded-xl p-3 ring-1 ring-tide/25 transition-colors hover:bg-white/8 disabled:opacity-60"
                >
                  <img src={DEMO_WALLET_ICON} alt="" className="size-12 rounded-xl object-contain" />
                  <span className="text-center text-sm leading-tight">
                    <span className="block font-medium text-white">{DEMO_WALLET_NAME}</span>
                    <span className="text-xs text-tide">Funded with test balances</span>
                  </span>
                </button>
              </li>
              {wallets.map((w) => (
                <li key={w.name}>
                  <button
                    type="button"
                    disabled={connecting}
                    onClick={() => void connect(w)}
                    className="flex w-full flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-white/8 disabled:opacity-60"
                  >
                    <img src={w.icon} alt="" className="size-12 rounded-xl object-contain" />
                    <span className="max-w-full truncate text-sm font-medium text-white">{w.name}</span>
                  </button>
                </li>
              ))}
              {suggestions.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-white/8"
                  >
                    <span className="flex size-12 items-center justify-center rounded-xl border border-dashed border-white/15 text-subtle-foreground">
                      <ExternalLink className="size-4" />
                    </span>
                    <span className="text-center text-sm leading-tight">
                      <span className="block font-medium text-white/80">{s.name}</span>
                      <span className="text-xs text-subtle-foreground">Install</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {connecting && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Approve the connection in your wallet…
              </p>
            )}
            {walletError && <p className="text-center text-xs text-destructive">{walletError}</p>}

            <p className="mt-2 text-center text-xs leading-relaxed text-subtle-foreground">
              By connecting a wallet, you agree to Noah's{" "}
              <a href="https://trynoah.ai/document/terms" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              &{" "}
              <a href="https://trynoah.ai/document/privacy" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </ModalBody>
        </>
      )}

      {view === "account" && wallet && account && (
        <>
          <ModalHeader
            title="Your wallet"
            description={
              wallet.demo
                ? "You're using the demo wallet. Its balances are dummy data and reset when you reload."
                : "You're connected to Noah Launchpad with this wallet. Balances shown in the app are demo balances."
            }
          />
          <ModalBody>
            <div className={cn(modalPanelClass, "flex items-center gap-3 px-4 py-3")}>
              <img src={wallet.icon} alt="" className="size-9 rounded-lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{wallet.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{shortAddress(account.address, 6, 6)}</p>
              </div>
              <span className="ml-auto flex items-center gap-1">
                <CopyButton value={account.address} label="Copy address" className="size-8 justify-center" />
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void disconnect();
                setDialogOpen(false);
              }}
            >
              <LogOut className="size-4" /> Disconnect
            </Button>
          </ModalBody>
        </>
      )}
    </Modal>
  );
}
