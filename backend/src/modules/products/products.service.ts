import { and, count, desc, eq, gt, ilike, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities, products, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { pesosToCentavos } from '../../lib/money.js';
import type { ProductCard, ProductDetail } from '../../contracts/products.js';
import type { ListMeta } from '../../contracts/pagination.js';

interface ListInput {
  category?: string | undefined;
  municipality?: string | undefined;
  vendorId?: string | undefined;
  search?: string | undefined;
  page: number;
  limit: number;
}

/**
 * The catalogue query.
 *
 * Only listed, in-stock products from approved vendors are returned. A shopper
 * must never be able to add something to a cart that cannot be sold.
 */
export async function listProducts(
  input: ListInput,
): Promise<{ data: ProductCard[]; meta: ListMeta }> {
  const filters = [
    eq(products.isListed, true),
    gt(products.stockAmount, 0),
    eq(vendors.status, 'approved'),
  ];

  if (input.category) {
    filters.push(eq(products.category, input.category as typeof products.category.enumValues[number]));
  }
  if (input.vendorId) {
    filters.push(eq(products.vendorId, input.vendorId));
  }
  if (input.municipality) {
    filters.push(eq(municipalities.slug, input.municipality));
  }
  if (input.search) {
    const term = `%${input.search}%`;
    const match = or(ilike(products.name, term), ilike(products.description, term));
    if (match) filters.push(match);
  }

  const where = and(...filters);

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      priceCentavos: products.priceCentavos,
      unit: products.unit,
      stockAmount: products.stockAmount,
      imageUrls: products.imageUrls,
      vendorId: vendors.id,
      farmName: vendors.farmName,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(input.limit)
    .offset((input.page - 1) * input.limit);

  const [totals] = await db
    .select({ total: count() })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .where(where);

  const data: ProductCard[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    priceCentavos: row.priceCentavos,
    unit: row.unit,
    stockAmount: row.stockAmount,
    imageUrl: row.imageUrls[0] ?? null,
    vendor: {
      id: row.vendorId,
      farmName: row.farmName,
      municipality: row.municipality,
      barangay: row.barangay,
    },
  }));

  const meta: ListMeta = { page: input.page, limit: input.limit, total: totals?.total ?? 0 };
  return { data, meta };
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      category: products.category,
      priceCentavos: products.priceCentavos,
      unit: products.unit,
      stockAmount: products.stockAmount,
      imageUrls: products.imageUrls,
      isListed: products.isListed,
      harvestedAt: products.harvestedAt,
      vendorId: vendors.id,
      farmName: vendors.farmName,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!row) {
    throw AppError.notFound(`No product with id "${id}"`);
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCentavos: row.priceCentavos,
    unit: row.unit,
    stockAmount: row.stockAmount,
    imageUrl: row.imageUrls[0] ?? null,
    imageUrls: row.imageUrls,
    isListed: row.isListed,
    harvestedAt: row.harvestedAt?.toISOString() ?? null,
    vendor: {
      id: row.vendorId,
      farmName: row.farmName,
      municipality: row.municipality,
      barangay: row.barangay,
    },
  };
}

interface CreateInput {
  name: string;
  description: string;
  category: string;
  pricePesos: number;
  stockAmount: number;
  unit: string;
  imageUrls: string[];
  harvestedAt?: Date | undefined;
}

/** MVP 2 — an approved vendor lists produce. */
export async function createProduct(userId: string, input: CreateInput): Promise<ProductDetail> {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });

  if (!vendor) {
    throw AppError.forbidden('Register your farm before listing produce.');
  }
  if (vendor.status !== 'approved') {
    throw AppError.forbidden('Your farm is still awaiting approval.');
  }

  const [created] = await db
    .insert(products)
    .values({
      vendorId: vendor.id,
      name: input.name,
      description: input.description,
      category: input.category as typeof products.category.enumValues[number],
      priceCentavos: pesosToCentavos(input.pricePesos),
      stockAmount: input.stockAmount,
      unit: input.unit as typeof products.unit.enumValues[number],
      imageUrls: input.imageUrls,
      harvestedAt: input.harvestedAt ?? null,
    })
    .returning({ id: products.id });

  if (!created) {
    throw new Error('Insert returned no row');
  }
  return getProduct(created.id);
}

/** The vendor's own listings, including unlisted and sold-out ones. */
export async function listVendorProducts(
  userId: string,
  page: number,
  limit: number,
): Promise<{ data: ProductCard[]; meta: ListMeta }> {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
  if (!vendor) {
    throw AppError.forbidden('Register your farm before managing produce.');
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      priceCentavos: products.priceCentavos,
      unit: products.unit,
      stockAmount: products.stockAmount,
      imageUrls: products.imageUrls,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(eq(products.vendorId, vendor.id))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.vendorId, vendor.id));

  const data: ProductCard[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    priceCentavos: row.priceCentavos,
    unit: row.unit,
    stockAmount: row.stockAmount,
    imageUrl: row.imageUrls[0] ?? null,
    vendor: {
      id: vendor.id,
      farmName: vendor.farmName,
      municipality: row.municipality,
      barangay: row.barangay,
    },
  }));

  return { data, meta: { page, limit, total: totals?.total ?? 0 } };
}
