'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';

export function AuthTokenPanel() {
  const authToken = useWorkbenchStore((state) => state.authToken);
  const setAuthToken = useWorkbenchStore((state) => state.setAuthToken);
  const [draftToken, setDraftToken] = useState(authToken);

  useEffect(() => {
    setDraftToken(authToken);
  }, [authToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setAuthToken(draftToken);
  };

  return (
    <form className="workbench-token" onSubmit={handleSubmit}>
      <label htmlFor="workbench-token">JWT Token</label>
      <input
        id="workbench-token"
        onChange={(event) => setDraftToken(event.target.value)}
        placeholder="Bearer token"
        type="password"
        value={draftToken}
      />
      <button className="workbench-button workbench-button--secondary" type="submit">
        Save
      </button>
    </form>
  );
}
