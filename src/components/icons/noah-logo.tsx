import logoUrl from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/** Full logo (mark + wordmark, baked into the image). */
export function NoahLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt={site.name}
      className={cn("h-7 w-auto shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
