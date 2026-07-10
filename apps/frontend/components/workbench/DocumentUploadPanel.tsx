'use client';

import { FormEvent, useRef, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';

const acceptedDocumentTypes = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.mp3',
  '.wav',
  '.webm',
  '.m4a',
  '.ogg',
  '.mp4',
  '.mov',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/md',
  'application/markdown',
  'application/x-markdown',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
].join(',');

export function DocumentUploadPanel() {
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const uploadDocument = useWorkbenchStore((state) => state.uploadDocument);
  const uploadState = useWorkbenchStore((state) => state.uploadState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    await uploadDocument(file);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="workbench-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Upload</h2>
          <span>50MB max</span>
        </div>
        {uploadState.status !== 'idle' ? (
          <span className={`status-pill status-pill--${uploadState.status}`}>
            {uploadState.status}
          </span>
        ) : null}
      </div>

      <form className="workbench-upload" onSubmit={handleUpload}>
        <input
          accept={acceptedDocumentTypes}
          disabled={!selectedSpaceId || uploadState.status === 'uploading'}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="workbench-button"
          disabled={!selectedSpaceId || !file || uploadState.status === 'uploading'}
          type="submit"
        >
          Upload
        </button>
      </form>

      {uploadState.filename ? <p className="workbench-muted">{uploadState.filename}</p> : null}
    </section>
  );
}
