import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldShellProps {
  label: string;
  /** Shown under the label, before anyone types. Explain the format here. */
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/**
 * Label above, hint under the label, error under the control.
 *
 * The label is always visible. Placeholder-as-label disappears the moment
 * someone starts typing, which leaves them with no way to check what the box
 * was for — and that is exactly the person this app is built for.
 *
 * "Optional" is marked rather than "required", because most fields here are
 * required and marking the rare exception is less noise.
 */
export function Field({ label, hint, error, optional, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint !== undefined ? hintId : null, error !== undefined ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold text-ink">
        {label}
        {optional === true && (
          <span className="ml-1.5 text-sm font-normal text-ink-muted">(optional)</span>
        )}
      </label>

      {hint !== undefined && (
        <p id={hintId} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}

      <div className="mt-2">{children(id, describedBy)}</div>

      {error !== undefined && (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL =
  'w-full rounded-control border bg-surface px-3.5 py-3 text-base text-ink ' +
  'placeholder:text-ink-subtle transition-colors ' +
  'focus:border-accent-600 disabled:bg-sunken disabled:text-ink-subtle';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextField({ label, hint, error, optional, className, ...props }: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {(id, describedBy) => (
        <input
          {...props}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined || undefined}
          className={cn(
            CONTROL,
            error !== undefined ? 'border-danger' : 'border-border-strong',
            className,
          )}
        />
      )}
    </Field>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {(id, describedBy) => (
        <select
          {...props}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined || undefined}
          className={cn(
            CONTROL,
            'appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
            // Inline chevron: one fewer element, and it inherits nothing that
            // could drift from the control's own colours.
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b665a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
            error !== undefined ? 'border-danger' : 'border-border-strong',
            className,
          )}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
