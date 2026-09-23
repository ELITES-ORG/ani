export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16" role="status" aria-live="polite">
      {/* Transform-only animation: layout animation stutters on low-end phones. */}
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-leaf-700" />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
