import type { CurrentUser } from './types';

type Vendor = NonNullable<CurrentUser['vendor']>;

/**
 * `CurrentUser` as it may arrive: the review fields are missing when an API
 * from before ADR 0020 answers.
 */
export type CurrentUserResponse = Omit<CurrentUser, 'approval' | 'vendor'> & {
  approval?: CurrentUser['approval'];
  vendor: (Omit<Vendor, 'reviewNote'> & { reviewNote?: string | null }) | null;
};

/**
 * Fills the review fields when an API from before review answers.
 *
 * Merging deploys the PWA in about a minute and the API in several, so for a
 * few minutes the new screens talk to the old API. Without this they read
 * `user.approval.status` from a field that is not there and crash. Reading it
 * as approved is the truth for that window: the old API refuses nobody.
 * Harmless once the new API is live, and removable after the deploy.
 */
export function withReviewDefaults(user: CurrentUserResponse): CurrentUser {
  return {
    ...user,
    approval: user.approval ?? { status: 'approved', note: null },
    vendor: user.vendor === null ? null : { ...user.vendor, reviewNote: user.vendor.reviewNote ?? null },
  };
}
