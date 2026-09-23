import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarangays, useMunicipalities, useRegisterVendor } from '@/features/vendors/api';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * MVP 2 — an existing account registers a farm.
 *
 * Barangay is required: it is how a buyer judges whether pickup is realistic,
 * and there is no coordinate search to fall back on.
 */
export function VendorRegisterPage() {
  const [farmName, setFarmName] = useState('');
  const [description, setDescription] = useState('');
  const [municipalitySlug, setMunicipalitySlug] = useState('');
  const [barangaySlug, setBarangaySlug] = useState('');
  const [landmark, setLandmark] = useState('');

  const municipalities = useMunicipalities();
  const barangays = useBarangays(municipalitySlug === '' ? undefined : municipalitySlug);
  const register = useRegisterVendor();
  const navigate = useNavigate();

  const canSubmit =
    farmName.trim().length >= 2 && municipalitySlug !== '' && barangaySlug !== '' && !register.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    register.mutate(
      {
        farmName: farmName.trim(),
        municipalitySlug,
        barangaySlug,
        ...(description.trim() !== '' && { description: description.trim() }),
        ...(landmark.trim() !== '' && { landmark: landmark.trim() }),
      },
      { onSuccess: () => void navigate('/sell') },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Register your farm</h2>
        <p className="mt-1 text-sm text-ink-muted">
          We review each farm before its produce appears in the catalogue.
        </p>
      </div>

      <Field label="Farm name" htmlFor="farmName">
        <input
          id="farmName"
          value={farmName}
          onChange={(event) => setFarmName(event.target.value)}
          required
          minLength={2}
          maxLength={120}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </Field>

      <Field label="Municipality" htmlFor="municipality">
        <select
          id="municipality"
          value={municipalitySlug}
          onChange={(event) => {
            setMunicipalitySlug(event.target.value);
            // The previous barangay belongs to a different municipality.
            setBarangaySlug('');
          }}
          required
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        >
          <option value="">Choose one</option>
          {municipalities.data?.map((municipality) => (
            <option key={municipality.id} value={municipality.slug}>
              {municipality.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Barangay" htmlFor="barangay">
        <select
          id="barangay"
          value={barangaySlug}
          onChange={(event) => setBarangaySlug(event.target.value)}
          required
          disabled={municipalitySlug === ''}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base disabled:opacity-60"
        >
          <option value="">{municipalitySlug === '' ? 'Choose a municipality first' : 'Choose one'}</option>
          {barangays.data?.map((barangay) => (
            <option key={barangay.id} value={barangay.slug}>
              {barangay.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Landmark (optional)" htmlFor="landmark">
        <input
          id="landmark"
          value={landmark}
          onChange={(event) => setLandmark(event.target.value)}
          maxLength={200}
          placeholder="Near the barangay hall"
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </Field>

      <Field label="About your farm (optional)" htmlFor="description">
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={4}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </Field>

      {register.isError && <ErrorNotice error={register.error} />}

      <Button type="submit" disabled={!canSubmit}>
        {register.isPending ? 'Submitting…' : 'Submit registration'}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
