import type { VendorStatus } from './vendors.js';

export type AccountApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Who the caller is, and what they may do.
 *
 * `vendor` is null until the account registers a farm; the frontend uses it to
 * decide between showing the sell call-to-action and the vendor dashboard.
 *
 * `approval` says whether an admin has let this account order and sell yet
 * (ADR 0020). `note` is the admin's reason when rejected, and null otherwise.
 *
 * `home` is null for accounts that predate collecting an address. A home
 * address is personal data and appears only here and on the admin-only
 * `PendingAccount` — never on a public shape.
 */
export interface CurrentUser {
  id: string;
  username: string;
  /** Derived display string: first last suffix. Middle is omitted. */
  fullName: string;
  name: {
    first: string;
    middle: string | null;
    last: string;
    suffix: string | null;
  };
  phone: string;
  approval: { status: AccountApprovalStatus; note: string | null };
  home: {
    municipality: string;
    municipalitySlug: string;
    barangay: string;
    barangaySlug: string;
    addressDetail: string;
  } | null;
  isAdmin: boolean;
  vendor: {
    id: string;
    farmName: string;
    status: VendorStatus;
    reviewNote: string | null;
  } | null;
}
