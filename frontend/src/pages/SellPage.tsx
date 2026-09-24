import { Link } from 'react-router-dom';
import { Clock, Leaf, LogIn, PauseCircle, Store } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api';
import { useMyProducts } from '@/features/products/api';
import { useReceivedOrders } from '@/features/orders/api';
import { ORDER_STATUS } from '@/features/orders/types';
import { formatPeso } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';

/**
 * MVP 2 — the seller's home.
 *
 * Five states in order: signed out, no farm, awaiting review, suspended, and
 * selling. Each one says what is true now and what happens next, because a
 * farmer who registered and sees nothing will assume it did not work.
 */
export function SellPage() {
  const { data: user, isPending } = useCurrentUser();
  const isApproved = user?.vendor?.status === 'approved';

  const products = useMyProducts(isApproved);
  const orders = useReceivedOrders(isApproved);

  if (isPending) return <Spinner label="Checking your account" />;

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn size={26} aria-hidden />}
        title="Sell your harvest on Ani"
        description="Sign in first, then register your farm. It takes a few minutes."
        action={
          <Link to="/login?next=/sell" className="block">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  if (user.vendor === null) {
    return (
      <EmptyState
        icon={<Store size={26} aria-hidden />}
        title="Sell your harvest on Ani"
        description="Tell us about your farm and we will check it over. Once it is approved you can list what you grow."
        action={
          <Link to="/sell/register" className="block">
            <Button size="lg">Register my farm</Button>
          </Link>
        }
      />
    );
  }

  if (user.vendor.status === 'pending') {
    return (
      <EmptyState
        icon={<Clock size={26} aria-hidden />}
        title="We are checking your farm"
        description={`${user.vendor.farmName} is being reviewed. Once it is approved you can add produce and buyers will see it. Nothing more is needed from you right now.`}
      />
    );
  }

  if (user.vendor.status === 'suspended') {
    return (
      <EmptyState
        icon={<PauseCircle size={26} aria-hidden />}
        title="This farm is paused"
        description="Your produce is hidden from buyers for now. Get in touch if you think this is a mistake."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 rounded-card bg-accent-50 px-4 py-3">
        <Store size={18} className="shrink-0 text-accent-700" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{user.vendor.farmName}</p>
          <p className="text-sm text-accent-800">Your farm is live</p>
        </div>
      </div>

      <section>
        <h2 className="eyebrow mb-2">Orders to prepare</h2>

        {orders.isPending && <Spinner label="Loading orders" />}

        {orders.data?.data.length === 0 && (
          <Card className="text-center">
            <p className="text-base font-semibold text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              When someone orders your produce it will appear here.
            </p>
          </Card>
        )}

        <div className="stagger space-y-2">
          {orders.data?.data.map((order) => {
            const status = ORDER_STATUS[order.status];
            return (
              <Card key={order.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="tnum text-base font-extrabold text-ink">
                    {formatPeso(order.totalCentavos)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
                    {order.fulfillment === 'delivery' ? 'Deliver' : 'Pickup'}
                  </p>
                </div>
                <StatusPill tone={status.tone}>{status.short}</StatusPill>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-2">What you are selling</h2>

        {products.isPending && <Spinner label="Loading your produce" />}

        {products.data?.data.length === 0 && (
          <Card className="text-center">
            <p className="text-base font-semibold text-ink">Nothing listed yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Add what you have and buyers nearby will see it.
            </p>
          </Card>
        )}

        <div className="stagger space-y-2">
          {products.data?.data.map((product) => {
            const soldOut = product.stockAmount <= 0;
            return (
              <Card key={product.id} className="flex items-center gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-control bg-accent-50"
                  aria-hidden
                >
                  <Leaf size={18} className="text-accent-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink">{product.name}</p>
                  <p className="tnum mt-0.5 text-sm text-ink-muted">
                    {formatPeso(product.priceCentavos)} per {product.unit}
                  </p>
                </div>
                {soldOut ? (
                  <StatusPill tone="stopped">Sold out</StatusPill>
                ) : (
                  <span className="tnum shrink-0 text-sm font-semibold text-ink-muted">
                    {product.stockAmount} {product.unit} left
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
