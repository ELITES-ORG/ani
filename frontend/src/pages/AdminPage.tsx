import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api';
import {
  usePendingAccounts,
  usePendingFarms,
  useReviewAccount,
  useReviewFarm,
} from '@/features/admin/api';
import { AccountReviewCard } from '@/features/admin/AccountReviewCard';
import { FarmReviewCard } from '@/features/admin/FarmReviewCard';
import { ReviewDialog, type ReviewTarget } from '@/features/admin/ReviewDialog';
import type { ReviewPayload } from '@/features/admin/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Spinner } from '@/components/ui/Spinner';
import { NotFoundPage } from '@/pages/NotFoundPage';

interface QueueSectionProps<T> {
  title: string;
  loadingLabel: string;
  emptyDescription: string;
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    data: { data: T[]; meta: { total: number } } | undefined;
    refetch: () => unknown;
  };
  renderItem: (item: T) => ReactNode;
}

/** One queue, in all four states. The count is the whole queue, not this page. */
function QueueSection<T>({
  title,
  loadingLabel,
  emptyDescription,
  query,
  renderItem,
}: QueueSectionProps<T>) {
  const total = query.data?.meta.total;

  return (
    <section>
      <h2 className="text-lg font-bold text-ink">
        {title}
        {total !== undefined && <span className="tnum text-ink-muted"> · {total}</span>}
      </h2>

      <div className="mt-3">
        {query.isPending ? (
          <Spinner label={loadingLabel} />
        ) : query.isError ? (
          <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data === undefined || query.data.data.length === 0 ? (
          <div className="rounded-card border border-border bg-surface">
            <EmptyState
              title="Nobody is waiting"
              description={emptyDescription}
              action={
                <Button variant="secondary" onClick={() => void query.refetch()}>
                  Check again
                </Button>
              }
            />
          </div>
        ) : (
          <div className="stagger space-y-3">{query.data.data.map(renderItem)}</div>
        )}
      </div>
    </section>
  );
}

/**
 * The approval queue: new accounts and new farms, oldest first (ADR 0020).
 *
 * Reached from the Account screen, not a tab (ADR 0013). The API is the real
 * guard; this only avoids showing a non-admin a screen that would answer 403.
 */
export function AdminPage() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser();
  const isAdmin = user?.isAdmin === true;

  const accounts = usePendingAccounts(isAdmin);
  const farms = usePendingFarms(isAdmin);
  const reviewAccount = useReviewAccount();
  const reviewFarm = useReviewFarm();

  const [target, setTarget] = useState<ReviewTarget | null>(null);

  if (isPending) return <Spinner label="Checking your account" />;
  if (isError) return <ErrorNotice error={error} onRetry={() => void refetch()} />;

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn size={26} aria-hidden />}
        title="Sign in to see your account"
        description="Your name, how you sign in, and a way to sign out live here."
        action={
          <Link to="/login?next=/admin" className="block">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  if (!isAdmin) return <NotFoundPage />;

  const mutation = target?.kind === 'farm' ? reviewFarm : reviewAccount;
  const failed = reviewAccount.isError
    ? reviewAccount.error
    : reviewFarm.isError
      ? reviewFarm.error
      : null;

  function open(next: ReviewTarget) {
    reviewAccount.reset();
    reviewFarm.reset();
    setTarget(next);
  }

  function confirm(review: ReviewPayload) {
    if (target === null) return;
    mutation.mutate(
      { id: target.id, review },
      // Close either way: on failure, the notice underneath says why.
      { onSettled: () => setTarget(null) },
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-base text-ink-muted">
        Oldest first. Approve people and farms you can identify. If something is wrong, reject
        it and say what to fix — they will see your words.
      </p>

      {failed !== null && <ErrorNotice error={failed} />}

      <QueueSection
        title="New accounts"
        loadingLabel="Loading new accounts"
        emptyDescription="New accounts appear here as people sign up."
        query={accounts}
        renderItem={(account) => (
          <AccountReviewCard
            key={account.id}
            account={account}
            onApprove={() =>
              open({ kind: 'account', decision: 'approve', id: account.id, name: account.fullName })
            }
            onReject={() =>
              open({ kind: 'account', decision: 'reject', id: account.id, name: account.fullName })
            }
          />
        )}
      />

      <QueueSection
        title="New farms"
        loadingLabel="Loading new farms"
        emptyDescription="New farms appear here when someone registers one."
        query={farms}
        renderItem={(farm) => (
          <FarmReviewCard
            key={farm.id}
            farm={farm}
            onApprove={() =>
              open({ kind: 'farm', decision: 'approve', id: farm.id, name: farm.farmName })
            }
            onReject={() =>
              open({ kind: 'farm', decision: 'reject', id: farm.id, name: farm.farmName })
            }
          />
        )}
      />

      <ReviewDialog
        key={target === null ? 'closed' : `${target.kind}-${target.id}-${target.decision}`}
        target={target}
        loading={mutation.isPending}
        onConfirm={confirm}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
