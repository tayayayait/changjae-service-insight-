interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 4 }: SkeletonCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="h-4 animate-pulse rounded bg-slate-100"
            style={{ width: idx === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    </div>
  );
}
