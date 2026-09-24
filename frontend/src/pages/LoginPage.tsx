import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/features/auth/api';
import { readReturnPath } from '@/lib/return-path';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { TextField } from '@/components/ui/Field';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = readReturnPath(location.search);
  const registerTo =
    returnPath === '/' ? '/register' : `/register?next=${encodeURIComponent(returnPath)}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        login.mutate(
          { username: username.trim(), password },
          { onSuccess: () => void navigate(returnPath, { replace: true }) },
        );
      }}
      className="space-y-5"
    >
      <p className="text-base text-ink-muted">
        Sign in to order produce or to sell your own.
      </p>

      <TextField
        label="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />

      <div className="relative">
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="pr-12"
        />
        {/*
          Let people see what they typed. Typing a password blind on a phone
          keyboard is the most common reason a sign-in fails twice in a row.
        */}
        <button
          type="button"
          onClick={() => setShowPassword((shown) => !shown)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="pressable absolute bottom-1.5 right-1.5 flex size-11 items-center justify-center rounded-control text-ink-muted active:bg-sunken"
        >
          {showPassword ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
        </button>
      </div>

      {login.isError && <ErrorNotice error={login.error} />}

      <Button type="submit" size="lg" loading={login.isPending} loadingLabel="Signing you in…">
        Sign in
      </Button>

      <p className="text-center text-base text-ink-muted">
        No account yet?{' '}
        <Link to={registerTo} className="font-bold text-accent-700 underline decoration-accent-400 decoration-2 underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  );
}
