import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useRegister } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { TextField } from '@/components/ui/Field';

/**
 * One account for buying and selling.
 *
 * Nothing here asks whether someone intends to sell — that is a role added
 * later from the Sell tab, not a fork at signup. Four fields is already as
 * long as this form is allowed to be.
 */
export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const register = useRegister();
  const navigate = useNavigate();

  // Validated as they go, but only complained about once there is something
  // to complain about — an error on an untouched field is just noise.
  const passwordTooShort = password !== '' && password.length < 8;
  const usernameTooShort = username !== '' && username.trim().length < 3;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        register.mutate(
          { fullName: fullName.trim(), username: username.trim(), phone: phone.trim(), password },
          { onSuccess: () => void navigate('/') },
        );
      }}
      className="space-y-5"
    >
      <TextField
        label="Your name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        required
        minLength={2}
      />

      <TextField
        label="Username"
        hint="What you will type to sign in. Letters and numbers, no spaces."
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        minLength={3}
        {...(usernameTooShort && { error: 'Use at least 3 characters.' })}
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
        loadingLabel="Creating your account…"
      >
        Create account
      </Button>

      <p className="text-center text-base text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent-700 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
