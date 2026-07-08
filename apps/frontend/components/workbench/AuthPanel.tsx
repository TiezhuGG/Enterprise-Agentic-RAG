'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';

export function AuthPanel() {
  const authError = useWorkbenchStore((state) => state.authError);
  const authLoading = useWorkbenchStore((state) => state.authLoading);
  const authToken = useWorkbenchStore((state) => state.authToken);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const login = useWorkbenchStore((state) => state.login);
  const setAuthToken = useWorkbenchStore((state) => state.setAuthToken);
  const [email, setEmail] = useState('');
  const [manualToken, setManualToken] = useState(authToken);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setManualToken(authToken);
  }, [authToken]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
    setPassword('');
  };

  const handleManualToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setAuthToken(manualToken);
  };

  const sessionLabel = authUser?.email ?? (authToken ? 'Manual token saved' : 'Not signed in');

  return (
    <section className="workbench-panel workbench-panel--compact auth-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Login</h2>
          <span>{sessionLabel}</span>
        </div>
        {authToken ? (
          <button
            className="workbench-button workbench-button--secondary auth-panel__logout"
            onClick={clearAuth}
            type="button"
          >
            Logout
          </button>
        ) : null}
      </div>

      <form className="auth-panel__form" onSubmit={handleLogin}>
        <label className="workbench-field" htmlFor="auth-email">
          <span>Email</span>
          <input
            className="workbench-input"
            disabled={authLoading}
            id="auth-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            type="email"
            value={email}
          />
        </label>

        <label className="workbench-field" htmlFor="auth-password">
          <span>Password</span>
          <input
            className="workbench-input"
            disabled={authLoading}
            id="auth-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            type="password"
            value={password}
          />
        </label>

        {authError ? <p className="auth-panel__error">{authError}</p> : null}

        <button
          className="workbench-button"
          disabled={authLoading || !email.trim() || !password}
          type="submit"
        >
          {authLoading ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      <details className="auth-panel__manual">
        <summary>Manual Token</summary>
        <form className="auth-panel__form" onSubmit={handleManualToken}>
          <label className="workbench-field" htmlFor="manual-token">
            <span>JWT Token</span>
            <input
              className="workbench-input"
              id="manual-token"
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Paste token"
              type="password"
              value={manualToken}
            />
          </label>
          <button className="workbench-button workbench-button--secondary" type="submit">
            Save Token
          </button>
        </form>
      </details>
    </section>
  );
}
