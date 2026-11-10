import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder matching TokenCard's layout, so the grid doesn't jump. */
export function TokenCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-card/55 p-4 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-2.5 w-16" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>

      <div className="flex items-center gap-3 py-2">
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-3 w-9" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
