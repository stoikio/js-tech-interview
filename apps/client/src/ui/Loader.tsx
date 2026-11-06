export function Loader({ className = 'size-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`border-blue-1 border-t-blue inline-block animate-spin rounded-full border-2 ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-24">
      <Loader className="size-7" />
    </div>
  );
}
