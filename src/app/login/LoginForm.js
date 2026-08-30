'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function safeNextPath(value) {
  if (!value || typeof value !== 'string') return '/account';
  if (!value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export default function LoginForm({ initialMode = 'login', nextPath = '/account', urlError = '' }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(urlError || '');
  const [pending, setPending] = useState(false);

  const title = mode === 'signup' ? 'Create account' : 'Log in';
  const submitLabel = useMemo(() => {
    if (pending) return mode === 'signup' ? 'Creating…' : 'Signing in…';
    return mode === 'signup' ? 'Sign up' : 'Log in';
  }, [mode, pending]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setPending(true);

    try {
      const supabase = createClient();
      const credentials = { email: email.trim(), password };

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword(credentials);
        if (signInError) throw signInError;
      }

      router.push(safeNextPath(nextPath));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>{title}</h1>
      <p className="auth-sub">Email and password. No Google yet.</p>

      {error ? <p className="auth-error">{error}</p> : null}

      <label htmlFor="auth-email">Email</label>
      <input
        id="auth-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label htmlFor="auth-password">Password</label>
      <input
        id="auth-password"
        type="password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        minLength={6}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
        {submitLabel}
      </button>

      <p className="auth-switch">
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setMode('login')}>
              Log in
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button type="button" onClick={() => setMode('signup')}>
              Sign up
            </button>
          </>
        )}
      </p>
    </form>
  );
}
