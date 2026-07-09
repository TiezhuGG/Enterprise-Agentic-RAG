import { documentTypes, type DocumentType } from './document.entity';

export const documentContentLanguages = ['zh', 'en', 'mixed', 'unknown'] as const;
export type DocumentContentLanguage = (typeof documentContentLanguages)[number];

export const documentSecurityLevels = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as const;
export type DocumentSecurityLevel = (typeof documentSecurityLevels)[number];

export interface DocumentContentCleanerMetadata extends Record<string, unknown> {
  inputLength: number;
  outputLength: number;
  removedCharacterCount: number;
  addedTitleHeading: boolean;
}

export interface DocumentContentOcrMetadata extends Record<string, unknown> {
  enabled: boolean;
  mode: 'native-text' | 'ocr';
  pageCount?: number;
  processedPages?: number;
  failedPages?: number;
  provider?: string;
  model?: string;
  renderWidth?: number;
  configuredRenderWidth?: number;
  maxImageDimension?: number;
}

export interface DocumentContentMetadata extends Record<string, unknown> {
  allowedDepartmentIds?: string[];
  departmentId?: string;
  documentId: string;
  spaceId: string;
  documentType: DocumentType;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  language: DocumentContentLanguage;
  securityLevel: DocumentSecurityLevel;
  sourceHash: string;
  contentHash: string;
  contentLength: number;
  lineCount: number;
  parser: string;
  cleaner: DocumentContentCleanerMetadata;
  ocr?: DocumentContentOcrMetadata;
  processedAt: string;
}

export interface DocumentContentEntity {
  id: string;
  documentId: string;
  content: string;
  metadata: DocumentContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toNumberValue = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toBooleanValue = (value: unknown): boolean => value === true;

const toStringArrayValue = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toDocumentType = (value: unknown): DocumentType => {
  const candidate = toStringValue(value);

  return documentTypes.includes(candidate as DocumentType) ? (candidate as DocumentType) : 'TXT';
};

const toDocumentContentLanguage = (value: unknown): DocumentContentLanguage => {
  const candidate = toStringValue(value);

  return documentContentLanguages.includes(candidate as DocumentContentLanguage)
    ? (candidate as DocumentContentLanguage)
    : 'unknown';
};

const toDocumentSecurityLevel = (value: unknown): DocumentSecurityLevel => {
  const candidate = toStringValue(value);

  return documentSecurityLevels.includes(candidate as DocumentSecurityLevel)
    ? (candidate as DocumentSecurityLevel)
    : 'INTERNAL';
};

const toCleanerMetadata = (value: unknown): DocumentContentMetadata['cleaner'] => {
  const candidate = isRecord(value) ? value : {};

  return {
    addedTitleHeading: toBooleanValue(candidate.addedTitleHeading),
    inputLength: toNumberValue(candidate.inputLength),
    outputLength: toNumberValue(candidate.outputLength),
    removedCharacterCount: toNumberValue(candidate.removedCharacterCount),
  };
};

const toOcrMetadata = (value: unknown): DocumentContentOcrMetadata | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const mode = toStringValue(value.mode);
  const normalizedMode = mode === 'ocr' || mode === 'native-text' ? mode : 'native-text';
  const result: DocumentContentOcrMetadata = {
    enabled: toBooleanValue(value.enabled),
    mode: normalizedMode,
  };
  const pageCount = value.pageCount;
  const processedPages = value.processedPages;
  const failedPages = value.failedPages;
  const renderWidth = value.renderWidth;
  const configuredRenderWidth = value.configuredRenderWidth;
  const maxImageDimension = value.maxImageDimension;
  const provider = toStringValue(value.provider);
  const model = toStringValue(value.model);

  if (typeof pageCount === 'number' && Number.isFinite(pageCount)) {
    result.pageCount = pageCount;
  }

  if (typeof processedPages === 'number' && Number.isFinite(processedPages)) {
    result.processedPages = processedPages;
  }

  if (typeof failedPages === 'number' && Number.isFinite(failedPages)) {
    result.failedPages = failedPages;
  }

  if (provider) {
    result.provider = provider;
  }

  if (model) {
    result.model = model;
  }

  if (typeof renderWidth === 'number' && Number.isFinite(renderWidth)) {
    result.renderWidth = renderWidth;
  }

  if (typeof configuredRenderWidth === 'number' && Number.isFinite(configuredRenderWidth)) {
    result.configuredRenderWidth = configuredRenderWidth;
  }

  if (typeof maxImageDimension === 'number' && Number.isFinite(maxImageDimension)) {
    result.maxImageDimension = maxImageDimension;
  }

  return result;
};

export const normalizeDocumentContentMetadata = (
  metadata: unknown,
  documentId: string,
): DocumentContentMetadata => {
  const candidate = isRecord(metadata) ? metadata : {};
  const result: DocumentContentMetadata = {
    documentId: toStringValue(candidate.documentId, documentId),
    spaceId: toStringValue(candidate.spaceId),
    documentType: toDocumentType(candidate.documentType),
    language: toDocumentContentLanguage(candidate.language),
    securityLevel: toDocumentSecurityLevel(candidate.securityLevel),
    sourceHash: toStringValue(candidate.sourceHash),
    contentHash: toStringValue(candidate.contentHash),
    contentLength: toNumberValue(candidate.contentLength),
    lineCount: toNumberValue(candidate.lineCount),
    parser: toStringValue(candidate.parser),
    cleaner: toCleanerMetadata(candidate.cleaner),
    processedAt: toStringValue(candidate.processedAt),
  };

  const mimeType = toStringValue(candidate.mimeType);
  const storageKey = toStringValue(candidate.storageKey);
  const departmentId = toStringValue(candidate.departmentId);
  const allowedDepartmentIds = toStringArrayValue(candidate.allowedDepartmentIds);
  const size = candidate.size;
  const ocr = toOcrMetadata(candidate.ocr);

  if (mimeType) {
    result.mimeType = mimeType;
  }

  if (storageKey) {
    result.storageKey = storageKey;
  }

  if (typeof size === 'number' && Number.isFinite(size)) {
    result.size = size;
  }

  if (departmentId) {
    result.departmentId = departmentId;
  }

  if (allowedDepartmentIds.length > 0) {
    result.allowedDepartmentIds = allowedDepartmentIds;
  }

  if (ocr) {
    result.ocr = ocr;
  }

  return result;
};
