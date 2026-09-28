import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleUser, ClipboardCheck, LogIn, Store } from 'lucide-react';
import { useCurrentUser, useLogout } from '@/features/auth/api';
import { usePendingAccounts, usePendingFarms } from '@/features/admin/api';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { formatPhone } from '@/lib/phone';
import type { AccountApprovalStatus } from '@contracts/me';
import type { VendorStatus } from '@contracts/vendors';

const FARM_STATUS: Record<VendorStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Waiting for review', tone: 'waiting' },
  approved: { label: 'Approved', tone: 'active' },
  rejected: { label: 'Not approved', tone: 'stopped' },
  suspended: { label: 'Paused', tone: 'stopped' },
};

const ACCOUNT_STATUS: Record<AccountApprovalStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Being checked', tone: 'waiting' },
  approved: { label: 'Approved', tone: 'active' },
  rejected: { label: 'Not approved', tone: 'stopped' },
};

/**
 * Who you are signed in as, and the way out.
 *
 * Not a fifth tab — ADR 0013 leaves no room. Reached from the header account
 * button on the four tab screens.
 */
export function AccountPage() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // Only an admin fetches the queues; everyone else never sees the button.
  const isAdmin = user?.isAdmin === true;
  const pendingAccounts = usePendingAccounts(isAdmin);
  const pendingFarms = usePendingFarms(isAdmin);
  const waiting =
    (pendingAccounts.data?.meta.total ?? 0) + (pendingFarms.data?.meta.total ?? 0);

  if (isPending) return <Spinner label="Checking your account" />;
  if (isError) return <ErrorNotice error={error} onRetry={() => void refetch()} />;

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn size={26} aria-hidden />}
        title="Sign in to see your account"
        description="Your name, how you sign in, and a way to sign out live here."
        action={
          <Link to="/login?next=/account" className="block">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  const farm = user.vendor;
  const farmStatus = farm !== null ? FARM_STATUS[farm.status] : null;
  const accountStatus = ACCOUNT_STATUS[user.approval.status];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
          <CircleUser size={28} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold text-ink">{user.fullName}</p>
          <p className="mt-0.5 truncate text-base text-ink-muted">@{user.username}</p>
        </div>
      </div>

      <dl className="space-y-4 rounded-card border border-border bg-surface p-4">
        <div>
          <dt className="eyebrow">Account</dt>
          <dd className="mt-1.5 space-y-1.5">
            <StatusPill tone={accountStatus.tone}>{accountStatus.label}</StatusPill>
            {user.approval.status === 'rejected' && user.approval.note !== null && (
              <p className="text-base text-ink">“{user.approval.note}”</p>
            )}
            {user.approval.status !== 'approved' && (
              <Link
                to="/account/edit"
                className="flex min-h-12 items-center font-bold text-accent-700 underline decoration-accent-400 decoration-2 underline-offset-4"
              >
                {user.approval.status === 'rejected' ? 'Fix my details' : 'Change my details'}
              </Link>
            )}
          </dd>
        </div>

        <div className="border-t border-border pt-4">
          <dt className="eyebrow">Mobile number</dt>
          <dd className="tnum mt-1 text-base font-semibold text-ink">{formatPhone(user.phone)}</dd>
        </div>

        <div className="border-t border-border pt-4">
          <dt className="eyebrow">Where you live</dt>
          <dd className="mt-1.5">
            {user.home === null ? (
              <p className="text-base text-ink-muted">Not added yet</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-ink">{user.home.addressDetail}</p>
                <p className="text-base text-ink-muted">
                  {user.home.barangay}, {user.home.municipality}
                </p>
              </div>
            )}
          </dd>
        </div>

        <div className="border-t border-border pt-4">
          <dt className="eyebrow flex items-center gap-1.5">
            <Store size={13} aria-hidden />
            Farm
          </dt>
          <dd className="mt-1.5">
            {farm === null || farmStatus === null ? (
              <p className="text-base text-ink-muted">No farm registered yet.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-ink">{farm.farmName}</p>
                <StatusPill tone={farmStatus.tone}>{farmStatus.label}</StatusPill>
              </div>
            )}
          </dd>
        </div>
      </dl>

      {/*
        A failed sign-out has to say so. The API sleeps after fifteen minutes
        on the free tier and can take most of a minute to wake, so "nothing
        happened" is a real outcome here, not a hypothetical one.
      */}
      {logout.isError && <ErrorNotice error={logout.error} />}

      {isAdmin && (
        <Link to="/admin" className="block">
          <Button variant="secondary" icon={<ClipboardCheck size={18} aria-hidden />}>
            {waiting > 0 ? `Review sign-ups · ${waiting}` : 'Review sign-ups'}
          </Button>
        </Link>
      )}

      <Button variant="danger" onClick={() => setConfirmingLogout(true)}>
        Sign out
      </Button>

      <ConfirmDialog
        open={confirmingLogout}
        title="Sign out?"
        description="Your basket stays on this phone. Nothing in it is removed."
        confirmLabel="Sign out"
        confirmLoading={logout.isPending}
        confirmLoadingLabel="Signing you out…"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={() => {
          logout.mutate(undefined, {
            onSuccess: () => {
              setConfirmingLogout(false);
              void navigate('/', { replace: true });
            },
            // Close the dialog so the error underneath it is readable.
            onError: () => setConfirmingLogout(false),
          });
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  );
}
