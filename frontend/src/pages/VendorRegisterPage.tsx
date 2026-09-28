import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/api';
import {
  useBarangays,
  useMunicipalities,
  useMyFarm,
  useRegisterVendor,
  useUpdateMyFarm,
} from '@/features/vendors/api';
import type { OwnFarm } from '@/features/vendors/types';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { SelectField, TextField } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

/**
 * MVP 2 — an existing account registers a farm, or fixes a rejected one and
 * sends it again (ADR 0011).
 *
 * Barangay is required and is chosen from a list, never typed. It is how a
 * buyer decides whether collecting is realistic, and a free-text field would
 * produce twenty spellings of the same place.
 */
export function VendorRegisterPage() {
  const { data: user, isPending } = useCurrentUser();
  const resubmitting = user?.vendor?.status === 'rejected';
  const farm = useMyFarm(resubmitting);

  // Wait for /me: the form is seeded once, so it must know which farm it is.
  if (isPending) return <Spinner label="Checking your account" />;

  if (!resubmitting) return <FarmForm farm={null} />;

  if (farm.isPending) return <Spinner label="Loading your farm" />;
  if (farm.isError) return <ErrorNotice error={farm.error} onRetry={() => void farm.refetch()} />;
  return <FarmForm farm={farm.data} />;
}

/**
 * A new farm when `farm` is null; otherwise the rejected farm, prefilled
 * once. The form holds the owner's draft, not a mirror of the server.
 */
function FarmForm({ farm }: { farm: OwnFarm | null }) {
  const [farmName, setFarmName] = useState(farm?.farmName ?? '');
  const [description, setDescription] = useState(farm?.description ?? '');
  const [municipalitySlug, setMunicipalitySlug] = useState(farm?.municipalitySlug ?? '');
  const [barangaySlug, setBarangaySlug] = useState(farm?.barangaySlug ?? '');
  const [landmark, setLandmark] = useState(farm?.landmark ?? '');

  const municipalities = useMunicipalities();
  const barangays = useBarangays(municipalitySlug === '' ? undefined : municipalitySlug);
  const register = useRegisterVendor();
  const resubmit = useUpdateMyFarm();
  const send = farm === null ? register : resubmit;
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send.mutate(
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
      {farm === null ? (
        <p className="rounded-card bg-accent-50 px-4 py-3 text-base text-accent-900">
          We check every farm before its produce goes on the app. You only have to do this once.
        </p>
      ) : (
        <div className="rounded-card border border-danger/20 bg-danger-soft p-4">
          <p className="font-semibold text-ink">Why it was not approved</p>
          {farm.reviewNote !== null && (
            <p className="mt-1 text-base text-ink">“{farm.reviewNote}”</p>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            Fix what it says, then send your farm again. We will check it as soon as we can.
          </p>
        </div>
      )}

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

      {send.isError && <ErrorNotice error={send.error} />}

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
        loading={send.isPending}
        loadingLabel="Sending your details…"
      >
        {farm === null ? 'Send for review' : 'Send for review again'}
      </Button>
    </form>
  );
}
