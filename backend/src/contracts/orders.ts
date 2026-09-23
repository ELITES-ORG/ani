import type { SellUnit } from './taxonomy.js';
import type { VendorSummary } from './vendors.js';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type FulfillmentMethod = 'pickup' | 'delivery';

export interface OrderLine {
  productId: string;
  productName: string;
  quantityAmount: number;
  unit: SellUnit;
  unitPriceCentavos: number;
  lineTotalCentavos: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  fulfillment: FulfillmentMethod;
  totalCentavos: number;
  itemCount: number;
  vendor: VendorSummary;
  placedAt: string;
}

export interface OrderDetail extends OrderSummary {
  lines: OrderLine[];
  notes: string | null;
  deliveryBarangay: string | null;
  deliveryMunicipality: string | null;
  deliveryLandmark: string | null;
}
