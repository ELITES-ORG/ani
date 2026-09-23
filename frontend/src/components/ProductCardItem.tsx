import { Link } from 'react-router-dom';
import type { ProductCard } from '@/features/products/types';
import { formatUnitPrice } from '@/lib/money';

export function ProductCardItem({ product }: { product: ProductCard }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex gap-3 rounded-card border border-border bg-surface p-3 active:bg-leaf-50"
    >
      {product.imageUrl !== null ? (
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-20 w-20 shrink-0 rounded-control object-cover"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-control bg-leaf-100" />
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-ink">{product.name}</h3>
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {product.vendor.farmName} — {product.vendor.municipality}
        </p>
        <p className="mt-1 text-sm font-semibold text-leaf-700">
          {formatUnitPrice(product.priceCentavos, product.unit)}
        </p>
      </div>
    </Link>
  );
}
