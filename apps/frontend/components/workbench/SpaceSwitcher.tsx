'use client';

import { FormEvent, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';

export function SpaceSwitcher() {
  const createSpace = useWorkbenchStore((state) => state.createSpace);
  const loading = useWorkbenchStore((state) => state.loading);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectSpace = useWorkbenchStore((state) => state.selectSpace);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const [name, setName] = useState('');

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createSpace(name);
    setName('');
  };

  return (
    <section className="workbench-panel workbench-panel--compact">
      <div className="workbench-panel__header">
        <h2>Knowledge Space</h2>
      </div>

      <label className="workbench-field" htmlFor="space-switcher">
        <span>Selected</span>
        <select
          className="workbench-select"
          disabled={loading || spaces.length === 0}
          id="space-switcher"
          onChange={(event) => void selectSpace(event.target.value)}
          value={selectedSpaceId ?? ''}
        >
          {spaces.length === 0 ? <option value="">No spaces</option> : null}
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
      </label>

      <form className="workbench-inline-form" onSubmit={handleCreate}>
        <input
          className="workbench-input"
          onChange={(event) => setName(event.target.value)}
          placeholder="New space"
          value={name}
        />
        <button className="workbench-button" disabled={loading || !name.trim()} type="submit">
          Create
        </button>
      </form>
    </section>
  );
}
