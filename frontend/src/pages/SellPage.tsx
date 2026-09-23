import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/api';
import { useMyProducts } from '@/features/products/api';
import { useReceivedOrders } from '@/features/orders/api';
import { ORDER_STATUS_LABEL } from '@/features/orders/types';
import { formatPeso, formatUnitPrice } from '@/lib/money';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

/**
 * MVP 2 — the seller's home.
 *
 * Four states, in order: signed out, no farm yet, farm awaiting approval, and
 * an approved farm with produce and orders.
 */
export function SellPage() {
  const { data: user, isPending } = useCurrentUser();
  const isApproved = user?.vendor?.status === 'approved';

  const products = useMyProducts(isApproved);
  const orders = useReceivedOrders(isApproved);

  if (isPending) return <Spinner />;

  if (!user) {
    return (
      <EmptyState
        title="Sell your harvest on Ani"
        description="Sign in to register your farm."
        action={
          <Link to="/login" className="text-sm text-leaf-700 underline">
            Sign in
          </Link>
        }
      />
    );
  }

  if (user.vendor === null) {
    return (
      <EmptyState
        title="Sell your harvest on Ani"
        description="Register your farm to start listing produce. Registration is reviewed before your listings go live."
        action={
          <Link
            to="/sell/register"
            className="block min-h-11 rounded-control bg-leaf-700 px-4 py-3 text-center text-base font-medium text-white"
          >
            Register my farm
          </Link>
        }
      />
    );
  }

  if (user.vendor.status === 'pending') {
    return (
      <EmptyState
        title="Your farm is being reviewed"
        description={`${user.vendor.farmName} will appear in the catalogue once it is approved. You can list produce after that.`}
      />
    );
  }

  if (user.vendor.status === 'suspended') {
    return (
      <EmptyState
        title="This farm is suspended"
        description="Get in touch if you think this is a mistake."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">Orders to fulfil</h2>

        {orders.isPending && <Spinner label="Loading orders" />}
        {orders.data?.data.length === 0 && (
          <p className="rounded-card border border-border bg-surface px-3 py-4 text-sm text-ink-muted">
            No orders yet.
          </p>
        )}

        <div className="space-y-2">
          {orders.data?.data.map((order) => (
            <div key={order.id} className="rounded-card border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{formatPeso(order.totalCentavos)}</span>
                <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf-900">
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {order.itemCount} item{order.itemCount === 1 ? '' : 's'} —{' '}
                {order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">My produce</h2>

        {products.isPending && <Spinner label="Loading produce" />}
        {products.data?.data.length === 0 && (
          <p className="rounded-card border border-border bg-surface px-3 py-4 text-sm text-ink-muted">
            Nothing listed yet.
          </p>
        )}

        <div className="space-y-2">
          {products.data?.data.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-card border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{product.name}</p>
                <p className="text-sm text-ink-muted">
                  {formatUnitPrice(product.priceCentavos, product.unit)}
                </p>
              </div>
              <span className="shrink-0 text-sm text-ink-muted">
                {product.stockAmount} {product.unit}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
