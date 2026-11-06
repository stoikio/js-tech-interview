export function Skeleton({ className }: { className: string }) {
  return <div aria-hidden className={`bg-gray-1 animate-pulse rounded-sm ${className}`} />;
}

/** Placeholder rows shaped like the table they stand in for. */
export function TableSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="border-gray-2 rounded-md border bg-white">
      <div className="border-gray-1 h-[41px] border-b" />
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="border-gray-1 flex h-12 items-center gap-6 border-b px-3 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={`h-3 ${column === 0 ? 'w-48' : 'w-20'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
