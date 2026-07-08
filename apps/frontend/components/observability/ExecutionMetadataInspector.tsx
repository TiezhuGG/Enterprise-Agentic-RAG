'use client';

const sensitiveMetadataKeyPattern =
  /authorization|api[-_]?key|secret|password|prompt|answer|content|messages|token|buffer/i;
const maxValueLength = 180;

interface ExecutionMetadataInspectorProps {
  metadata: Record<string, unknown>;
  title?: string;
}

const truncate = (value: string, maxLength = maxValueLength): string =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSensitiveKey = (key: string): boolean => sensitiveMetadataKeyPattern.test(key);

const summarizeValue = (value: unknown, key: string): string => {
  if (isSensitiveKey(key)) {
    return '[redacted]';
  }

  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return truncate(value.replace(/\s+/g, ' '));
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).slice(0, 6);
    const summary = Object.fromEntries(
      entries.map(([childKey, childValue]) => [
        childKey,
        isSensitiveKey(childKey) ? '[redacted]' : summarizeNestedValue(childValue),
      ]),
    );

    return truncate(JSON.stringify(summary));
  }

  return truncate(String(value));
};

const summarizeNestedValue = (value: unknown): string | number | boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return truncate(value.replace(/\s+/g, ' '), 80);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (isRecord(value)) {
    return '[object]';
  }

  return truncate(String(value), 80);
};

export const formatSafeMetadata = (metadata: Record<string, unknown>): string => {
  const safeEntries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .slice(0, 16)
    .map(([key, value]) => [key, summarizeValue(value, key)]);

  if (safeEntries.length === 0) {
    return '';
  }

  return JSON.stringify(Object.fromEntries(safeEntries), null, 2);
};

export function ExecutionMetadataInspector({
  metadata,
  title = 'Metadata',
}: ExecutionMetadataInspectorProps) {
  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .slice(0, 16);

  return (
    <section className="workbench-panel execution-metadata-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>{title}</h2>
          <span>{entries.length} fields</span>
        </div>
      </div>

      {entries.length === 0 ? <p className="workbench-empty">No metadata.</p> : null}

      <dl className="execution-metadata">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{summarizeValue(value, key)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
