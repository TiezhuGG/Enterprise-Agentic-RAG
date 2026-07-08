'use client';

import { create } from 'zustand';
import { getAuthToken, setAuthToken as persistAuthToken } from '@/services/api-client';
import { documentService } from '@/services/document.service';
import { ingestionService } from '@/services/ingestion.service';
import { knowledgeSpaceService } from '@/services/knowledge-space.service';
import { pipelineService } from '@/services/pipeline.service';
import { uploadService } from '@/services/upload.service';
import type {
  DocumentContentMetadata,
  IngestionResult,
  IngestionState,
  IngestionStatus,
  KnowledgeDocument,
  KnowledgeSpace,
  PipelineEvent,
  PipelineJob,
  UploadState,
} from '@/types/workbench';

export type WorkbenchTab = 'pipeline' | 'assistant';

interface WorkbenchStore {
  activeTab: WorkbenchTab;
  authToken: string;
  documentMetadata: DocumentContentMetadata | null;
  documents: KnowledgeDocument[];
  error: string | null;
  ingestionState: IngestionState;
  ingestionStatus: IngestionStatus | null;
  loading: boolean;
  loadingDocuments: boolean;
  loadingPipeline: boolean;
  pipelineEvents: PipelineEvent[];
  pipelineJobs: PipelineJob[];
  selectedDocumentId: string | null;
  selectedPipelineJobId: string | null;
  selectedSpaceId: string | null;
  spaces: KnowledgeSpace[];
  uploadState: UploadState;
  createSpace: (name: string) => Promise<void>;
  deleteSelectedDocument: () => Promise<void>;
  ingestSelectedDocument: () => Promise<void>;
  initialize: () => Promise<void>;
  loadDocuments: (spaceId?: string) => Promise<void>;
  loadPipeline: (documentId: string, preferredJobId?: string) => Promise<void>;
  selectDocument: (documentId: string | null) => Promise<void>;
  selectPipelineJob: (jobId: string) => Promise<void>;
  selectSpace: (spaceId: string) => Promise<void>;
  setActiveTab: (tab: WorkbenchTab) => void;
  setAuthToken: (token: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
}

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Request failed';

const sortDocuments = (documents: KnowledgeDocument[]): KnowledgeDocument[] =>
  [...documents].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

const sortJobs = (jobs: PipelineJob[]): PipelineJob[] =>
  [...jobs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

const isMetadataUnavailable = (error: unknown): boolean => {
  const message = toErrorMessage(error).toLowerCase();

  return message.includes('not found') || message.includes('404') || message.includes('metadata');
};

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  activeTab: 'pipeline',
  authToken: '',
  documentMetadata: null,
  documents: [],
  error: null,
  ingestionState: {
    status: 'idle',
  },
  ingestionStatus: null,
  loading: false,
  loadingDocuments: false,
  loadingPipeline: false,
  pipelineEvents: [],
  pipelineJobs: [],
  selectedDocumentId: null,
  selectedPipelineJobId: null,
  selectedSpaceId: null,
  spaces: [],
  uploadState: {
    status: 'idle',
  },

  async createSpace(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    set({ error: null, loading: true });

    try {
      const space = await knowledgeSpaceService.create(trimmedName);

      set((state) => ({
        loading: false,
        selectedSpaceId: space.id,
        spaces: [space, ...state.spaces.filter((item) => item.id !== space.id)],
      }));

      await get().loadDocuments(space.id);
    } catch (error) {
      set({ error: toErrorMessage(error), loading: false });
    }
  },

  async deleteSelectedDocument() {
    const documentId = get().selectedDocumentId;
    const spaceId = get().selectedSpaceId;

    if (!documentId || !spaceId) {
      return;
    }

    set({ error: null, loadingDocuments: true });

    try {
      await documentService.delete(documentId);
      await get().loadDocuments(spaceId);
    } catch (error) {
      set({ error: toErrorMessage(error), loadingDocuments: false });
    }
  },

  async ingestSelectedDocument() {
    const documentId = get().selectedDocumentId;
    const spaceId = get().selectedSpaceId;

    if (!documentId || !spaceId) {
      return;
    }

    set({
      error: null,
      ingestionState: { status: 'running' },
      ingestionStatus: null,
    });

    try {
      const result: IngestionResult = await ingestionService.ingestDocument(documentId, {
        force: true,
        includeEmbedding: true,
        includeGraph: false,
      });

      let ingestionStatus: IngestionStatus | null = null;

      try {
        ingestionStatus = await ingestionService.getStatus(documentId);
      } catch {
        ingestionStatus = null;
      }

      set({
        ingestionState: {
          result,
          status: result.status === 'READY' ? 'success' : 'error',
        },
        ingestionStatus,
      });

      await get().loadDocuments(spaceId);
      await get().selectDocument(documentId);

      if (result.pipelineJobId) {
        await get().loadPipeline(documentId, result.pipelineJobId);
      }
    } catch (error) {
      set({
        error: toErrorMessage(error),
        ingestionState: { status: 'error' },
      });
    }
  },

  async initialize() {
    set({
      authToken: getAuthToken(),
      error: null,
      loading: true,
    });

    try {
      const spaces = await knowledgeSpaceService.list();
      const selectedSpaceId = get().selectedSpaceId ?? spaces[0]?.id ?? null;

      set({
        loading: false,
        selectedSpaceId,
        spaces,
      });

      if (selectedSpaceId) {
        await get().loadDocuments(selectedSpaceId);
      }
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loading: false,
        spaces: [],
      });
    }
  },

  async loadDocuments(spaceId = get().selectedSpaceId ?? undefined) {
    if (!spaceId) {
      set({
        documentMetadata: null,
        documents: [],
        pipelineEvents: [],
        pipelineJobs: [],
        selectedDocumentId: null,
        selectedPipelineJobId: null,
      });
      return;
    }

    set({ error: null, loadingDocuments: true });

    try {
      const documents = sortDocuments(await documentService.listBySpace(spaceId));
      const currentDocumentId = get().selectedDocumentId;
      const selectedDocumentId =
        currentDocumentId && documents.some((document) => document.id === currentDocumentId)
          ? currentDocumentId
          : (documents[0]?.id ?? null);

      set({
        documents,
        loadingDocuments: false,
        selectedDocumentId,
      });

      if (selectedDocumentId) {
        await get().selectDocument(selectedDocumentId);
      } else {
        set({
          documentMetadata: null,
          ingestionStatus: null,
          pipelineEvents: [],
          pipelineJobs: [],
          selectedPipelineJobId: null,
        });
      }
    } catch (error) {
      set({ error: toErrorMessage(error), loadingDocuments: false });
    }
  },

  async loadPipeline(documentId: string, preferredJobId?: string) {
    set({ error: null, loadingPipeline: true });

    try {
      const jobs = sortJobs(await pipelineService.listDocumentJobs(documentId));
      const selectedPipelineJobId =
        preferredJobId && jobs.some((job) => job.id === preferredJobId)
          ? preferredJobId
          : (jobs[0]?.id ?? null);
      const events = selectedPipelineJobId
        ? await pipelineService.listJobEvents(selectedPipelineJobId)
        : [];

      set({
        loadingPipeline: false,
        pipelineEvents: events,
        pipelineJobs: jobs,
        selectedPipelineJobId,
      });
    } catch (error) {
      set({ error: toErrorMessage(error), loadingPipeline: false });
    }
  },

  async selectDocument(documentId: string | null) {
    set({
      documentMetadata: null,
      ingestionState: { status: 'idle' },
      ingestionStatus: null,
      pipelineEvents: [],
      pipelineJobs: [],
      selectedDocumentId: documentId,
      selectedPipelineJobId: null,
    });

    if (!documentId) {
      return;
    }

    try {
      const [metadataResponse, ingestionStatus] = await Promise.allSettled([
        documentService.getMetadata(documentId),
        ingestionService.getStatus(documentId),
      ]);

      set({
        documentMetadata:
          metadataResponse.status === 'fulfilled' ? metadataResponse.value.metadata : null,
        ingestionStatus: ingestionStatus.status === 'fulfilled' ? ingestionStatus.value : null,
      });

      if (
        metadataResponse.status === 'rejected' &&
        !isMetadataUnavailable(metadataResponse.reason)
      ) {
        set({ error: toErrorMessage(metadataResponse.reason) });
      }
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }

    await get().loadPipeline(documentId);
  },

  async selectPipelineJob(jobId: string) {
    set({ error: null, loadingPipeline: true, selectedPipelineJobId: jobId });

    try {
      const events = await pipelineService.listJobEvents(jobId);
      set({ loadingPipeline: false, pipelineEvents: events });
    } catch (error) {
      set({ error: toErrorMessage(error), loadingPipeline: false });
    }
  },

  async selectSpace(spaceId: string) {
    set({
      documentMetadata: null,
      error: null,
      ingestionState: { status: 'idle' },
      ingestionStatus: null,
      pipelineEvents: [],
      pipelineJobs: [],
      selectedDocumentId: null,
      selectedPipelineJobId: null,
      selectedSpaceId: spaceId,
    });

    await get().loadDocuments(spaceId);
  },

  setActiveTab(tab: WorkbenchTab) {
    set({ activeTab: tab });
  },

  async setAuthToken(token: string) {
    persistAuthToken(token.trim());
    set({
      authToken: token.trim(),
      documentMetadata: null,
      documents: [],
      error: null,
      ingestionState: { status: 'idle' },
      ingestionStatus: null,
      pipelineEvents: [],
      pipelineJobs: [],
      selectedDocumentId: null,
      selectedPipelineJobId: null,
      selectedSpaceId: null,
      spaces: [],
    });

    await get().initialize();
  },

  async uploadDocument(file: File) {
    const spaceId = get().selectedSpaceId;

    if (!spaceId) {
      set({ error: 'Please select a space first.' });
      return;
    }

    set({
      error: null,
      uploadState: {
        filename: file.name,
        status: 'uploading',
      },
    });

    try {
      const document = await uploadService.uploadDocument(spaceId, file, {
        title: file.name,
      });

      set({
        uploadState: {
          filename: file.name,
          status: 'success',
        },
      });

      await get().loadDocuments(spaceId);
      await get().selectDocument(document.id);
    } catch (error) {
      set({
        error: toErrorMessage(error),
        uploadState: {
          filename: file.name,
          status: 'error',
        },
      });
    }
  },
}));
