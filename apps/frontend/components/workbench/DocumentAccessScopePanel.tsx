'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { DocumentAccessScope, DocumentSecurityLevel } from '@/types/workbench';

const securityLevelLabels: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: 'Confidential',
  INTERNAL: 'Internal',
  PUBLIC: 'Public',
};

const securityLevelDescriptions: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: 'Only owners or confidential-read users can read.',
  INTERNAL: 'Space members can read, with optional department restriction.',
  PUBLIC: 'Space members can read without department restriction.',
};

const defaultScope: DocumentAccessScope = {
  securityLevel: 'INTERNAL',
};

const toDepartmentText = (scope: DocumentAccessScope | null): string =>
  scope?.allowedDepartmentIds?.join(', ') ?? '';

const parseDepartmentIds = (value: string): string[] | undefined => {
  const ids = [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

  return ids.length > 0 ? ids : undefined;
};

export function DocumentAccessScopePanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const documentAccessScope = useWorkbenchStore((state) => state.documentAccessScope);
  const documentAccessScopeError = useWorkbenchStore((state) => state.documentAccessScopeError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const updateDocumentAccessScope = useWorkbenchStore((state) => state.updateDocumentAccessScope);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'EDITOR';
  const effectiveScope = documentAccessScope ?? selectedDocument?.accessScope ?? defaultScope;
  const [securityLevel, setSecurityLevel] = useState<DocumentSecurityLevel>(
    effectiveScope.securityLevel,
  );
  const [departmentId, setDepartmentId] = useState(effectiveScope.departmentId ?? '');
  const [allowedDepartmentIds, setAllowedDepartmentIds] = useState(
    toDepartmentText(effectiveScope),
  );
  const isDirty = useMemo(
    () =>
      securityLevel !== effectiveScope.securityLevel ||
      departmentId.trim() !== (effectiveScope.departmentId ?? '') ||
      allowedDepartmentIds.trim() !== toDepartmentText(effectiveScope),
    [allowedDepartmentIds, departmentId, effectiveScope, securityLevel],
  );

  useEffect(() => {
    setSecurityLevel(effectiveScope.securityLevel);
    setDepartmentId(effectiveScope.departmentId ?? '');
    setAllowedDepartmentIds(toDepartmentText(effectiveScope));
  }, [effectiveScope]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await updateDocumentAccessScope({
      allowedDepartmentIds: parseDepartmentIds(allowedDepartmentIds),
      departmentId: departmentId.trim() || undefined,
      securityLevel,
    });
  };

  return (
    <Card>
      <CardHeader className="document-access-scope__header">
        <div>
          <CardTitle>Document Access</CardTitle>
          <CardDescription>
            {selectedDocument
              ? 'Control who can read, retrieve, preview, and cite this document.'
              : 'Select a document first.'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? 'Editable' : 'Read only'}
        </Badge>
      </CardHeader>
      <CardContent>
        {documentAccessScopeError ? (
          <div className="workbench-error">{documentAccessScopeError}</div>
        ) : null}

        {!selectedDocument ? (
          <div className="document-access-scope__empty">No document selected.</div>
        ) : (
          <form className="document-access-scope" onSubmit={handleSubmit}>
            <div className="document-access-scope__summary">
              <div>
                <ShieldCheck />
                <span>{securityLevelLabels[effectiveScope.securityLevel]}</span>
              </div>
              <div>
                <LockKeyhole />
                <span>
                  {effectiveScope.allowedDepartmentIds?.length
                    ? `${effectiveScope.allowedDepartmentIds.length} departments`
                    : 'No department list'}
                </span>
              </div>
            </div>

            <label className="document-access-scope__field">
              <span>Security level</span>
              <Select
                disabled={!canManage || loadingDocuments}
                onValueChange={(value) => setSecurityLevel(value as DocumentSecurityLevel)}
                value={securityLevel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as DocumentSecurityLevel[]).map(
                    (level) => (
                      <SelectItem key={level} value={level}>
                        {securityLevelLabels[level]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <small>{securityLevelDescriptions[securityLevel]}</small>
            </label>

            <label className="document-access-scope__field">
              <span>Primary department ID</span>
              <Input
                disabled={!canManage || loadingDocuments}
                onChange={(event) => setDepartmentId(event.target.value)}
                placeholder="dept-finance"
                value={departmentId}
              />
            </label>

            <label className="document-access-scope__field">
              <span>Allowed department IDs</span>
              <Input
                disabled={!canManage || loadingDocuments}
                onChange={(event) => setAllowedDepartmentIds(event.target.value)}
                placeholder="dept-finance, dept-legal"
                value={allowedDepartmentIds}
              />
              <small>Comma-separated. Leave empty to use primary department only.</small>
            </label>

            <Button disabled={!canManage || !isDirty || loadingDocuments} type="submit">
              <Save />
              Save access scope
            </Button>

            <p className="document-access-scope__hint">
              Re-run ingestion after changing scope to refresh chunk metadata and search index.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
