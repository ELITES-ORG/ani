import type { ProductCategory, SellUnit } from './taxonomy.js';
import type { VendorSummary } from './vendors.js';

/** A product as it appears in the catalogue. */
export interface ProductCard {
  id: string;
  name: string;
  category: ProductCategory;
  priceCentavos: number;
  unit: SellUnit;
  stockAmount: number;
  imageUrl: string | null;
  vendor: VendorSummary;
}

export interface ProductDetail extends ProductCard {
  description: string;
  imageUrls: string[];
  isListed: boolean;
  harvestedAt: string | null;
}
