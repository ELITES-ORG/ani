import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Always give a way forward. A bare "no results" is a dead end. */
  action?: ReactNode;
}

/**
 * Empty is a normal state here, not an error.
 *
 * A province this size will have categories with nothing in them for a long
 * time. See docs/explanation/constraints.md.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description !== undefined && <p className="text-sm text-ink-muted">{description}</p>}
      {action !== undefined && <div className="mt-3 w-full max-w-xs">{action}</div>}
    </div>
  );
}
