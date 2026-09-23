import { pgTable, text, timestamp, uuid, integer, numeric, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { vendors } from './vendors.js';
import { products } from './products.js';
import { barangays, municipalities } from './geography.js';
import { fulfillmentMethod, orderStatus, sellUnit } from './enums.js';

/**
 * An order belongs to exactly one vendor.
 *
 * A basket spanning two farms becomes two orders, because fulfilment,
 * cancellation, and payment all happen per farm. Pretending otherwise gives
 * you an order that is half ready and half not.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'restrict' }),

    status: orderStatus('status').notNull().default('pending'),
    fulfillment: fulfillmentMethod('fulfillment').notNull(),

    deliveryMunicipalityId: uuid('delivery_municipality_id').references(() => municipalities.id),
    deliveryBarangayId: uuid('delivery_barangay_id').references(() => barangays.id),
    deliveryLandmark: text('delivery_landmark'),

    notes: text('notes'),

    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_customer_idx').on(table.customerId, table.placedAt),
    index('orders_vendor_idx').on(table.vendorId, table.placedAt),
  ],
);

/**
 * A line on an order.
 *
 * Name, unit, and price are copied at the moment of ordering rather than
 * joined. A vendor raising a price next week must not rewrite the history of
 * an order already placed.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),

    productName: text('product_name').notNull(),
    quantityAmount: numeric('quantity_amount', {
      precision: 12,
      scale: 3,
      mode: 'number',
    }).notNull(),
    unit: sellUnit('unit').notNull(),
    unitPriceCentavos: integer('unit_price_centavos').notNull(),
    lineTotalCentavos: integer('line_total_centavos').notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);
