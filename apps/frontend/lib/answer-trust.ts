import type { AgentCitation } from '@/types/agent';
import type {
  AnswerTrustInput,
  AnswerTrustLevel,
  AnswerTrustSummary,
  CitationPreviewMatch,
} from '@/types/answer-trust';

const trustLabels: Record<AnswerTrustLevel, string> = {
  high: '依据充分度高',
  low: '依据充分度低',
  medium: '依据充分度中',
  none: '没有找到依据',
};

export const calculateAnswerTrust = ({
  citations,
  verificationResult,
  verified,
}: AnswerTrustInput): AnswerTrustSummary => {
  if (citations.length === 0) {
    return {
      description: '当前回答没有可展示引用。建议换个问题，或确认文档已完成入库。',
      label: trustLabels.none,
      level: 'none',
      maxScore: null,
      sourceCount: 0,
    };
  }

  const sourceCount = new Set(citations.map((citation) => citation.documentId).filter(Boolean))
    .size;
  const maxScore = Math.max(...citations.map((citation) => citation.score));
  const verificationPassed = verified === true || verificationResult?.grounded === true;
  const verificationFailed =
    verified === false ||
    verificationResult?.grounded === false ||
    verificationResult?.needsMoreContext === true;

  if (verificationPassed && (citations.length >= 2 || sourceCount >= 2)) {
    return {
      description: '回答通过校验，并且命中了多个引用片段或多个来源文档。',
      label: trustLabels.high,
      level: 'high',
      maxScore,
      sourceCount,
    };
  }

  if (verificationFailed) {
    return {
      description: verificationResult?.reason
        ? `校验提示：${verificationResult.reason}`
        : '回答有引用，但校验未完全通过，请结合来源片段判断。',
      label: trustLabels.low,
      level: 'low',
      maxScore,
      sourceCount,
    };
  }

  return {
    description:
      citations.length >= 2 ? '回答命中了多个引用片段。' : '回答有引用依据，但来源数量较少。',
    label: citations.length >= 2 ? trustLabels.medium : trustLabels.low,
    level: citations.length >= 2 ? 'medium' : 'low',
    maxScore,
    sourceCount,
  };
};

export const isGraphCitation = (citation: AgentCitation): boolean =>
  citation.chunkId.startsWith('graph:') ||
  citation.metadata.documentType === 'GRAPH' ||
  Boolean(citation.metadata.graphSource);

export const getCitationSectionTitle = (citation: AgentCitation): string =>
  typeof citation.metadata.sectionTitle === 'string'
    ? citation.metadata.sectionTitle
    : '未命名片段';

export const getCitationDocumentType = (citation: AgentCitation): string =>
  typeof citation.metadata.documentType === 'string' ? citation.metadata.documentType : 'DOCUMENT';

export const toCitationExcerpt = (content: string, maxLength = 260): string => {
  const normalized = content.replace(/\s+/g, ' ').trim();

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
};

export const createCitationPreviewMatch = (
  text: string,
  citationContent: string,
): CitationPreviewMatch => {
  const normalizedNeedle = citationContent.replace(/\s+/g, ' ').trim().slice(0, 120);

  if (!normalizedNeedle) {
    return {
      after: '',
      before: text.slice(0, 900),
      found: false,
      match: '',
    };
  }

  const normalizedText = text.replace(/\s+/g, ' ');
  const index = normalizedText.toLowerCase().indexOf(normalizedNeedle.toLowerCase());

  if (index < 0) {
    return {
      after: '',
      before: text.slice(0, 1200),
      found: false,
      match: '',
    };
  }

  return {
    after: normalizedText.slice(
      index + normalizedNeedle.length,
      index + normalizedNeedle.length + 520,
    ),
    before: normalizedText.slice(Math.max(0, index - 520), index),
    found: true,
    match: normalizedText.slice(index, index + normalizedNeedle.length),
  };
};
