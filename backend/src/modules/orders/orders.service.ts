import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  barangays,
  municipalities,
  orderItems,
  orders,
  products,
  vendors,
} from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { lineTotal } from '../../lib/money.js';
import type { OrderDetail, OrderStatus, OrderSummary } from '../../contracts/orders.js';
import type { ListMeta } from '../../contracts/pagination.js';

/**
 * Which status transitions are legal.
 *
 * Encoded as data rather than scattered `if` statements so the whole lifecycle
 * is readable in one place, and so an illegal move is impossible to express
 * rather than merely discouraged.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'completed', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export interface PlaceOrderInput {
  items: { productId: string; amount: number }[];
  fulfillment: 'pickup' | 'delivery';
  deliveryMunicipalitySlug?: string | undefined;
  deliveryBarangaySlug?: string | undefined;
  deliveryLandmark?: string | undefined;
  notes?: string | undefined;
}

/**
 * MVP 1 — checkout.
 *
 * Stock reservation and order insertion run inside one transaction. Without
 * it, a failure part-way through decrements stock for an order that was never
 * recorded, and the produce silently disappears from the catalogue.
 */
export async function placeOrder(customerId: string, input: PlaceOrderInput): Promise<OrderDetail> {
  const productIds = input.items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    throw AppError.badRequest('The same product appears twice in one order.');
  }

  const orderId = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, productIds))
      // Locks the rows for the life of the transaction, so two buyers cannot
      // both pass the stock check on the last kilo of the same harvest.
      .for('update');

    if (rows.length !== productIds.length) {
      throw AppError.notFound('One of the products in this order no longer exists.');
    }

    const byId = new Map(rows.map((row) => [row.id, row]));

    // One order belongs to one vendor; a multi-farm basket is split before it
    // reaches this point.
    const vendorIds = new Set(rows.map((row) => row.vendorId));
    if (vendorIds.size > 1) {
      throw AppError.badRequest('An order cannot mix produce from different farms.');
    }

    const vendorId = rows[0]!.vendorId;
    const vendor = await tx.query.vendors.findFirst({ where: eq(vendors.id, vendorId) });
    if (!vendor || vendor.status !== 'approved') {
      throw AppError.conflict('This farm is not currently accepting orders.');
    }

    let deliveryMunicipalityId: string | null = null;
    let deliveryBarangayId: string | null = null;

    if (input.fulfillment === 'delivery') {
      const municipality = await tx.query.municipalities.findFirst({
        where: eq(municipalities.slug, input.deliveryMunicipalitySlug!),
      });
      if (!municipality) {
        throw AppError.badRequest(`Unknown municipality "${input.deliveryMunicipalitySlug}"`);
      }
      const barangay = await tx.query.barangays.findFirst({
        where: and(
          eq(barangays.slug, input.deliveryBarangaySlug!),
          eq(barangays.municipalityId, municipality.id),
        ),
      });
      if (!barangay) {
        throw AppError.badRequest(
          `Barangay "${input.deliveryBarangaySlug}" is not in ${municipality.name}`,
        );
      }
      deliveryMunicipalityId = municipality.id;
      deliveryBarangayId = barangay.id;
    }

    const [created] = await tx
      .insert(orders)
      .values({
        customerId,
        vendorId,
        fulfillment: input.fulfillment,
        deliveryMunicipalityId,
        deliveryBarangayId,
        deliveryLandmark: input.deliveryLandmark ?? null,
        notes: input.notes ?? null,
      })
      .returning({ id: orders.id });

    if (!created) {
      throw new Error('Insert returned no row');
    }

    for (const item of input.items) {
      const product = byId.get(item.productId)!;

      if (!product.isListed) {
        throw AppError.conflict(`"${product.name}" is no longer for sale.`);
      }
      if (product.stockAmount < item.amount) {
        throw AppError.conflict(
          `"${product.name}" only has ${product.stockAmount} ${product.unit} left.`,
        );
      }

      await tx
        .update(products)
        .set({ stockAmount: product.stockAmount - item.amount, updatedAt: new Date() })
        .where(eq(products.id, product.id));

      await tx.insert(orderItems).values({
        orderId: created.id,
        productId: product.id,
        // Copied, not joined: a later price change must not rewrite history.
        productName: product.name,
        quantityAmount: item.amount,
        unit: product.unit,
        unitPriceCentavos: product.priceCentavos,
        lineTotalCentavos: lineTotal(product.priceCentavos, item.amount),
      });
    }

    return created.id;
  });

  return getOrder(orderId);
}

export async function getOrder(id: string): Promise<OrderDetail> {
  const [row] = await db
    .select({
      id: orders.id,
      status: orders.status,
      fulfillment: orders.fulfillment,
      notes: orders.notes,
      deliveryLandmark: orders.deliveryLandmark,
      placedAt: orders.placedAt,
      vendorId: vendors.id,
      farmName: vendors.farmName,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) {
    throw AppError.notFound(`No order with id "${id}"`);
  }

  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  const delivery = await deliveryNames(id);

  return {
    id: row.id,
    status: row.status,
    fulfillment: row.fulfillment,
    totalCentavos: lines.reduce((sum, line) => sum + line.lineTotalCentavos, 0),
    itemCount: lines.length,
    vendor: {
      id: row.vendorId,
      farmName: row.farmName,
      municipality: row.municipality,
      barangay: row.barangay,
    },
    placedAt: row.placedAt.toISOString(),
    lines: lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantityAmount: line.quantityAmount,
      unit: line.unit,
      unitPriceCentavos: line.unitPriceCentavos,
      lineTotalCentavos: line.lineTotalCentavos,
    })),
    notes: row.notes,
    deliveryBarangay: delivery.barangay,
    deliveryMunicipality: delivery.municipality,
    deliveryLandmark: row.deliveryLandmark,
  };
}

async function deliveryNames(
  orderId: string,
): Promise<{ barangay: string | null; municipality: string | null }> {
  const [row] = await db
    .select({ barangay: barangays.name, municipality: municipalities.name })
    .from(orders)
    .innerJoin(barangays, eq(orders.deliveryBarangayId, barangays.id))
    .innerJoin(municipalities, eq(orders.deliveryMunicipalityId, municipalities.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  return { barangay: row?.barangay ?? null, municipality: row?.municipality ?? null };
}

/**
 * Loads an order only if the caller is one of its two parties.
 *
 * Authorisation belongs here rather than in the route: the route should not
 * need a second query, and "who may see this order" is a rule about orders.
 */
export async function getOrderForUser(userId: string, orderId: string): Promise<OrderDetail> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) {
    throw AppError.notFound(`No order with id "${orderId}"`);
  }

  if (order.customerId !== userId) {
    const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, order.vendorId) });
    if (vendor?.userId !== userId) {
      // Not found rather than forbidden: confirming an order exists tells a
      // stranger something about someone else's business.
      throw AppError.notFound(`No order with id "${orderId}"`);
    }
  }

  return getOrder(orderId);
}

type OrderSide = 'customer' | 'vendor';

/** MVP 1 for the customer side, MVP 2 for the vendor's incoming queue. */
export async function listOrders(
  userId: string,
  side: OrderSide,
  status: OrderStatus | undefined,
  page: number,
  limit: number,
): Promise<{ data: OrderSummary[]; meta: ListMeta }> {
  const filters = [];

  if (side === 'customer') {
    filters.push(eq(orders.customerId, userId));
  } else {
    const vendor = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
    if (!vendor) {
      throw AppError.forbidden('Only registered farms receive orders.');
    }
    filters.push(eq(orders.vendorId, vendor.id));
  }

  if (status) {
    filters.push(eq(orders.status, status));
  }
  const where = and(...filters);

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      fulfillment: orders.fulfillment,
      placedAt: orders.placedAt,
      vendorId: vendors.id,
      farmName: vendors.farmName,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(where)
    .orderBy(desc(orders.placedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db.select({ total: count() }).from(orders).where(where);

  // One query for every line on the page, rather than one per order.
  const ids = rows.map((row) => row.id);
  const lines =
    ids.length === 0 ? [] : await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));

  const totalsByOrder = new Map<string, { total: number; items: number }>();
  for (const line of lines) {
    const current = totalsByOrder.get(line.orderId) ?? { total: 0, items: 0 };
    totalsByOrder.set(line.orderId, {
      total: current.total + line.lineTotalCentavos,
      items: current.items + 1,
    });
  }

  const data: OrderSummary[] = rows.map((row) => {
    const summed = totalsByOrder.get(row.id) ?? { total: 0, items: 0 };
    return {
      id: row.id,
      status: row.status,
      fulfillment: row.fulfillment,
      totalCentavos: summed.total,
      itemCount: summed.items,
      vendor: {
        id: row.vendorId,
        farmName: row.farmName,
        municipality: row.municipality,
        barangay: row.barangay,
      },
      placedAt: row.placedAt.toISOString(),
    };
  });

  return { data, meta: { page, limit, total: totals?.total ?? 0 } };
}

/**
 * Moves an order along its lifecycle.
 *
 * The vendor drives fulfilment; the customer may only cancel, and only while
 * the farm has not started preparing.
 */
export async function updateOrderStatus(
  userId: string,
  orderId: string,
  next: OrderStatus,
): Promise<OrderDetail> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) {
    throw AppError.notFound(`No order with id "${orderId}"`);
  }

  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, order.vendorId) });
  const isVendor = vendor?.userId === userId;
  const isCustomer = order.customerId === userId;

  if (!isVendor && !isCustomer) {
    throw AppError.forbidden();
  }
  if (isCustomer && !isVendor && next !== 'cancelled') {
    throw AppError.forbidden('Only the farm can move an order forward.');
  }

  if (!ALLOWED_TRANSITIONS[order.status].includes(next)) {
    throw AppError.conflict(`An order cannot move from "${order.status}" to "${next}".`);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Cancelling returns the reserved stock to the catalogue.
    if (next === 'cancelled') {
      const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const line of lines) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, line.productId),
        });
        if (product) {
          await tx
            .update(products)
            .set({ stockAmount: product.stockAmount + line.quantityAmount, updatedAt: new Date() })
            .where(eq(products.id, product.id));
        }
      }
    }
  });

  return getOrder(orderId);
}
