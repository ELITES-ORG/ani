import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '@/features/products/api';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatUnitPrice } from '@/lib/money';

/** MVP 1 — the product page, and the only place stock is committed to a cart. */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const query = useProduct(id);
  const { add } = useCart();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(1);

  if (query.isPending) return <Spinner />;
  if (query.isError || query.data === undefined) {
    return <EmptyState title="Product not found" description="It may have been unlisted." />;
  }

  const product = query.data;
  const soldOut = !product.isListed || product.stockAmount <= 0;

  return (
    <div className="space-y-4">
      {product.imageUrl !== null ? (
        <img
          src={product.imageUrl}
          alt=""
          className="aspect-square w-full rounded-card object-cover"
        />
      ) : (
        <div className="aspect-square w-full rounded-card bg-leaf-100" />
      )}

      <div>
        <h2 className="text-xl font-semibold text-ink">{product.name}</h2>
        <p className="mt-1 text-lg font-semibold text-leaf-700">
          {formatUnitPrice(product.priceCentavos, product.unit)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {product.stockAmount} {product.unit} available
        </p>
      </div>

      {product.description !== '' && (
        <p className="text-sm text-ink-muted">{product.description}</p>
      )}

      <div className="rounded-card border border-border bg-surface p-3">
        <p className="text-sm font-medium text-ink">{product.vendor.farmName}</p>
        <p className="text-xs text-ink-muted">
          {product.vendor.barangay}, {product.vendor.municipality}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="amount" className="text-sm text-ink-muted">
          Quantity
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          min={0.25}
          step={0.25}
          max={product.stockAmount}
          value={amount}
          onChange={(event) => setAmount(Math.max(0.25, Number(event.target.value)))}
          className="w-24 rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
        <span className="text-sm text-ink-muted">{product.unit}</span>
      </div>

      <Button
        disabled={soldOut || amount > product.stockAmount}
        onClick={() => {
          add(product, amount);
          void navigate('/cart');
        }}
      >
        {soldOut ? 'Sold out' : 'Add to cart'}
      </Button>
    </div>
  );
}
