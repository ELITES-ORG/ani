import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/api';
import { useMyOrders } from '@/features/orders/api';
import { ORDER_STATUS_LABEL } from '@/features/orders/types';
import { formatPeso } from '@/lib/money';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Spinner } from '@/components/ui/Spinner';

/** MVP 1 — order history and live status. */
export function OrdersPage() {
  const { data: user, isPending: userPending } = useCurrentUser();
  const query = useMyOrders(Boolean(user));

  if (userPending) return <Spinner />;

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your orders"
        action={
          <Link to="/login" className="text-sm text-leaf-700 underline">
            Sign in
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
        title="No orders yet"
        description="Produce you order will show up here."
        action={
          <Link to="/" className="text-sm text-leaf-700 underline">
            Browse produce
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {query.data.data.map((order) => (
        <div key={order.id} className="rounded-card border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{order.vendor.farmName}</p>
              <p className="text-xs text-ink-muted">
                {order.itemCount} item{order.itemCount === 1 ? '' : 's'} —{' '}
                {new Date(order.placedAt).toLocaleDateString('en-PH')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf-900">
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="mt-2 font-semibold text-leaf-700">{formatPeso(order.totalCentavos)}</p>
        </div>
      ))}
    </div>
  );
}
