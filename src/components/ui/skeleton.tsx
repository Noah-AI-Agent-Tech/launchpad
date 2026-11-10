import { cn } from "@/lib/utils";

/** Shimmering placeholder block; size it with className. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-foreground/[0.07]", className)}
      {...props}
    />
  );
}
