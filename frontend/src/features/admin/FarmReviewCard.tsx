import { Check, MapPin, Phone, Store, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { daysAgo } from '@/lib/days-ago';
import { formatPhone } from '@/lib/phone';
import type { AccountApprovalStatus } from '@contracts/me';
import type { PendingFarm } from './types';

const OWNER_ACCOUNT: Record<AccountApprovalStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Account not checked yet', tone: 'waiting' },
  approved: { label: 'Account approved', tone: 'active' },
  rejected: { label: 'Account not approved', tone: 'stopped' },
};

interface FarmReviewCardProps {
  farm: PendingFarm;
  onApprove: () => void;
  onReject: () => void;
}

/** One farm waiting for review, and the person behind it. */
export function FarmReviewCard({ farm, onApprove, onReject }: FarmReviewCardProps) {
  const ownerAccount = OWNER_ACCOUNT[farm.owner.approvalStatus];

  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="flex items-center gap-2 text-base font-bold text-ink">
          <Store size={16} className="shrink-0 text-accent-700" aria-hidden />
          {farm.farmName}
        </p>
        <p className="text-sm text-ink-muted">Registered {daysAgo(farm.registeredAt)}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-1 shrink-0 text-ink-muted" aria-hidden />
          <div>
            <p className="text-base text-ink">
              {farm.barangay}, {farm.municipality}
            </p>
            {farm.landmark !== null && (
              <p className="text-sm text-ink-muted">{farm.landmark}</p>
            )}
          </div>
        </div>
        {farm.description !== null && (
          <p className="text-sm text-ink-muted">{farm.description}</p>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="eyebrow">Owner</p>
        <p className="flex items-center gap-2 text-base text-ink">
          <UserRound size={16} className="shrink-0 text-ink-muted" aria-hidden />
          <span>
            {farm.owner.fullName}{' '}
            <span className="text-sm text-ink-muted">@{farm.owner.username}</span>
          </span>
        </p>
        <p className="flex items-center gap-2 text-base text-ink">
          <Phone size={16} className="shrink-0 text-ink-muted" aria-hidden />
          <span className="tnum">{formatPhone(farm.owner.phone)}</span>
        </p>
        <div className="pt-1">
          <StatusPill tone={ownerAccount.tone}>{ownerAccount.label}</StatusPill>
        </div>
        {farm.owner.approvalStatus === 'pending' && (
          <p className="text-sm text-ink-muted">
            Their account is checked first. Approve it under New accounts before this farm.
          </p>
        )}
        {farm.owner.approvalStatus === 'rejected' && (
          <p className="text-sm text-ink-muted">
            Their account was not approved, so this farm cannot be approved yet.
          </p>
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
