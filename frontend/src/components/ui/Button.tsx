import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Full width is the default on phones, where controls span the column. */
  block?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-leaf-700 text-white active:bg-leaf-900 disabled:bg-border disabled:text-ink-subtle',
  secondary: 'bg-surface text-ink border border-border active:bg-leaf-50',
  ghost: 'bg-transparent text-leaf-700 active:bg-leaf-50',
  danger: 'bg-danger-50 text-danger-500 active:bg-danger-500 active:text-white',
};

export function Button({
  variant = 'primary',
  block = true,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        // 44px minimum target: this is used one-handed, outdoors, often in a hurry.
        'min-h-11 rounded-control px-4 text-base font-medium transition-opacity disabled:opacity-60',
        VARIANTS[variant],
        block && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  );
}
