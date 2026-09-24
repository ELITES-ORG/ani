import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Leaf, MapPin, PackageX } from 'lucide-react';
import { useProduct } from '@/features/products/api';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Spinner } from '@/components/ui/Spinner';
import { formatPeso } from '@/lib/money';
import { useSetPageTitle } from '@/hooks/usePageTitle';

/** MVP 1 — the product page. The only place an amount is chosen. */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const query = useProduct(id);

  // Puts the product's name in the header beside the back arrow.
  useSetPageTitle(query.data?.name);
  const { add } = useCart();
  const navigate = useNavigate();

  // Whole units for things counted, halves for things weighed.
  const [amount, setAmount] = useState(1);

  if (query.isPending) return <Spinner label="Loading this item" />;

  if (query.isError || query.data === undefined) {
    return (
      <EmptyState
        icon={<PackageX size={26} aria-hidden />}
        title="This item is gone"
        description="The farm may have taken it off the list."
        action={<Button onClick={() => void navigate('/')}>Back to browsing</Button>}
      />
    );
  }

  const product = query.data;
  const soldOut = !product.isListed || product.stockAmount <= 0;
  const weighed = product.unit === 'kg' || product.unit === 'liter';
  const step = weighed ? 0.5 : 1;

  const lineTotal = Math.round(product.priceCentavos * amount);

  return (
    <div className="space-y-5">
      {product.imageUrl !== null ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="photo aspect-[4/3] w-full rounded-card object-cover"
        />
      ) : (
        // Compact on purpose. A full-bleed empty box would push the name, the
        // price and the buy button off the first screen to show nothing.
        <div className="flex items-center justify-center gap-2 rounded-card bg-accent-50 py-6">
          <Leaf size={22} className="text-accent-300" aria-hidden />
          <span className="text-sm font-medium text-ink-muted">No photo yet</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold leading-tight text-ink">{product.name}</h1>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="tnum text-xl font-extrabold text-accent-800">
            {formatPeso(product.priceCentavos)}
          </span>
          <span className="text-base font-medium text-ink-muted">per {product.unit}</span>
        </p>
      </div>

      {product.description !== '' && (
        <p className="text-base leading-relaxed text-ink-muted">{product.description}</p>
      )}

      <Card>
        <p className="eyebrow mb-1">Sold by</p>
        <p className="text-base font-bold text-ink">{product.vendor.farmName}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin size={14} className="shrink-0" aria-hidden />
          {product.vendor.barangay}, {product.vendor.municipality}
        </p>
      </Card>

      {soldOut ? (
        <Card className="bg-sunken text-center">
          <p className="font-bold text-ink">Sold out for now</p>
          <p className="mt-1 text-sm text-ink-muted">
            Check again after the next harvest.
          </p>
        </Card>
      ) : (
        <>
          <QuantityStepper
            value={amount}
            onChange={setAmount}
            step={step}
            min={step}
            max={product.stockAmount}
            unit={product.unit}
            label={`How much do you want?`}
          />

          <div className="sticky-action -mx-4 border-t border-border bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur-sm">
            <Button
              size="lg"
              icon={<Check size={20} aria-hidden />}
              onClick={() => {
                add(product, amount);
                void navigate('/cart');
              }}
            >
              Add to basket · {formatPeso(lineTotal)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
