import { pgEnum } from 'drizzle-orm/pg-core';

/** A vendor is reviewed before their produce reaches the catalogue. */
export const vendorStatus = pgEnum('vendor_status', ['pending', 'approved', 'suspended']);

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
