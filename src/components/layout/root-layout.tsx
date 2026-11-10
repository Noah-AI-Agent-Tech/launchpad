import { Outlet } from "react-router";
import heroBg from "@/assets/hero-bg-top.webp";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ConnectDialog } from "@/components/wallet/connect-dialog";

export function RootLayout() {
  return (
    <div className="relative flex min-h-svh flex-col">
      {/* Painted sky behind the top of every page, fading into the background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden sm:h-[680px]"
      >
        <img src={heroBg} alt="" className="size-full object-cover object-[50%_30%]" draggable={false} />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/45 via-55% to-background" />
      </div>

      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <ConnectDialog />
    </div>
  );
}
