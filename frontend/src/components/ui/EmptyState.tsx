import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  /**
   * A picture instead of the small icon badge. For the few screens where an
   * empty result is the normal state rather than a dead end, and there is
   * room to be warmer about it.
   */
  illustration?: ReactNode;
  title: string;
  description?: string;
  /** Always offer the next step. A dead end reads as a broken app. */
  action?: ReactNode;
}

/**
 * Empty is a normal state here, not a failure.
 *
 * A province this size will have whole categories with nothing in them for
 * months. Someone who lands on one needs to be told what to do next, not
 * shown "no results".
 */
export function EmptyState({ icon, illustration, title, description, action }: EmptyStateProps) {
  return (
    <div className="page-enter flex flex-col items-center px-6 py-14 text-center">
      {illustration !== undefined && <div className="mb-5">{illustration}</div>}
      {illustration === undefined && icon !== undefined && (
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent-50 text-accent-700">
          {icon}
        </div>
      )}
      <p className="text-lg font-bold text-ink">{title}</p>
      {description !== undefined && (
        <p className="mt-1.5 max-w-xs text-base text-ink-muted">{description}</p>
      )}
      {action !== undefined && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
