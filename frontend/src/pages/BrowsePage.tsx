import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sprout, X } from 'lucide-react';
import { useProducts } from '@/features/products/api';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/features/products/types';
import { ProductCardItem } from '@/components/ProductCardItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { ProductListSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/** MVP 1 — the catalogue. No account needed to look. */
export function BrowsePage() {
  const [category, setCategory] = useState<ProductCategory | undefined>(undefined);
  const [search, setSearch] = useState('');

  const query = useProducts({
    ...(category !== undefined && { category }),
    ...(search.trim() !== '' && { search: search.trim() }),
  });

  const filtered = category !== undefined || search.trim() !== '';

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={19}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search for kangkong, bangus…"
          aria-label="Search produce"
          // text-base is not a style choice: anything smaller makes iOS zoom
          // the page on focus and the user has to pinch back out.
          className="w-full rounded-control border border-border-strong bg-surface py-3 pl-11 pr-11 text-base placeholder:text-ink-subtle focus:border-accent-600"
        />
        {search !== '' && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="pressable absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted active:bg-sunken"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>

      {/* Negative margin lets the row bleed to the screen edge, so it reads as
          scrollable rather than as a list that has been cut off. */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        <Chip label="Everything" active={category === undefined} onClick={() => setCategory(undefined)} />
        {PRODUCT_CATEGORIES.map((entry) => (
          <Chip
            key={entry.value}
            label={entry.label}
            active={category === entry.value}
            onClick={() => setCategory(category === entry.value ? undefined : entry.value)}
          />
        ))}
      </div>

      {query.isPending && <ProductListSkeleton />}

      {query.isError && <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />}

      {query.data?.data.length === 0 &&
        (filtered ? (
          <EmptyState
            icon={<Search size={26} aria-hidden />}
            title="Nothing matched"
            description="Try a different word, or look at everything on sale today."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setCategory(undefined);
                }}
              >
                Show everything
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Sprout size={26} aria-hidden />}
            title="No produce yet"
            description="No farms have listed anything so far. If you grow or catch something, you can be the first."
            action={
              <Link to="/sell" className="block">
                <Button>Sell on Ani</Button>
              </Link>
            }
          />
        ))}

      {query.data !== undefined && query.data.data.length > 0 && (
        <>
          <p className="eyebrow">
            {query.data.meta.total} {query.data.meta.total === 1 ? 'item' : 'items'} available
          </p>
          <div className="stagger space-y-3">
            {query.data.data.map((product) => (
              <ProductCardItem key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
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
      aria-pressed={active}
      className={cn(
        'pressable min-h-10 shrink-0 rounded-full px-3.5 text-sm font-semibold',
        active
          ? 'bg-accent-500 text-ink shadow-card'
          : 'bg-sunken text-ink-muted active:bg-accent-50',
      )}
    >
      {label}
    </button>
  );
}
