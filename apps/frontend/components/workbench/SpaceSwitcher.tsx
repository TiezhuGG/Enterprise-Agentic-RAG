'use client';

import { FormEvent, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { KnowledgeSpaceMetadata, KnowledgeSpaceType } from '@/types/workbench';

const spaceTypeLabels: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: 'Customer',
  DEPARTMENT: 'Department',
  GENERAL: 'General',
  PROJECT: 'Project',
};

export function SpaceSwitcher() {
  const createSpace = useWorkbenchStore((state) => state.createSpace);
  const loading = useWorkbenchStore((state) => state.loading);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectSpace = useWorkbenchStore((state) => state.selectSpace);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const [name, setName] = useState('');
  const [spaceType, setSpaceType] = useState<KnowledgeSpaceType>('GENERAL');
  const [businessKey, setBusinessKey] = useState('');

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createSpace(name, {
      metadata: createMetadata(spaceType, businessKey),
      type: spaceType,
    });
    setName('');
    setBusinessKey('');
    setSpaceType('GENERAL');
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
              {space.name} · {spaceTypeLabels[space.type]}
            </option>
          ))}
        </select>
      </label>

      <form className="space-switcher-form" onSubmit={handleCreate}>
        <input
          className="workbench-input"
          onChange={(event) => setName(event.target.value)}
          placeholder="New space"
          value={name}
        />
        <select
          className="workbench-select"
          onChange={(event) => setSpaceType(event.target.value as KnowledgeSpaceType)}
          value={spaceType}
        >
          {(['GENERAL', 'DEPARTMENT', 'PROJECT', 'CUSTOMER'] as KnowledgeSpaceType[]).map(
            (type) => (
              <option key={type} value={type}>
                {spaceTypeLabels[type]}
              </option>
            ),
          )}
        </select>
        {spaceType !== 'GENERAL' ? (
          <input
            className="workbench-input"
            onChange={(event) => setBusinessKey(event.target.value)}
            placeholder={getBusinessKeyPlaceholder(spaceType)}
            value={businessKey}
          />
        ) : null}
        <button className="workbench-button" disabled={loading || !name.trim()} type="submit">
          Create
        </button>
      </form>
    </section>
  );
}

const createMetadata = (
  spaceType: KnowledgeSpaceType,
  businessKey: string,
): KnowledgeSpaceMetadata | undefined => {
  const normalizedKey = businessKey.trim();

  if (!normalizedKey) {
    return undefined;
  }

  if (spaceType === 'DEPARTMENT') {
    return {
      departmentId: normalizedKey,
      ownerDepartmentId: normalizedKey,
    };
  }

  if (spaceType === 'PROJECT') {
    return {
      projectCode: normalizedKey,
    };
  }

  if (spaceType === 'CUSTOMER') {
    return {
      customerCode: normalizedKey,
      customerName: normalizedKey,
    };
  }

  return undefined;
};

const getBusinessKeyPlaceholder = (spaceType: KnowledgeSpaceType): string => {
  if (spaceType === 'DEPARTMENT') {
    return 'department id';
  }

  if (spaceType === 'PROJECT') {
    return 'project code';
  }

  return 'customer code';
};
