import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { Link } from "react-router";
import { NoahLogo } from "@/components/icons/noah-logo";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/wallet-button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const scrolled = useScrolled();
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* Transparent at the top; frosts once content scrolls underneath. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 transition-colors duration-300",
          scrolled ? "bg-background/60 backdrop-blur-md" : "bg-transparent",
        )}
      />
      <div className="relative mx-auto flex h-16 w-full items-center px-4 lg:px-6 xl:max-w-7xl">
        <Link to="/" aria-label={`${site.name} home`} className="shrink-0">
          <NoahLogo className="h-5 sm:h-7" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="gradient" className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" asChild>
            <Link to="/launch">
              <Rocket className="size-4" />
              Launch token
            </Link>
          </Button>
          <WalletButton className="size-8 px-0 sm:h-9 sm:w-auto sm:px-4 sm:text-sm" />
        </div>
      </div>
    </header>
  );
}

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
