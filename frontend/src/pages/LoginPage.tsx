import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    login.mutate({ username, password }, { onSuccess: () => void navigate('/') });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Sign in</h2>

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
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
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
          autoComplete="current-password"
          required
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-base"
        />
      </div>

      {login.isError && <ErrorNotice error={login.error} />}

      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        No account yet?{' '}
        <Link to="/register" className="text-leaf-700 underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
