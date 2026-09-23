import { Loader2 } from 'lucide-react';

/**
 * Always give it a label that names what is loading.
 *
 * "Loading produce" tells someone the app is working and on what. A bare
 * spinner tells them nothing, and on a slow connection that is the moment
 * people decide the app is broken.
 */
export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16" role="status" aria-live="polite">
      <Loader2 size={26} className="spin text-accent-600" aria-hidden />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
