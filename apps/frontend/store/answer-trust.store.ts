'use client';

import { create } from 'zustand';
import { createCitationPreviewMatch, isGraphCitation } from '@/lib/answer-trust';
import { toUserFacingErrorMessage } from '@/lib/workbench-copy';
import { documentService } from '@/services/document.service';
import type { AgentCitation } from '@/types/agent';
import type { CitationPreviewMatch, CitationPreviewState } from '@/types/answer-trust';
import type { DocumentFileBlob } from '@/services/document.service';

interface AnswerTrustStore extends CitationPreviewState {
  closePreview: () => void;
  downloadCurrentDocument: () => Promise<void>;
  openCitation: (citation: AgentCitation) => Promise<void>;
}

const textPreviewDocumentTypes = new Set(['TXT', 'MARKDOWN']);
const filePreviewDocumentTypes = new Set(['PDF', 'IMAGE', 'TXT', 'MARKDOWN']);

const initialState: CitationPreviewState = {
  citation: null,
  document: null,
  error: null,
  file: null,
  loading: false,
  match: null,
  open: false,
  textPreview: null,
};

const revokeFile = (file: CitationPreviewState['file']): void => {
  if (file?.url) {
    URL.revokeObjectURL(file.url);
  }
};

export const useAnswerTrustStore = create<AnswerTrustStore>((set, get) => ({
  ...initialState,

  closePreview() {
    revokeFile(get().file);
    set(initialState);
  },

  async downloadCurrentDocument() {
    const document = get().document;

    if (!document) {
      return;
    }

    try {
      await documentService.download(document);
    } catch (error) {
      set({
        error: toUserFacingErrorMessage(error, '文档下载失败，请稍后重试。'),
      });
    }
  },

  async openCitation(citation: AgentCitation) {
    revokeFile(get().file);
    set({
      ...initialState,
      citation,
      loading: true,
      open: true,
    });

    if (isGraphCitation(citation)) {
      set({
        error: null,
        loading: false,
        match: null,
        textPreview: null,
      });
      return;
    }

    try {
      const document = await documentService.get(citation.documentId);
      let file: DocumentFileBlob | null = null;
      let textPreview: string | null = null;
      let match: CitationPreviewMatch | null = null;

      if (filePreviewDocumentTypes.has(document.type)) {
        file = await documentService.preview(document);

        if (textPreviewDocumentTypes.has(document.type)) {
          textPreview = await file.blob.text();
          match = createCitationPreviewMatch(textPreview, citation.content);
        }
      }

      set({
        document,
        error: null,
        file,
        loading: false,
        match,
        textPreview,
      });
    } catch (error) {
      set({
        error: toUserFacingErrorMessage(error, '引用预览加载失败，请稍后重试。'),
        loading: false,
      });
    }
  },
}));
