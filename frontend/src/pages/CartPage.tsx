import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/api';
import { usePlaceOrder } from '@/features/orders/api';
import { useCart } from '@/hooks/useCart';
import { groupByVendor } from '@/lib/cart';
import { formatPeso } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * MVP 1 — cart and checkout.
 *
 * An order belongs to one farm, so a basket spanning several is shown and
 * submitted as one order per farm rather than failing at the API.
 */
export function CartPage() {
  const { items, totalCentavos, remove, clear } = useCart();
  const { data: user } = useCurrentUser();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse produce from farms near you."
        action={
          <Link to="/" className="text-sm text-leaf-700 underline">
            Start browsing
          </Link>
        }
      />
    );
  }

  const groups = [...groupByVendor(items).entries()];

  async function checkout() {
    // Pickup by default: delivery needs a barangay, and asking for one is a
    // separate step rather than a blocker on the first order.
    for (const [, groupItems] of groups) {
      await placeOrder.mutateAsync({
        items: groupItems.map((item) => ({ productId: item.productId, amount: item.amount })),
        fulfillment: 'pickup',
      });
    }
    clear();
    void navigate('/orders');
  }

  return (
    <div className="space-y-4">
      {groups.length > 1 && (
        <p className="rounded-card border border-border bg-leaf-50 px-3 py-2 text-sm text-ink-muted">
          Your basket covers {groups.length} farms, so it will be placed as {groups.length}{' '}
          separate orders.
        </p>
      )}

      {groups.map(([vendorId, groupItems]) => (
        <section key={vendorId} className="space-y-2">
          <h2 className="text-sm font-medium text-ink-muted">{groupItems[0]?.farmName}</h2>

          {groupItems.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-card border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{item.name}</p>
                <p className="text-sm text-ink-muted">
                  {item.amount} {item.unit} — {formatPeso(item.unitPriceCentavos * item.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="shrink-0 px-2 text-sm text-danger-500"
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-medium text-ink">Total</span>
        <span className="text-lg font-semibold text-leaf-700">{formatPeso(totalCentavos)}</span>
      </div>

      {placeOrder.isError && <ErrorNotice error={placeOrder.error} />}

      {user ? (
        <Button disabled={placeOrder.isPending} onClick={() => void checkout()}>
          {placeOrder.isPending ? 'Placing order…' : 'Place order for pickup'}
        </Button>
      ) : (
        <Link
          to="/login"
          className="block min-h-11 rounded-control bg-leaf-700 px-4 py-3 text-center text-base font-medium text-white"
        >
          Sign in to order
        </Link>
      )}

      <Button variant="ghost" onClick={clear}>
        Clear cart
      </Button>
    </div>
  );
}
