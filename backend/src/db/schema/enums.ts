import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * A vendor is reviewed before their produce reaches the catalogue.
 *
 * Rejected is "not approved, here is why, fix it"; suspended is "was approved,
 * now paused". Different outcomes with different next steps.
 */
export const vendorStatus = pgEnum('vendor_status', [
  'pending',
  'approved',
  'rejected',
  'suspended',
]);

/** A person is reviewed before they can order or sell. ADR 0020. */
export const accountApprovalStatus = pgEnum('account_approval_status', [
  'pending',
  'approved',
  'rejected',
]);

export const productCategory = pgEnum('product_category', [
  'vegetables',
  'fruits',
  'rice_and_grains',
  'seafood',
  'meat_and_poultry',
  'dairy_and_eggs',
  'herbs_and_spices',
  'processed',
]);

/** How a vendor sells a given product. */
export const sellUnit = pgEnum('sell_unit', [
  'kg',
  'gram',
  'piece',
  'bundle',
  'sack',
  'tray',
  'liter',
]);

export const orderStatus = pgEnum('order_status', [
  'pending',
  'confirmed',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
]);

export const fulfillmentMethod = pgEnum('fulfillment_method', ['pickup', 'delivery']);
