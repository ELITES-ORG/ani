import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, ShoppingBasket, Store, Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api';
import { usePlaceOrder } from '@/features/orders/api';
import { useCart } from '@/hooks/useCart';
import { groupByVendor, type CartItem } from '@/lib/cart';
import { formatPeso } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * MVP 1 — the basket and checkout.
 *
 * An order belongs to one farm, so a basket spanning several is shown as one
 * group per farm *before* checkout. Someone should learn they are placing two
 * orders from the layout, not from a validation error after tapping the
 * button.
 */
export function CartPage() {
  const { items, totalCentavos, remove, clear } = useCart();
  const { data: user } = useCurrentUser();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const [confirmingRemove, setConfirmingRemove] = useState<CartItem | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket size={26} aria-hidden />}
        title="Your basket is empty"
        description="Add produce from the farms near you and it will show up here."
        action={
          <Link to="/" className="block">
            <Button>Find produce</Button>
          </Link>
        }
      />
    );
  }

  const groups = [...groupByVendor(items).entries()];

  async function checkout() {
    // Pickup by default. Asking for a delivery address is a whole extra step,
    // and the first order should be as short as possible.
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
    <div className="space-y-5">
      {groups.length > 1 && (
        <div className="flex gap-2.5 rounded-card border border-border bg-surface p-3">
          <Info size={18} className="mt-0.5 shrink-0 text-accent-700" aria-hidden />
          <p className="text-sm text-ink-muted">
            Your basket has produce from <strong className="text-ink">{groups.length} farms</strong>,
            so it will be sent as {groups.length} separate orders — one to each farm.
          </p>
        </div>
      )}

      {groups.map(([vendorId, groupItems]) => (
        <section key={vendorId}>
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <Store size={13} aria-hidden />
            {groupItems[0]?.farmName}
          </p>

          <div className="space-y-2">
            {groupItems.map((item) => (
              <Card key={item.productId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink">{item.name}</p>
                  <p className="tnum mt-0.5 text-sm text-ink-muted">
                    {item.amount} {item.unit} × {formatPeso(item.unitPriceCentavos)}
                  </p>
                </div>

                <span className="tnum shrink-0 text-base font-extrabold text-ink">
                  {formatPeso(item.unitPriceCentavos * item.amount)}
                </span>

                <button
                  type="button"
                  onClick={() => setConfirmingRemove(item)}
                  aria-label={`Remove ${item.name} from your basket`}
                  className="pressable flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted active:bg-danger-soft active:text-danger"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-between rounded-card bg-accent-50 px-4 py-3.5">
        <span className="text-base font-bold text-ink">Total to pay</span>
        <span className="tnum text-2xl font-extrabold text-accent-800">
          {formatPeso(totalCentavos)}
        </span>
      </div>

      {placeOrder.isError && <ErrorNotice error={placeOrder.error} />}

      {user ? (
        <div className="space-y-2">
          <Button
            size="lg"
            loading={placeOrder.isPending}
            loadingLabel="Sending your order…"
            onClick={() => void checkout()}
          >
            Place order · pay on pickup
          </Button>
          <p className="text-center text-sm text-ink-muted">
            You pay the farm when you collect. Nothing is charged now.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Link to="/login?next=/cart" className="block">
            <Button size="lg">Sign in to order</Button>
          </Link>
          <p className="text-center text-sm text-ink-muted">
            Your basket is saved. It will still be here after you sign in.
          </p>
        </div>
      )}

      <Button variant="quiet" onClick={() => setConfirmingClear(true)}>
        Empty the basket
      </Button>

      <ConfirmDialog
        open={confirmingRemove !== null}
        title={`Remove ${confirmingRemove?.name ?? 'this item'}?`}
        description="It will be taken out of your basket. You can add it again later."
        confirmLabel="Remove it"
        destructive
        onConfirm={() => {
          if (confirmingRemove !== null) remove(confirmingRemove.productId);
          setConfirmingRemove(null);
        }}
        onCancel={() => setConfirmingRemove(null)}
      />

      <ConfirmDialog
        open={confirmingClear}
        title="Empty your basket?"
        description="Everything in it will be removed."
        confirmLabel="Empty it"
        destructive
        onConfirm={() => {
          clear();
          setConfirmingClear(false);
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </div>
  );
}
