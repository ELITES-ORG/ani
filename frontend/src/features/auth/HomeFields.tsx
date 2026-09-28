import { useBarangays, useMunicipalities } from '@/features/vendors/api';
import { SelectField, TextField } from '@/components/ui/Field';

export interface HomeValues {
  municipalitySlug: string;
  barangaySlug: string;
  addressDetail: string;
}

interface HomeFieldsProps {
  value: HomeValues;
  onChange: (next: HomeValues) => void;
}

/**
 * "Where you live", as registering and correcting your details both ask it.
 *
 * Controlled: the parent holds the draft. The barangay list depends on the
 * municipality, so the barangay waits for one and is cleared when it
 * changes.
 */
export function HomeFields({ value, onChange }: HomeFieldsProps) {
  const municipalities = useMunicipalities();
  const barangays = useBarangays(value.municipalitySlug === '' ? undefined : value.municipalitySlug);

  return (
    <section className="space-y-5">
      <h2 className="eyebrow">Where you live</h2>

      <SelectField
        label="Municipality"
        value={value.municipalitySlug}
        onChange={(event) =>
          // The old barangay belongs to a different municipality.
          onChange({ ...value, municipalitySlug: event.target.value, barangaySlug: '' })
        }
        required
      >
        <option value="">Choose one</option>
        {municipalities.data?.map((municipality) => (
          <option key={municipality.id} value={municipality.slug}>
            {municipality.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Barangay"
        value={value.barangaySlug}
        onChange={(event) => onChange({ ...value, barangaySlug: event.target.value })}
        required
        disabled={value.municipalitySlug === ''}
      >
        <option value="">
          {value.municipalitySlug === '' ? 'Choose a municipality first' : 'Choose one'}
        </option>
        {barangays.data?.map((barangay) => (
          <option key={barangay.id} value={barangay.slug}>
            {barangay.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label="House or street"
        hint="How someone would find your house — purok, house number, or a nearby landmark."
        value={value.addressDetail}
        onChange={(event) => onChange({ ...value, addressDetail: event.target.value })}
        autoComplete="street-address"
        required
        minLength={1}
        maxLength={200}
      />
    </section>
  );
}
