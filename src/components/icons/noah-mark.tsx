import type { CSSProperties } from "react";
import markUrl from "@/assets/noah-mark.png";
import { cn } from "@/lib/utils";

/** Square Noah mark (no wordmark). */
export function NoahMark({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={markUrl}
      alt=""
      aria-hidden
      style={style}
      className={cn("size-5 shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
