import { TextField } from '@/components/ui/Field';

export interface NameValues {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

interface NameFieldsProps {
  value: NameValues;
  onChange: (next: NameValues) => void;
}

/**
 * "Your name", as registering and correcting your details both ask it.
 *
 * Controlled: the parent holds the draft and trims it on submit.
 */
export function NameFields({ value, onChange }: NameFieldsProps) {
  return (
    <section className="space-y-5">
      <h2 className="eyebrow">Your name</h2>

      <TextField
        label="First name"
        value={value.firstName}
        onChange={(event) => onChange({ ...value, firstName: event.target.value })}
        autoComplete="given-name"
        required
        minLength={1}
        maxLength={60}
      />

      <TextField
        label="Middle name"
        hint="Often your mother's maiden surname."
        value={value.middleName}
        onChange={(event) => onChange({ ...value, middleName: event.target.value })}
        autoComplete="additional-name"
        maxLength={60}
        optional
      />

      <TextField
        label="Last name"
        value={value.lastName}
        onChange={(event) => onChange({ ...value, lastName: event.target.value })}
        autoComplete="family-name"
        required
        minLength={1}
        maxLength={60}
      />

      <TextField
        label="Suffix"
        hint="Jr., Sr., III — leave blank if none."
        value={value.suffix}
        onChange={(event) => onChange({ ...value, suffix: event.target.value })}
        autoComplete="honorific-suffix"
        maxLength={10}
        optional
      />
    </section>
  );
}
