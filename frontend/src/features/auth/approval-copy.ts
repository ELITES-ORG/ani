import type { AccountApprovalStatus } from '@contracts/me';

/** What the person was trying to do when the review stopped them. */
export type ApprovalBlocked = 'order' | 'sell';

export interface ApprovalCopy {
  title: string;
  body: string;
}

/**
 * The words for an account that is not approved yet (ADR 0020).
 *
 * Each says what is true now and what happens next. A rejection reads the
 * same wherever it stops someone: the way forward is always to fix their
 * details, and the admin's reason is shown beside this.
 */
export function approvalCopy(
  status: Exclude<AccountApprovalStatus, 'approved'>,
  blocked: ApprovalBlocked,
): ApprovalCopy {
  if (status === 'rejected') {
    return {
      title: 'Your account was not approved',
      body: 'Fix your details and send them for review again.',
    };
  }
  return {
    title: 'We are checking your account',
    body:
      blocked === 'order'
        ? 'You can place this order once it is approved. Your basket is saved on this phone.'
        : 'Once your account is approved you can register your farm.',
  };
}
