import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * One account for buying and selling.
 *
 * Nothing here asks whether someone intends to sell: that is a role added
 * later from the Sell tab, not a fork at signup.
 */
export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const register = useRegister();
  const navigate = useNavigate();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    register.mutate(
      { fullName: fullName.trim(), username: username.trim(), phone: phone.trim(), password },
      { onSuccess: () => void navigate('/') },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Create an account</h2>

      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
          Full name
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          required
          minLength={2}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </div>

      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-ink">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          required
          minLength={3}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
          Mobile number
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          required
          placeholder="0917 123 4567"
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
        <p className="mt-1 text-xs text-ink-muted">
          How the farm reaches you about an order. Not shown publicly.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
        <p className="mt-1 text-xs text-ink-muted">At least 8 characters.</p>
      </div>

      {register.isError && <ErrorNotice error={register.error} />}

      <Button type="submit" disabled={register.isPending}>
        {register.isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-leaf-700 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
