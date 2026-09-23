import { Link } from 'react-router-dom';
import { Leaf, MapPin } from 'lucide-react';
import type { ProductCard } from '@/features/products/types';
import { formatPeso } from '@/lib/money';

/**
 * One row in the catalogue.
 *
 * The price is the largest thing after the name, set in tabular figures so
 * prices line up down the column and can be compared at a glance. The farm
 * and its barangay sit together, because "who is selling and how far away"
 * is one question here, not two.
 */
export function ProductCardItem({ product }: { product: ProductCard }) {
  const low = product.stockAmount > 0 && product.stockAmount <= 2;

  return (
    <Link
      to={`/products/${product.id}`}
      className="pressable pressable-card flex gap-3 rounded-card border border-border bg-surface p-3 shadow-card active:bg-accent-50/40"
    >
      {product.imageUrl !== null ? (
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width={80}
          height={80}
          className="size-20 shrink-0 rounded-card object-cover"
        />
      ) : (
        <div
          className="flex size-20 shrink-0 items-center justify-center rounded-card bg-accent-50"
          aria-hidden
        >
          <Leaf size={26} className="text-accent-300" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="truncate text-base font-bold text-ink">{product.name}</h3>

        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin size={13} className="shrink-0" aria-hidden />
          <span className="truncate">
            {product.vendor.farmName} · {product.vendor.municipality}
          </span>
        </p>

        <p className="mt-1.5 flex items-baseline gap-1">
          <span className="tnum text-lg font-extrabold text-accent-800">
            {formatPeso(product.priceCentavos)}
          </span>
          <span className="text-sm font-medium text-ink-muted">per {product.unit}</span>
        </p>

        {low && (
          <p className="mt-1 text-xs font-semibold text-warn">
            Only {product.stockAmount} {product.unit} left
          </p>
        )}
      </div>
    </Link>
  );
}
