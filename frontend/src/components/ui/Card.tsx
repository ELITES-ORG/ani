import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds press feedback. Use when the whole card is a link or button. */
  interactive?: boolean;
  padded?: boolean;
}

export function Card({ children, className, interactive = false, padded = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        padded && 'p-3',
        interactive && 'pressable pressable-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
