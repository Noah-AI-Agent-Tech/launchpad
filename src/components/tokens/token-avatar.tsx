import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string;
  name: string;
  className?: string;
};

/** Token image with a lettered fallback when there's none or it won't load. */
export function TokenAvatar({ src, name, className }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const show = src && failed !== src;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-muted-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      {show ? (
        <img key={src} src={src} alt="" loading="lazy" onError={() => setFailed(src)} className="size-full object-cover" />
      ) : (
        <span className="text-sm font-semibold uppercase">{name.trim().charAt(0) || "?"}</span>
      )}
    </div>
  );
}
