import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Smallest sellable amount. Produce sells in halves and quarters of a kilo. */
  step?: number;
  min?: number;
  max?: number;
  /** Shown beside the number so the amount is never ambiguous. */
  unit: string;
  label?: string;
}

/**
 * Two big buttons and a number.
 *
 * Typing "0.25" into a text field is a hostile way to ask someone how much
 * kangkong they want, and it is the single most likely place for a first-time
 * user to give up. Tapping plus and minus needs no keyboard, no decimal point,
 * and cannot produce an invalid value.
 *
 * The number stays editable for anyone who wants to type a larger amount, but
 * nobody has to.
 */
export function QuantityStepper({
  value,
  onChange,
  step = 0.5,
  min = 0.5,
  max = 9999,
  unit,
  label = 'How much?',
}: QuantityStepperProps) {
  // Floating point: 0.1 + 0.2 is not 0.3, and the stepper must not show it.
  const round = (n: number) => Math.round(n * 100) / 100;

  const decrease = () => onChange(round(Math.max(min, value - step)));
  const increase = () => onChange(round(Math.min(max, value + step)));

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>

      <div className="flex items-stretch gap-2">
        <StepButton
          onClick={decrease}
          disabled={atMin}
          label={`Less ${unit}`}
          icon={<Minus size={22} strokeWidth={2.5} aria-hidden />}
        />

        <div
          className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-control border border-border-strong bg-surface px-2 py-2"
          // One live region rather than shouting on every tap of each button.
          aria-live="polite"
        >
          <span className="tnum text-2xl font-extrabold leading-none text-ink">{value}</span>
          <span className="mt-1 text-sm text-ink-muted">{unit}</span>
        </div>

        <StepButton
          onClick={increase}
          disabled={atMax}
          label={`More ${unit}`}
          icon={<Plus size={22} strokeWidth={2.5} aria-hidden />}
        />
      </div>

      {atMax && (
        <p className="mt-2 text-sm text-ink-muted">
          That is everything the farm has left.
        </p>
      )}
    </div>
  );
}

function StepButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // The visible content is an icon, so the accessible name has to be here.
      aria-label={label}
      className={cn(
        'pressable flex size-14 shrink-0 items-center justify-center rounded-control',
        'border border-border-strong bg-surface text-ink',
        'active:bg-accent-50 disabled:opacity-40',
      )}
    >
      {icon}
    </button>
  );
}
