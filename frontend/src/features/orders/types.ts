import type {
  FulfillmentMethod,
  OrderDetail,
  OrderLine,
  OrderStatus,
  OrderSummary,
} from '@contracts/orders';
import type { StatusTone } from '@/components/ui/StatusPill';

export type { FulfillmentMethod, OrderDetail, OrderLine, OrderStatus, OrderSummary };

/**
 * What an order's state is called on screen.
 *
 * The API's enum values are storage, not copy. "pending" tells a buyer
 * nothing; "Waiting for the farm" tells them who they are waiting on, which
 * is the only question they actually have.
 *
 * `short` goes in the pill, `full` in the sentence beneath it.
 */
export const ORDER_STATUS: Record<
  OrderStatus,
  { short: string; full: string; tone: StatusTone }
> = {
  pending: {
    short: 'Waiting',
    full: 'Waiting for the farm to confirm your order',
    tone: 'waiting',
  },
  confirmed: {
    short: 'Preparing',
    full: 'The farm is getting your order ready',
    tone: 'active',
  },
  ready: {
    short: 'Ready',
    full: 'Ready — you can collect it from the farm',
    tone: 'active',
  },
  out_for_delivery: {
    short: 'On the way',
    full: 'On the way to you',
    tone: 'active',
  },
  completed: {
    short: 'Done',
    full: 'Finished. Thank you',
    tone: 'done',
  },
  cancelled: {
    short: 'Cancelled',
    full: 'This order was cancelled',
    tone: 'stopped',
  },
};

/** The happy path, in order. Used to draw how far along an order is. */
export const ORDER_STEPS: OrderStatus[] = ['pending', 'confirmed', 'ready', 'completed'];
