import { Link } from 'react-router-dom';
import { LogIn, ReceiptText, Store } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api';
import { useMyOrders } from '@/features/orders/api';
import { ORDER_STATUS, ORDER_STEPS, type OrderStatus } from '@/features/orders/types';
import { formatPeso } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';

/** MVP 1 — order history and live status. */
export function OrdersPage() {
  const { data: user, isPending: userPending } = useCurrentUser();
  const query = useMyOrders(Boolean(user));

  if (userPending) return <Spinner label="Checking your account" />;

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn size={26} aria-hidden />}
        title="Sign in to see your orders"
        description="Your orders and their progress live in your account."
        action={
          <Link to="/login?next=/orders" className="block">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  if (query.isPending) return <Spinner label="Loading your orders" />;
  if (query.isError) return <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />;

  if (query.data.data.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText size={26} aria-hidden />}
        title="No orders yet"
        description="When you order produce, you can follow it here until you collect it."
        action={
          <Link to="/" className="block">
            <Button>Find produce</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="stagger space-y-3">
      {query.data.data.map((order) => {
        const status = ORDER_STATUS[order.status];
        return (
          <Card key={order.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-base font-bold text-ink">
                  <Store size={15} className="shrink-0 text-ink-muted" aria-hidden />
                  {order.vendor.farmName}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
                  {new Date(order.placedAt).toLocaleDateString('en-PH', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <StatusPill tone={status.tone}>{status.short}</StatusPill>
            </div>

            <OrderProgress status={order.status} />

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-ink-muted">{status.full}</span>
              <span className="tnum shrink-0 text-lg font-extrabold text-ink">
                {formatPeso(order.totalCentavos)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * How far along the order is, as four segments.
 *
 * A word alone does not answer "is this nearly ready?". A filled bar does,
 * without reading anything — which matters when the person checking is
 * standing in a market deciding whether to wait.
 */
function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;

  const reached = ORDER_STEPS.indexOf(status);

  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {ORDER_STEPS.map((step, index) => (
        <span
          key={step}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-300',
            index <= reached ? 'bg-accent-500' : 'bg-sunken',
          )}
        />
      ))}
    </div>
  );
}
