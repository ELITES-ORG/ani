import { WifiOff } from 'lucide-react';
import { Button } from './Button';

interface ErrorNoticeProps {
  error: unknown;
  onRetry?: () => void;
}

/**
 * Errors in plain words, with a way out.
 *
 * `toApiError` has already turned timeouts and dropped connections into
 * sentences a person can act on, so the message is shown as-is. There is no
 * error code on screen: it means nothing to the people using this.
 */
export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong. Please try again.';

  return (
    <div className="page-enter rounded-card border border-danger/20 bg-danger-soft p-4">
      <div className="flex gap-3">
        <WifiOff size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">That did not work</p>
          <p className="mt-1 text-sm text-ink-muted">{message}</p>
          {onRetry !== undefined && (
            <Button variant="secondary" block={false} onClick={onRetry} className="mt-3">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
