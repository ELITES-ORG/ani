import type { AccountApprovalStatus } from './me.js';

export type ReviewDecision = 'approve' | 'reject';

/** A person awaiting review. Personal data: admins only. */
export interface PendingAccount {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string | null;
  home: { municipality: string; barangay: string; addressDetail: string } | null;
  registeredAt: string; // ISO
}

/**
 * A farm awaiting review, with who is behind it. The owner's own account is
 * reviewed first; a farm cannot be approved until it is.
 */
export interface PendingFarm {
  id: string;
  farmName: string;
  description: string | null;
  municipality: string;
  barangay: string;
  landmark: string | null;
  registeredAt: string;
  owner: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    approvalStatus: AccountApprovalStatus;
  };
}

export interface ReviewResult {
  id: string;
  status: 'approved' | 'rejected';
  reviewedAt: string;
}
