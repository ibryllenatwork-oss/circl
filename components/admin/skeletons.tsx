import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:shadow-none" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-5 h-9 w-full max-w-md" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-card p-5 shadow-card dark:shadow-none">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-14" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-6 shadow-card dark:shadow-none">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-9" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
