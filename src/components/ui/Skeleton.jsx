// Skeleton loaders shaped like the content they stand in for.

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton bg-base-300 ${className}`} />;
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`relative rounded-3xl bg-base-200 overflow-hidden ${className}`} aria-label="Loading">
      <SkeletonBlock className="absolute inset-0 rounded-3xl" />
      <div className="absolute bottom-6 left-5 right-5 flex flex-col gap-3">
        <SkeletonBlock className="h-8 w-2/3 rounded-xl bg-neutral" />
        <SkeletonBlock className="h-4 w-1/2 rounded-lg bg-neutral" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock key={i} className="aspect-[3/4] rounded-3xl" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-1" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <SkeletonBlock className="size-14 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-1/3 rounded-lg" />
            <SkeletonBlock className="h-3 w-2/3 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
