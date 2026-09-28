import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/Field';
import type { ReviewDecision, ReviewPayload } from './types';

export interface ReviewTarget {
  kind: 'account' | 'farm';
  decision: ReviewDecision;
  id: string;
  /** The person's full name, or the farm's name. */
  name: string;
}

interface ReviewDialogProps {
  target: ReviewTarget | null;
  loading: boolean;
  onConfirm: (review: ReviewPayload) => void;
  onCancel: () => void;
}

const APPROVE_DESCRIPTION = {
  account: 'They will be able to place orders straight away.',
  farm: 'Their produce will reach buyers as soon as they list it.',
} as const;

const REJECT_DESCRIPTION = {
  account: 'They will see your reason, can fix their details, and send them again.',
  farm: 'The owner will see your reason, can fix the farm details, and send them again.',
} as const;

/**
 * Confirms a review. A rejection carries a reason, typed here.
 *
 * The reason lives in `useState`: the server does not know it until the admin
 * confirms. Mount one per target (a `key`) so a half-typed reason never
 * carries over to the next person.
 */
export function ReviewDialog({ target, loading, onConfirm, onCancel }: ReviewDialogProps) {
  const [note, setNote] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const kind = target?.kind ?? 'account';
  const rejecting = target?.decision === 'reject';

  function confirm() {
    // Enter in the field bypasses the busy confirm button; a second request
    // would come back 409 and report a failure for a review that went through.
    if (loading) return;
    if (!rejecting) {
      onConfirm({ decision: 'approve' });
      return;
    }
    // The confirm button is not a submit button, so ask the browser to run
    // the form's own validation: it blocks, explains, and focuses the field.
    // `required` alone lets a reason of only spaces through.
    const form = formRef.current;
    if (form === null) return;
    form
      .querySelector('input')
      ?.setCustomValidity(
        note.trim().length < 3 ? 'Say what they should fix, so they can fix it.' : '',
      );
    if (!form.reportValidity()) return;
    onConfirm({ decision: 'reject', note: note.trim() });
  }

  return (
    <ConfirmDialog
      open={target !== null}
      title={
        target === null ? '' : rejecting ? `Reject ${target.name}?` : `Approve ${target.name}?`
      }
      description={rejecting ? REJECT_DESCRIPTION[kind] : APPROVE_DESCRIPTION[kind]}
      confirmLabel={rejecting ? 'Reject and send reason' : 'Approve'}
      confirmLoading={loading}
      confirmLoadingLabel={rejecting ? 'Rejecting…' : 'Approving…'}
      cancelLabel="Not yet"
      onConfirm={confirm}
      onCancel={onCancel}
    >
      {rejecting ? (
        <form
          ref={formRef}
          onSubmit={(event) => {
            // Enter in the field means "confirm", never a page navigation.
            event.preventDefault();
            confirm();
          }}
        >
          <TextField
            label="What should they fix?"
            hint="They will see this exactly as you write it."
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              event.target.setCustomValidity('');
            }}
            required
            disabled={loading}
            maxLength={300}
            autoComplete="off"
          />
        </form>
      ) : undefined}
    </ConfirmDialog>
  );
}
