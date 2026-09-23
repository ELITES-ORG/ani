export type VendorStatus = 'pending' | 'approved' | 'suspended';

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
