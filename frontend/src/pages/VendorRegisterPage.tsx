import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarangays, useMunicipalities, useRegisterVendor } from '@/features/vendors/api';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { SelectField, TextField } from '@/components/ui/Field';

/**
 * MVP 2 — an existing account registers a farm.
 *
 * Barangay is required and is chosen from a list, never typed. It is how a
 * buyer decides whether collecting is realistic, and a free-text field would
 * produce twenty spellings of the same place.
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

  return (
    <form
      onSubmit={(event) => {
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
      }}
      className="space-y-5"
    >
      <p className="rounded-card bg-accent-50 px-4 py-3 text-base text-accent-900">
        We check every farm before its produce goes on the app. You only have to do this once.
      </p>

      <TextField
        label="Farm name"
        hint="What buyers will see. Your own name is fine."
        value={farmName}
        onChange={(event) => setFarmName(event.target.value)}
        required
        minLength={2}
        maxLength={120}
      />

      <SelectField
        label="Municipality"
        value={municipalitySlug}
        onChange={(event) => {
          setMunicipalitySlug(event.target.value);
          // The old barangay belongs to a different municipality.
          setBarangaySlug('');
        }}
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
        hint="Buyers use this to work out how far away you are."
        value={barangaySlug}
        onChange={(event) => setBarangaySlug(event.target.value)}
        required
        disabled={municipalitySlug === ''}
      >
        <option value="">
          {municipalitySlug === '' ? 'Choose a municipality first' : 'Choose one'}
        </option>
        {barangays.data?.map((barangay) => (
          <option key={barangay.id} value={barangay.slug}>
            {barangay.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Landmark"
        hint="Something nearby, so people can find you."
        placeholder="Near the barangay hall"
        value={landmark}
        onChange={(event) => setLandmark(event.target.value)}
        maxLength={200}
        optional
      />

      <div>
        <label htmlFor="about" className="block text-base font-semibold text-ink">
          About your farm <span className="text-sm font-normal text-ink-muted">(optional)</span>
        </label>
        <p className="mt-0.5 text-sm text-ink-muted">What do you usually grow or catch?</p>
        <textarea
          id="about"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={4}
          className="mt-2 w-full rounded-control border border-border-strong bg-surface px-3.5 py-3 text-base text-ink placeholder:text-ink-subtle focus:border-accent-600"
        />
      </div>

      {register.isError && <ErrorNotice error={register.error} />}

      {/*
        Not disabled until the form is valid. A greyed-out button that does
        nothing when tapped gives no reason and no way forward — the worst
        outcome for someone who is not sure what the app wants. Left enabled,
        the browser blocks the submit and moves focus to the field that needs
        attention, which is an answer.
      */}
      <Button
        type="submit"
        size="lg"
        loading={register.isPending}
        loadingLabel="Sending your details…"
      >
        Send for review
      </Button>
    </form>
  );
}
