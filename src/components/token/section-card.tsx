import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  title: React.ReactNode;
  aside?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

/** Translucent panel shared by every card on the token page. */
export const cardClass =
  "rounded-2xl border border-primary/10 bg-card/55 backdrop-blur-md";

/** Card with a titled header row; optional manual refresh (never polls). */
export function SectionCard({
  title,
  aside,
  onRefresh,
  loading,
  className,
  bodyClassName,
  children,
}: Props) {
  return (
    <section className={cn(cardClass, className)}>
      <header className="flex h-12 items-center gap-3 border-b border-primary/10 px-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="ml-auto flex items-center gap-2 text-xs text-subtle-foreground">
          {aside}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </header>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionEmpty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-24" />
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
