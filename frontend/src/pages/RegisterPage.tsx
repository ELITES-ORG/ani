import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useRegister } from '@/features/auth/api';
import { useBarangays, useMunicipalities } from '@/features/vendors/api';
import { readReturnPath } from '@/lib/return-path';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { SelectField, TextField } from '@/components/ui/Field';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

/**
 * One account for buying and selling.
 *
 * Ten fields, but one submit split into three sections so nobody faces the
 * whole list at once. A multi-request wizard would leave half-made accounts
 * when the connection drops between steps.
 */
export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [municipalitySlug, setMunicipalitySlug] = useState('');
  const [barangaySlug, setBarangaySlug] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const municipalities = useMunicipalities();
  const barangays = useBarangays(municipalitySlug === '' ? undefined : municipalitySlug);
  const register = useRegister();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = readReturnPath(location.search);
  const loginTo =
    returnPath === '/' ? '/login' : `/login?next=${encodeURIComponent(returnPath)}`;

  // Validated as they go, but only complained about once there is something
  // to complain about — an error on an untouched field is just noise.
  const passwordTooShort = password !== '' && password.length < 8;
  const trimmedUsername = username.trim();
  const usernameTooShort = trimmedUsername !== '' && trimmedUsername.length < 3;
  const usernameTooLong = trimmedUsername.length > 30;
  const usernameBadChars =
    trimmedUsername !== '' && !usernameTooShort && !USERNAME_PATTERN.test(trimmedUsername);

  const usernameError = usernameTooShort
    ? 'Use at least 3 characters.'
    : usernameTooLong
      ? 'Keep it to 30 characters or fewer.'
      : usernameBadChars
        ? 'Letters, numbers, underscores and dots only — no spaces.'
        : undefined;

  // Matched on the code, not the sentence: the API owns that copy, and a
  // reword there must not silently move this error off the field.
  const duplicateUsername =
    register.error instanceof ApiError && register.error.code === 'CONFLICT'
      ? register.error.message
      : undefined;

  const fieldUsernameError = usernameError ?? duplicateUsername;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (usernameError !== undefined) return;
        const trimmedMiddle = middleName.trim();
        const trimmedSuffix = suffix.trim();
        register.mutate(
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: trimmedUsername,
            phone: phone.trim(),
            password,
            municipalitySlug,
            barangaySlug,
            addressDetail: addressDetail.trim(),
            ...(trimmedMiddle !== '' && { middleName: trimmedMiddle }),
            ...(trimmedSuffix !== '' && { suffix: trimmedSuffix }),
          },
          { onSuccess: () => void navigate(returnPath, { replace: true }) },
        );
      }}
      className="space-y-8"
    >
      <section className="space-y-5">
        <h2 className="eyebrow">Your name</h2>

        <TextField
          label="First name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete="given-name"
          required
          minLength={1}
          maxLength={60}
        />

        <TextField
          label="Middle name"
          hint="Often your mother's maiden surname."
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          autoComplete="additional-name"
          maxLength={60}
          optional
        />

        <TextField
          label="Last name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete="family-name"
          required
          minLength={1}
          maxLength={60}
        />

        <TextField
          label="Suffix"
          hint="Jr., Sr., III — leave blank if none."
          value={suffix}
          onChange={(event) => setSuffix(event.target.value)}
          autoComplete="honorific-suffix"
          maxLength={10}
          optional
        />
      </section>

      <section className="space-y-5">
        <h2 className="eyebrow">How you sign in</h2>

        <TextField
          label="Username"
          hint="What you will type to sign in. Letters, numbers, underscores and dots — saved in lowercase."
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (register.isError) register.reset();
          }}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          minLength={3}
          maxLength={30}
          // Without this the browser reports "Juan Cruz" as valid, the submit
          // handler bails silently, and the button does nothing at all — the
          // dead control ADR 0016 exists to prevent. With it, the browser
          // blocks the submit and moves focus to this field.
          pattern="[a-zA-Z0-9_.]+"
          {...(fieldUsernameError !== undefined && { error: fieldUsernameError })}
        />

        <TextField
          label="Mobile number"
          hint="So the farm can reach you about your order. It is never shown publicly."
          type="tel"
          inputMode="tel"
          placeholder="0917 123 4567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          required
        />

        <div className="relative">
          <TextField
            label="Password"
            hint="At least 8 characters."
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="pr-12"
            {...(passwordTooShort && { error: 'A bit longer — 8 characters or more.' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="pressable absolute bottom-1.5 right-1.5 flex size-11 items-center justify-center rounded-control text-ink-muted active:bg-sunken"
          >
            {showPassword ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="eyebrow">Where you live</h2>

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
          label="House or street"
          hint="How someone would find your house — purok, house number, or a nearby landmark."
          value={addressDetail}
          onChange={(event) => setAddressDetail(event.target.value)}
          autoComplete="street-address"
          required
          minLength={1}
          maxLength={200}
        />
      </section>

      {/* Duplicate username lands on the field; everything else stays here. */}
      {register.isError && duplicateUsername === undefined && (
        <ErrorNotice error={register.error} />
      )}

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
        loadingLabel="Creating your account…"
      >
        Create account
      </Button>

      <p className="text-center text-base text-ink-muted">
        Already have an account?{' '}
        <Link to={loginTo} className="font-bold text-accent-700 underline decoration-accent-400 decoration-2 underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
