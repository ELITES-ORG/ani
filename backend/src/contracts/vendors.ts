export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

/** The vendor identity shown beside a product. */
export interface VendorSummary {
  id: string;
  farmName: string;
  municipality: string;
  barangay: string;
}

export interface VendorDetail extends VendorSummary {
  description: string | null;
  landmark: string | null;
  status: VendorStatus;
  registeredAt: string;
}

/**
 * The owner's own farm, as the form to fix it needs it: slugs to prefill
 * the pickers, and the admin's reason when it was rejected.
 */
export type OwnFarm = VendorDetail & {
  municipalitySlug: string;
  barangaySlug: string;
  reviewNote: string | null;
};
