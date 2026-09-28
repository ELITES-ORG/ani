import { Check, MapPin, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { daysAgo } from '@/lib/days-ago';
import { formatPhone } from '@/lib/phone';
import type { PendingAccount } from './types';

interface AccountReviewCardProps {
  account: PendingAccount;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * One person waiting for review: who they say they are, and where.
 *
 * Reject is secondary, not danger. A rejection is a correction the person can
 * act on, not a deletion.
 */
export function AccountReviewCard({ account, onApprove, onReject }: AccountReviewCardProps) {
  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-base font-bold text-ink">{account.fullName}</p>
        <p className="text-sm text-ink-muted">
          @{account.username} · Signed up {daysAgo(account.registeredAt)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-base text-ink">
          <Phone size={16} className="shrink-0 text-ink-muted" aria-hidden />
          <span className="tnum">{formatPhone(account.phone)}</span>
        </p>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-1 shrink-0 text-ink-muted" aria-hidden />
          {account.home === null ? (
            <p className="text-base text-ink-muted">No home address given</p>
          ) : (
            <div>
              <p className="text-base text-ink">{account.home.addressDetail}</p>
              <p className="text-sm text-ink-muted">
                {account.home.barangay}, {account.home.municipality}
              </p>
            </div>
          )}
        </div>
        {account.email !== null && (
          <p className="break-all text-sm text-ink-muted">{account.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button icon={<Check size={18} aria-hidden />} onClick={onApprove}>
          Approve
        </Button>
        <Button variant="secondary" icon={<X size={18} aria-hidden />} onClick={onReject}>
          Reject
        </Button>
      </div>
    </Card>
  );
}
