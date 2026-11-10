import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

/** Pill-style back link that stays legible over the painted backdrop. */
export function BackLink({ to = "/", children = "Markets" }: { to?: string; children?: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/15 bg-background/50 px-3.5 text-sm font-medium text-foreground backdrop-blur-md transition-colors hover:bg-white hover:text-jet hover:border-white"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}
