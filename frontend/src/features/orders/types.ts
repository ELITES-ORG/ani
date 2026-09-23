import type {
  FulfillmentMethod,
  OrderDetail,
  OrderLine,
  OrderStatus,
  OrderSummary,
} from '@contracts/orders';

export type { FulfillmentMethod, OrderDetail, OrderLine, OrderStatus, OrderSummary };

/** Wording shown to buyers. The API's enum values are not user-facing copy. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Waiting for the farm',
  confirmed: 'Confirmed',
  ready: 'Ready',
  out_for_delivery: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
