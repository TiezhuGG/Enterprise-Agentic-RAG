'use client';

import { useWorkbenchStore } from '@/store/workbench.store';
import type { DocumentContentMetadata } from '@/types/workbench';

const shortenHash = (hash?: string): string => {
  if (!hash) {
    return '-';
  }

  return hash.length > 18 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash;
};

const metadataRows = (metadata: DocumentContentMetadata) => [
  ['Document ID', metadata.documentId],
  ['Space ID', metadata.spaceId],
  ['Type', metadata.documentType],
  ['Language', metadata.language],
  ['Security', metadata.securityLevel],
  ['Parser', metadata.parser],
  ['MIME', metadata.mimeType ?? '-'],
  ['Size', metadata.size ? `${metadata.size} bytes` : '-'],
  ['Content Length', metadata.contentLength],
  ['Line Count', metadata.lineCount],
  ['Source Hash', shortenHash(metadata.sourceHash)],
  ['Content Hash', shortenHash(metadata.contentHash)],
  ['Processed At', new Date(metadata.processedAt).toLocaleString()],
];

export function DocumentMetadataPanel() {
  const metadata = useWorkbenchStore((state) => state.documentMetadata);

  return (
    <section className="workbench-panel metadata-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Metadata</h2>
          <span>{metadata ? metadata.securityLevel : 'empty'}</span>
        </div>
      </div>

      {!metadata ? <p className="workbench-empty">No metadata.</p> : null}

      {metadata ? (
        <>
          <dl className="metadata-grid">
            {metadataRows(metadata).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="metadata-cleaner">
            <h3>Cleaner</h3>
            <dl className="metadata-grid metadata-grid--compact">
              <div>
                <dt>Input</dt>
                <dd>{metadata.cleaner.inputLength}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{metadata.cleaner.outputLength}</dd>
              </div>
              <div>
                <dt>Removed</dt>
                <dd>{metadata.cleaner.removedCharacterCount}</dd>
              </div>
              <div>
                <dt>Heading</dt>
                <dd>{metadata.cleaner.addedTitleHeading ? 'Added' : 'Kept'}</dd>
              </div>
            </dl>
          </div>
        </>
      ) : null}
    </section>
  );
}
