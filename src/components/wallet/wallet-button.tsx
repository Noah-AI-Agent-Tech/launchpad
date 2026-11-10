import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

/** Header control: "Connect Wallet", or the address once a wallet is connected. */
export function WalletButton({ className }: { className?: string }) {
  const { wallet, account, setDialogOpen } = useWallet();

  if (account && wallet) {
    return (
      <Button variant="wallet" className={cn("font-mono", className)} onClick={() => setDialogOpen(true)}>
        <img src={wallet.icon} alt="" className="size-4 rounded" />
        <span className="hidden sm:inline">{shortAddress(account.address)}</span>
      </Button>
    );
  }

  return (
    <Button variant="wallet" aria-label="Connect Wallet" className={className} onClick={() => setDialogOpen(true)}>
      <Wallet className="size-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
}
