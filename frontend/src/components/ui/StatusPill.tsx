import { cn } from '@/lib/cn';

export type StatusTone = 'waiting' | 'active' | 'done' | 'stopped';

const TONES: Record<StatusTone, { chip: string; dot: string }> = {
  waiting: { chip: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  active: { chip: 'bg-accent-50 text-accent-800', dot: 'bg-accent-500' },
  done: { chip: 'bg-sunken text-ink-muted', dot: 'bg-ink-muted' },
  stopped: { chip: 'bg-danger-soft text-danger', dot: 'bg-danger' },
};

/**
 * A coloured dot plus words.
 *
 * Never colour alone: roughly one man in twelve cannot separate red from
 * green, which is an unfortunate pair for a produce app. The words carry the
 * meaning and the colour merely reinforces it.
 */
export function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  const style = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.chip,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
      {children}
    </span>
  );
}
