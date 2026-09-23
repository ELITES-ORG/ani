import { cn } from '@/lib/cn';

/**
 * A grey block where content will be.
 *
 * Opacity pulse rather than a moving gradient: a sweeping highlight repaints
 * a large area every frame, which is exactly the kind of thing that stutters
 * on the hardware this runs on.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse-soft rounded-control bg-sunken', className)} />;
}

/** Placeholder rows shaped like the product list, so the layout does not jump. */
export function ProductListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-card border border-border bg-surface p-3">
          <Skeleton className="size-20 shrink-0 rounded-card" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
