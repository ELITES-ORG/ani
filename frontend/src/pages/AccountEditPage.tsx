import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useCurrentUser, useUpdateDetails } from '@/features/auth/api';
import { HomeFields, type HomeValues } from '@/features/auth/HomeFields';
import { NameFields, type NameValues } from '@/features/auth/NameFields';
import type { CurrentUser } from '@/features/auth/types';
import { formatPhone } from '@/lib/phone';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { TextField } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Correct your details while they are being checked, or fix them after a
 * rejection and send them again (ADR 0020).
 *
 * Only while pending or rejected. Once approved, what the admin checked
 * stands, so an approved account is sent back to the Account screen.
 */
export function AccountEditPage() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser();

  if (isPending) return <Spinner label="Checking your account" />;
  if (isError) return <ErrorNotice error={error} onRetry={() => void refetch()} />;

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn size={26} aria-hidden />}
        title="Sign in to change your details"
        description="Your name, where you live, and your mobile number live here."
        action={
          <Link to="/login?next=/account/edit" className="block">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  if (user.approval.status === 'approved') return <Navigate to="/account" replace />;

  return <DetailsForm user={user} />;
}

/**
 * Mounted only once `/me` has loaded, so the draft is seeded from it once.
 * The form holds what the person is typing, not a mirror of the server: a
 * background refetch must never overwrite it.
 */
function DetailsForm({ user }: { user: CurrentUser }) {
  const [name, setName] = useState<NameValues>({
    firstName: user.name.first,
    middleName: user.name.middle ?? '',
    lastName: user.name.last,
    suffix: user.name.suffix ?? '',
  });
  const [home, setHome] = useState<HomeValues>({
    municipalitySlug: user.home?.municipalitySlug ?? '',
    barangaySlug: user.home?.barangaySlug ?? '',
    addressDetail: user.home?.addressDetail ?? '',
  });
  const [phone, setPhone] = useState(formatPhone(user.phone));

  const update = useUpdateDetails();
  const navigate = useNavigate();
  const rejected = user.approval.status === 'rejected';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedMiddle = name.middleName.trim();
        const trimmedSuffix = name.suffix.trim();
        update.mutate(
          {
            firstName: name.firstName.trim(),
            lastName: name.lastName.trim(),
            phone: phone.trim(),
            municipalitySlug: home.municipalitySlug,
            barangaySlug: home.barangaySlug,
            addressDetail: home.addressDetail.trim(),
            ...(trimmedMiddle !== '' && { middleName: trimmedMiddle }),
            ...(trimmedSuffix !== '' && { suffix: trimmedSuffix }),
          },
          { onSuccess: () => void navigate('/account', { replace: true }) },
        );
      }}
      className="space-y-8"
    >
      {rejected ? (
        <div className="rounded-card border border-danger/20 bg-danger-soft p-4">
          <p className="font-semibold text-ink">Why it was not approved</p>
          {user.approval.note !== null && (
            <p className="mt-1 text-base text-ink">“{user.approval.note}”</p>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            Fix what it says, then send your details again. We will check them as soon as we can.
          </p>
        </div>
      ) : (
        <p className="rounded-card bg-accent-50 px-4 py-3 text-base text-accent-900">
          We are still checking your account. You can correct anything here before we do.
        </p>
      )}

      <NameFields value={name} onChange={setName} />

      <section className="space-y-5">
        <h2 className="eyebrow">How to reach you</h2>
        <TextField
          label="Mobile number"
          hint="So the farm can reach you about your order. It is never shown publicly."
          type="tel"
          inputMode="tel"
          placeholder="0917 123 4567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          required
        />
      </section>

      <HomeFields value={home} onChange={setHome} />

      {update.isError && <ErrorNotice error={update.error} />}

      <Button
        type="submit"
        size="lg"
        loading={update.isPending}
        loadingLabel="Sending your details…"
      >
        {rejected ? 'Send for review again' : 'Save'}
      </Button>
    </form>
  );
}
