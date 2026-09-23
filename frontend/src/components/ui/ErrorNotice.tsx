import { Button } from './Button';

interface ErrorNoticeProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';

  return (
    <div className="rounded-card border border-border bg-danger-50 px-4 py-3">
      <p className="text-sm text-danger-500">{message}</p>
      {onRetry !== undefined && (
        <div className="mt-3">
          <Button variant="secondary" block={false} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
