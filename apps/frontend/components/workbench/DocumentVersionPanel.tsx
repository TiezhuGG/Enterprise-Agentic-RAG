'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileClock, RefreshCw, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { DocumentVersion } from '@/types/workbench';

const formatSize = (size: number | null): string => {
  if (!size) {
    return '-';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatHash = (hash: string | null): string => (hash ? `${hash.slice(0, 10)}...` : '-');

const getVersionMeta = (version: DocumentVersion): string =>
  [
    version.type,
    formatSize(version.size),
    version.mimeType,
    new Date(version.createdAt).toLocaleString(),
  ]
    .filter(Boolean)
    .join(' | ');

export function DocumentVersionPanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const documentVersions = useWorkbenchStore((state) => state.documentVersions);
  const documentVersionsError = useWorkbenchStore((state) => state.documentVersionsError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadDocumentVersions = useWorkbenchStore((state) => state.loadDocumentVersions);
  const loadingDocumentVersions = useWorkbenchStore((state) => state.loadingDocumentVersions);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const uploadDocumentVersion = useWorkbenchStore((state) => state.uploadDocumentVersion);
  const uploadingDocumentVersion = useWorkbenchStore((state) => state.uploadingDocumentVersion);
  const [file, setFile] = useState<File | null>(null);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'EDITOR';
  const currentVersion = useMemo(
    () => documentVersions.find((version) => version.isCurrent) ?? null,
    [documentVersions],
  );

  useEffect(() => {
    if (selectedDocumentId) {
      void loadDocumentVersions(selectedDocumentId);
    }
  }, [loadDocumentVersions, selectedDocumentId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    await uploadDocumentVersion(file);
    setFile(null);
    event.currentTarget.reset();
  };

  return (
    <Card>
      <CardHeader className="document-version-panel__header">
        <div>
          <CardTitle>Document Versions</CardTitle>
          <CardDescription>
            {selectedDocument
              ? 'Track source file revisions for the current document.'
              : 'Select a document first.'}
          </CardDescription>
        </div>
        <Badge variant={currentVersion ? 'success' : 'secondary'}>
          {currentVersion ? `v${currentVersion.versionNumber}` : 'No version'}
        </Badge>
      </CardHeader>
      <CardContent className="document-version-panel">
        {documentVersionsError ? (
          <div className="workbench-error">{documentVersionsError}</div>
        ) : null}

        {!selectedDocument ? (
          <div className="document-version-panel__empty">No document selected.</div>
        ) : (
          <>
            <div className="document-version-panel__toolbar">
              <div>
                <FileClock />
                <span>{documentVersions.length} versions</span>
              </div>
              <Button
                disabled={loadingDocumentVersions}
                onClick={() => void loadDocumentVersions(selectedDocument.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw className={loadingDocumentVersions ? 'animate-spin' : undefined} />
                Refresh
              </Button>
            </div>

            <form className="document-version-panel__upload" onSubmit={handleSubmit}>
              <input
                disabled={!canManage || uploadingDocumentVersion}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button
                disabled={!canManage || !file || uploadingDocumentVersion}
                size="sm"
                type="submit"
              >
                <UploadCloud />
                {uploadingDocumentVersion ? 'Uploading...' : 'Upload new version'}
              </Button>
              {!canManage ? <small>OWNER or EDITOR role is required.</small> : null}
            </form>

            {loadingDocumentVersions ? (
              <div className="document-version-panel__empty">Loading versions...</div>
            ) : null}

            {!loadingDocumentVersions && documentVersions.length === 0 ? (
              <div className="document-version-panel__empty">
                Version history appears after upload or migration.
              </div>
            ) : null}

            <div className="document-version-panel__list">
              {documentVersions.map((version) => (
                <div className="document-version-panel__item" key={version.id}>
                  <div className="document-version-panel__item-header">
                    <div>
                      <strong>v{version.versionNumber}</strong>
                      <span>{version.title}</span>
                    </div>
                    <span className={`status-pill status-pill--${version.status.toLowerCase()}`}>
                      {version.status}
                    </span>
                  </div>
                  <div className="document-version-panel__meta">
                    <span>{getVersionMeta(version)}</span>
                    <span>source {formatHash(version.sourceHash)}</span>
                    <span>content {formatHash(version.contentHash)}</span>
                  </div>
                  {version.isCurrent ? (
                    <div className="document-version-panel__current">
                      <CheckCircle2 />
                      Current searchable version
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
