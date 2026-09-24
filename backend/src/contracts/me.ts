import type { VendorStatus } from './vendors.js';

/**
 * Who the caller is, and what they may do.
 *
 * `vendor` is null until the account registers a farm; the frontend uses it to
 * decide between showing the sell call-to-action and the vendor dashboard.
 *
 * `home` is null for accounts that predate collecting an address. A home
 * address is personal data and appears only here — never on a public shape.
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
  home: {
    municipality: string;
    barangay: string;
    addressDetail: string;
  } | null;
  isAdmin: boolean;
  vendor: { id: string; farmName: string; status: VendorStatus } | null;
}
