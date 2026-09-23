import type { VendorStatus } from './vendors.js';

/**
 * Who the caller is, and what they may do.
 *
 * `vendor` is null until the account registers a farm; the frontend uses it to
 * decide between showing the sell call-to-action and the vendor dashboard.
 */
export interface CurrentUser {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  isAdmin: boolean;
  vendor: { id: string; farmName: string; status: VendorStatus } | null;
}
