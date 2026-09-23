import { useState } from 'react';
import { useProducts } from '@/features/products/api';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/features/products/types';
import { ProductCardItem } from '@/components/ProductCardItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

/** MVP 1 — the catalogue customers land on. No account needed. */
export function BrowsePage() {
  const [category, setCategory] = useState<ProductCategory | undefined>(undefined);
  const [search, setSearch] = useState('');

  const query = useProducts({
    ...(category !== undefined && { category }),
    ...(search.trim() !== '' && { search: search.trim() }),
  });

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search produce"
        // 16px base size, or iOS zooms the page when this takes focus.
        className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip label="All" active={category === undefined} onClick={() => setCategory(undefined)} />
        {PRODUCT_CATEGORIES.map((entry) => (
          <Chip
            key={entry.value}
            label={entry.label}
            active={category === entry.value}
            onClick={() => setCategory(entry.value)}
          />
        ))}
      </div>

      {query.isPending && <Spinner label="Loading produce" />}
      {query.isError && <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />}

      {query.data?.data.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          description={
            category === undefined
              ? 'No farms have listed produce yet.'
              : 'No produce in this category right now. Try another one.'
          }
        />
      )}

      <div className="space-y-3">
        {query.data?.data.map((product) => (
          <ProductCardItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-sm',
        active ? 'bg-leaf-700 text-white' : 'border border-border bg-surface text-ink-muted',
      )}
    >
      {label}
    </button>
  );
}
