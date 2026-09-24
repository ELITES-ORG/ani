import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Say what will happen in plain words, not "are you sure?". */
  description?: string;
  confirmLabel: string;
  /** Shown on the confirm button while the action is running. */
  confirmLoading?: boolean;
  confirmLoadingLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before anything that cannot be undone by tapping again.
 *
 * Built on <dialog> so the browser supplies the focus trap, Escape handling
 * and inertness of the page behind — all things a hand-rolled modal gets
 * subtly wrong, and which matter most to the people least able to recover.
 *
 * Cancel is listed first and is the wider target. Someone who opened this by
 * accident should find the way out before the way through.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmLoading = false,
  confirmLoadingLabel,
  cancelLabel = 'Keep it',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Escape and the backdrop both mean "no". Never let them mean "yes".
      onCancel={(event) => {
        event.preventDefault();
        // Escape must not abandon a request that is already in flight: the
        // action would still complete, with the UI pretending it had not.
        if (!confirmLoading) onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !confirmLoading) onCancel();
      }}
      className={[
        'm-auto w-[min(22rem,calc(100vw-2rem))] rounded-sheet border border-border',
        'bg-surface p-5 text-ink shadow-dialog backdrop:bg-ink/45',
        'open:animate-rise',
      ].join(' ')}
    >
      <h2 className="text-lg font-bold">{title}</h2>
      {description !== undefined && (
        <p className="mt-1.5 text-base text-ink-muted">{description}</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={confirmLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={confirmLoading}
          {...(confirmLoadingLabel !== undefined && { loadingLabel: confirmLoadingLabel })}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
