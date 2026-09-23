import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  /** Full width is the default: a thumb finds an edge-to-edge target without aiming. */
  block?: boolean;
  /** Shows a spinner and disables the button. Pass `loadingLabel` to say what is happening. */
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * The primary fill is brand green with near-black ink, not white.
 *
 * White on #00b464 is 2.7:1, which fails AA and is genuinely hard to read on
 * a cheap screen outdoors. Ink on the same green is 6.2:1.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-500 text-ink shadow-card hover:bg-accent-400 active:bg-accent-600',
  secondary: 'bg-surface text-ink border border-border-strong hover:bg-accent-50',
  quiet: 'bg-transparent text-accent-700 hover:bg-accent-50',
  danger: 'bg-danger-soft text-danger border border-danger/25 hover:bg-danger hover:text-white',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-12 px-4 text-base',
  lg: 'min-h-14 px-5 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = true,
  loading = false,
  loadingLabel,
  icon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled === true || loading}
      // Tells a screen reader the control is busy rather than simply gone.
      aria-busy={loading || undefined}
      className={cn(
        'pressable inline-flex items-center justify-center gap-2 rounded-control font-semibold',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="spin shrink-0" aria-hidden />
          {/* Naming the action beats a bare spinner: it tells someone on a slow
              connection that the tap worked and what it is doing. */}
          <span>{loadingLabel ?? 'Working…'}</span>
        </>
      ) : (
        <>
          {icon !== undefined && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
