import type { VendorDetail, VendorStatus, VendorSummary } from '@contracts/vendors';
import type { Barangay, Municipality } from '@contracts/taxonomy';

export type { VendorDetail, VendorStatus, VendorSummary, Barangay, Municipality };

export interface RegisterVendorPayload {
  farmName: string;
  description?: string;
  municipalitySlug: string;
  barangaySlug: string;
  landmark?: string;
}
