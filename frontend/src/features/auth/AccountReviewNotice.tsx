import { Link } from 'react-router-dom';
import { CircleAlert, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from './api';
import { approvalCopy, type ApprovalBlocked } from './approval-copy';
import type { CurrentUser } from './types';

interface AccountReviewNoticeProps {
  approval: CurrentUser['approval'];
  blocked: ApprovalBlocked;
}

const PANEL = {
  pending: 'border-warn/20 bg-warn-soft',
  rejected: 'border-danger/20 bg-danger-soft',
} as const;

const ICON = {
  pending: 'text-warn',
  rejected: 'text-danger',
} as const;

/**
 * Stands in for an action the account cannot take until it is approved
 * (ADR 0020). A panel, not an error: nothing went wrong.
 *
 * Pending offers "Check again" because nothing refetches `/me` on its own:
 * focus refetching is off to save metered data, so someone approved while
 * looking at this would otherwise see no change. One request, only when
 * tapped.
 */
export function AccountReviewNotice({ approval, blocked }: AccountReviewNoticeProps) {
  const { refetch, isFetching } = useCurrentUser();

  if (approval.status === 'approved') return null;

  const status = approval.status;
  const copy = approvalCopy(status, blocked);
  const Icon = status === 'rejected' ? CircleAlert : Clock;

  return (
    <div className={cn('page-enter rounded-card border p-4', PANEL[status])}>
      <div className="flex gap-3">
        <Icon size={20} className={cn('mt-0.5 shrink-0', ICON[status])} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{copy.title}</p>
          {status === 'rejected' && approval.note !== null && (
            <p className="mt-1 text-base text-ink">“{approval.note}”</p>
          )}
          <p className="mt-1 text-sm text-ink-muted">{copy.body}</p>
        </div>
      </div>

      {status === 'rejected' ? (
        <Link to="/account/edit" className="mt-4 block">
          <Button>Fix my details</Button>
        </Link>
      ) : (
        <Button
          variant="quiet"
          className="mt-3"
          loading={isFetching}
          loadingLabel="Checking…"
          onClick={() => void refetch()}
        >
          Check again
        </Button>
      )}
    </div>
  );
}
