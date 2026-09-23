/**
 * Product feature types. Response shapes live in `@contracts/products`
 * (ADR 0008) — this file only re-exports them so components import from one
 * place per feature.
 */
import type { ProductCard, ProductDetail } from '@contracts/products';
import type { ProductCategory, SellUnit } from '@contracts/taxonomy';

export type { ProductCard, ProductDetail, ProductCategory, SellUnit };

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'rice_and_grains', label: 'Rice & grains' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'meat_and_poultry', label: 'Meat & poultry' },
  { value: 'dairy_and_eggs', label: 'Dairy & eggs' },
  { value: 'herbs_and_spices', label: 'Herbs & spices' },
  { value: 'processed', label: 'Processed' },
];

export const SELL_UNITS: SellUnit[] = ['kg', 'gram', 'piece', 'bundle', 'sack', 'tray', 'liter'];
