import type {
  PendingAccount,
  PendingFarm,
  ReviewDecision,
  ReviewResult,
} from '@contracts/admin';

export type { PendingAccount, PendingFarm, ReviewDecision, ReviewResult };

/** A rejection always carries the reason the person will read. */
export type ReviewPayload = { decision: 'approve' } | { decision: 'reject'; note: string };
