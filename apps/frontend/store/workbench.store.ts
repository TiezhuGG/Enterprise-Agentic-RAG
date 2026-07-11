'use client';

import { create } from 'zustand';
import { getAuthToken, setAuthToken as persistAuthToken } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { batchService } from '@/services/batch.service';
import { documentService } from '@/services/document.service';
import { ingestionService } from '@/services/ingestion.service';
import { knowledgeSpaceService } from '@/services/knowledge-space.service';
import { pipelineService } from '@/services/pipeline.service';
import { taxonomyService } from '@/services/taxonomy.service';
import { uploadService } from '@/services/upload.service';
import { toUserFacingErrorMessage } from '@/lib/workbench-copy';
import type {
  BatchState,
  DocumentAccessScope,
  DocumentCategory,
  DocumentContentMetadata,
  DocumentPreviewResponse,
  DocumentTag,
  DocumentTaxonomy,
  UpdateDocumentTaxonomyRequest,
  DocumentVersion,
  IngestionResult,
  IngestionOptions,
  IngestionState,
  IngestionStatus,
  KnowledgeSpaceMetadata,
  KnowledgeSpaceType,
  KnowledgeDocument,
  KnowledgeSpace,
  PipelineEvent,
  PipelineJob,
  SpaceMemberDetail,
  SpaceMemberRole,
  UploadState,
  WorkbenchTab,
  AppSection,
} from '@/types/workbench';
import type { AuthenticatedUser } from '@/types/auth';

interface WorkbenchStore {
  activeSection: AppSection;
  activeTab: WorkbenchTab;
  authError: string | null;
  authHydrated: boolean;
  authLoading: boolean;
  authToken: string;
  authUser: AuthenticatedUser | null;
  batchState: BatchState;
  categories: DocumentCategory[];
  documentAccessScope: DocumentAccessScope | null;
  documentAccessScopeError: string | null;
  documentMetadata: DocumentContentMetadata | null;
  documentPreview: DocumentPreviewResponse | null;
  documentPreviewError: string | null;
  documentTaxonomy: DocumentTaxonomy | null;
  documentTaxonomyError: string | null;
  documentVersions: DocumentVersion[];
  documentVersionsError: string | null;
  documents: KnowledgeDocument[];
  error: string | null;
  ingestionState: IngestionState;
  ingestionOptions: IngestionOptions;
  ingestionStatus: IngestionStatus | null;
  loading: boolean;
  loadingDocumentPreview: boolean;
  loadingDocumentTaxonomy: boolean;
  loadingDocumentVersions: boolean;
  loadingDocuments: boolean;
  loadingPipeline: boolean;
  loadingSpaceMembers: boolean;
  pipelineEvents: PipelineEvent[];
  pipelineJobs: PipelineJob[];
  selectedDocumentId: string | null;
  selectedDocumentIds: string[];
  selectedPipelineJobId: string | null;
  selectedSpaceId: string | null;
  spaceMembers: SpaceMemberDetail[];
  spaceMembersError: string | null;
  spaces: KnowledgeSpace[];
  tags: DocumentTag[];
  taxonomyError: string | null;
  uploadState: UploadState;
  uploadingDocumentVersion: boolean;
  batchArchiveDocuments: () => Promise<void>;
  batchIngestDocuments: () => Promise<void>;
  batchUpdateTaxonomy: (input: UpdateDocumentTaxonomyRequest) => Promise<void>;
  clearAuth: () => void;
  clearDocumentSelection: () => void;
  createSpace: (
    name: string,
    profile?: { metadata?: KnowledgeSpaceMetadata; type?: KnowledgeSpaceType },
  ) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  createTag: (name: string) => Promise<void>;
  deleteSelectedDocument: () => Promise<void>;
  addSpaceMember: (email: string, role: SpaceMemberRole) => Promise<void>;
  ingestSelectedDocument: () => Promise<void>;
  initialize: () => Promise<void>;
  loadDocumentPreview: (documentId?: string) => Promise<void>;
  loadDocumentTaxonomy: (documentId?: string) => Promise<void>;
  loadDocumentVersions: (documentId?: string) => Promise<void>;
  loadDocuments: (spaceId?: string) => Promise<void>;
  loadSpaceMembers: (spaceId?: string) => Promise<void>;
  loadTaxonomy: (spaceId?: string) => Promise<void>;
  loadPipeline: (documentId: string, preferredJobId?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  selectDocument: (documentId: string | null) => Promise<void>;
  selectPipelineJob: (jobId: string) => Promise<void>;
  selectSpace: (spaceId: string) => Promise<void>;
  removeSpaceMember: (userId: string) => Promise<void>;
  setActiveTab: (tab: WorkbenchTab) => void;
  setActiveSection: (section: AppSection) => void;
  setAuthToken: (token: string) => Promise<void>;
  setIngestionOptions: (options: Partial<IngestionOptions>) => void;
  setSelectedSpaceFromGlobalSwitcher: (spaceId: string) => Promise<void>;
  toggleDocumentSelection: (documentId: string) => void;
  updateDocumentTaxonomy: (input: UpdateDocumentTaxonomyRequest) => Promise<void>;
  updateDocumentAccessScope: (accessScope: DocumentAccessScope) => Promise<void>;
  updateSelectedSpaceProfile: (profile: {
    metadata?: KnowledgeSpaceMetadata;
    name?: string;
    type?: KnowledgeSpaceType;
    visibility?: KnowledgeSpace['visibility'];
  }) => Promise<void>;
  updateSpaceMemberRole: (userId: string, role: SpaceMemberRole) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  uploadDocumentVersion: (file: File) => Promise<void>;
}

const selectedSpaceStorageKey = 'enterprise-agentic-rag.selectedSpaceId';

const getPersistedSpaceId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(selectedSpaceStorageKey);
};

const persistSelectedSpaceId = (spaceId: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (spaceId) {
    window.localStorage.setItem(selectedSpaceStorageKey, spaceId);
    return;
  }

  window.localStorage.removeItem(selectedSpaceStorageKey);
};

const toErrorMessage = (error: unknown): string =>
  toUserFacingErrorMessage(error, '请求失败，请稍后重试。');

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

const emptyWorkspaceState = () => ({
  batchState: {
    status: 'idle' as const,
  },
  categories: [],
  documentAccessScope: null,
  documentAccessScopeError: null,
  documentMetadata: null,
  documentPreview: null,
  documentPreviewError: null,
  documentTaxonomy: null,
  documentTaxonomyError: null,
  documentVersions: [],
  documentVersionsError: null,
  documents: [],
  error: null,
  ingestionState: {
    status: 'idle' as const,
  },
  ingestionOptions: {
    includeGraph: false,
  },
  ingestionStatus: null,
  loading: false,
  loadingDocumentPreview: false,
  loadingDocumentTaxonomy: false,
  loadingDocumentVersions: false,
  loadingDocuments: false,
  loadingPipeline: false,
  loadingSpaceMembers: false,
  pipelineEvents: [],
  pipelineJobs: [],
  selectedDocumentId: null,
  selectedDocumentIds: [],
  selectedPipelineJobId: null,
  selectedSpaceId: null,
  spaceMembers: [],
  spaceMembersError: null,
  spaces: [],
  tags: [],
  taxonomyError: null,
  uploadState: {
    status: 'idle' as const,
  },
  uploadingDocumentVersion: false,
});

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  activeSection: 'dashboard',
  activeTab: 'pipeline',
  authError: null,
  authHydrated: false,
  authLoading: false,
  authToken: '',
  authUser: null,
  batchState: {
    status: 'idle',
  },
  categories: [],
  documentAccessScope: null,
  documentAccessScopeError: null,
  documentMetadata: null,
  documentPreview: null,
  documentPreviewError: null,
  documentTaxonomy: null,
  documentTaxonomyError: null,
  documentVersions: [],
  documentVersionsError: null,
  documents: [],
  error: null,
  ingestionState: {
    status: 'idle',
  },
  ingestionOptions: {
    includeGraph: false,
  },
  ingestionStatus: null,
  loading: false,
  loadingDocumentPreview: false,
  loadingDocumentTaxonomy: false,
  loadingDocumentVersions: false,
  loadingDocuments: false,
  loadingPipeline: false,
  loadingSpaceMembers: false,
  pipelineEvents: [],
  pipelineJobs: [],
  selectedDocumentId: null,
  selectedDocumentIds: [],
  selectedPipelineJobId: null,
  selectedSpaceId: null,
  spaceMembers: [],
  spaceMembersError: null,
  spaces: [],
  tags: [],
  taxonomyError: null,
  uploadState: {
    status: 'idle',
  },
  uploadingDocumentVersion: false,

  async batchArchiveDocuments() {
    const documentIds = get().selectedDocumentIds;
    const spaceId = get().selectedSpaceId;

    if (!spaceId || documentIds.length === 0) {
      return;
    }

    set({
      batchState: {
        operation: 'archive',
        status: 'running',
      },
      error: null,
    });

    try {
      const result = await batchService.archiveDocuments(documentIds);

      set({
        batchState: {
          lastResult: result,
          operation: 'archive',
          status: result.failed > 0 ? 'error' : 'success',
        },
        selectedDocumentIds: [],
      });
      await get().loadDocuments(spaceId);
    } catch (error) {
      set({
        batchState: {
          errorMessage: toErrorMessage(error),
          operation: 'archive',
          status: 'error',
        },
      });
    }
  },

  async batchIngestDocuments() {
    const documentIds = get().selectedDocumentIds;
    const spaceId = get().selectedSpaceId;

    if (!spaceId || documentIds.length === 0) {
      return;
    }

    set({
      batchState: {
        operation: 'ingest',
        status: 'running',
      },
      error: null,
    });

    try {
      const result = await batchService.ingestDocuments(documentIds, {
        force: true,
        includeEmbedding: true,
        includeGraph: get().ingestionOptions.includeGraph,
      });

      set({
        batchState: {
          lastResult: result,
          operation: 'ingest',
          status: result.failed > 0 ? 'error' : 'success',
        },
      });
      await get().loadDocuments(spaceId);
      if (get().selectedDocumentId) {
        await get().selectDocument(get().selectedDocumentId);
      }
    } catch (error) {
      set({
        batchState: {
          errorMessage: toErrorMessage(error),
          operation: 'ingest',
          status: 'error',
        },
      });
    }
  },

  async batchUpdateTaxonomy(input: UpdateDocumentTaxonomyRequest) {
    const documentIds = get().selectedDocumentIds;

    if (documentIds.length === 0) {
      return;
    }

    set({
      batchState: {
        operation: 'taxonomy',
        status: 'running',
      },
      error: null,
    });

    try {
      const result = await batchService.updateTaxonomy(documentIds, input);

      set({
        batchState: {
          lastResult: result,
          operation: 'taxonomy',
          status: result.failed > 0 ? 'error' : 'success',
        },
      });

      if (get().selectedDocumentId && documentIds.includes(get().selectedDocumentId ?? '')) {
        await get().loadDocumentTaxonomy(get().selectedDocumentId ?? undefined);
      }
    } catch (error) {
      set({
        batchState: {
          errorMessage: toErrorMessage(error),
          operation: 'taxonomy',
          status: 'error',
        },
      });
    }
  },

  clearAuth() {
    persistAuthToken('');
    persistSelectedSpaceId(null);
    set({
      ...emptyWorkspaceState(),
      authError: null,
      authHydrated: true,
      authLoading: false,
      authToken: '',
      authUser: null,
    });
  },

  clearDocumentSelection() {
    set({
      selectedDocumentIds: [],
    });
  },

  async createSpace(
    name: string,
    profile?: { metadata?: KnowledgeSpaceMetadata; type?: KnowledgeSpaceType },
  ) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    set({ error: null, loading: true });

    try {
      const space = await knowledgeSpaceService.create({
        metadata: profile?.metadata,
        name: trimmedName,
        type: profile?.type,
      });

      set((state) => ({
        loading: false,
        selectedSpaceId: space.id,
        spaces: [space, ...state.spaces.filter((item) => item.id !== space.id)],
      }));
      persistSelectedSpaceId(space.id);

      await get().loadDocuments(space.id);
      await get().loadSpaceMembers(space.id);
      await get().loadTaxonomy(space.id);
    } catch (error) {
      set({ error: toErrorMessage(error), loading: false });
    }
  },

  async createCategory(name: string) {
    const spaceId = get().selectedSpaceId;
    const trimmedName = name.trim();

    if (!spaceId || !trimmedName) {
      return;
    }

    set({ taxonomyError: null });

    try {
      const category = await taxonomyService.createCategory(spaceId, {
        name: trimmedName,
      });

      set((state) => ({
        categories: [...state.categories, category].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      }));
    } catch (error) {
      set({ taxonomyError: toErrorMessage(error) });
    }
  },

  async createTag(name: string) {
    const spaceId = get().selectedSpaceId;
    const trimmedName = name.trim();

    if (!spaceId || !trimmedName) {
      return;
    }

    set({ taxonomyError: null });

    try {
      const tag = await taxonomyService.createTag(spaceId, {
        name: trimmedName,
      });

      set((state) => ({
        tags: [...state.tags, tag].sort((left, right) => left.name.localeCompare(right.name)),
      }));
    } catch (error) {
      set({ taxonomyError: toErrorMessage(error) });
    }
  },

  async addSpaceMember(email: string, role: SpaceMemberRole) {
    const spaceId = get().selectedSpaceId;
    const normalizedEmail = email.trim().toLowerCase();

    if (!spaceId || !normalizedEmail) {
      return;
    }

    set({ loadingSpaceMembers: true, spaceMembersError: null });

    try {
      const spaceMembers = await knowledgeSpaceService.addMember(spaceId, {
        email: normalizedEmail,
        role,
      });
      const spaces = await knowledgeSpaceService.list();

      set({
        loadingSpaceMembers: false,
        spaceMembers,
        spaces,
      });
    } catch (error) {
      set({
        loadingSpaceMembers: false,
        spaceMembersError: toErrorMessage(error),
      });
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
        includeGraph: get().ingestionOptions.includeGraph,
      });

      let ingestionStatus: IngestionStatus | null = null;

      try {
        ingestionStatus = await ingestionService.getStatus(documentId);
      } catch {
        ingestionStatus = null;
      }

      set({
        ingestionStatus,
      });

      await get().loadDocuments(spaceId);
      await get().selectDocument(documentId);

      if (result.pipelineJobId) {
        await get().loadPipeline(documentId, result.pipelineJobId);
      }

      set({
        ingestionState: {
          result,
          status: result.status === 'READY' ? 'success' : 'error',
        },
        ingestionStatus,
      });
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      let ingestionStatus: IngestionStatus | null = null;

      try {
        ingestionStatus = await ingestionService.getStatus(documentId);
      } catch {
        ingestionStatus = null;
      }

      await get().loadDocuments(spaceId);
      await get().selectDocument(documentId);
      await get().loadPipeline(documentId);

      set({
        error: errorMessage,
        ingestionState: { errorMessage, status: 'error' },
        ingestionStatus,
      });
    }
  },

  async initialize() {
    const authToken = getAuthToken();

    set({
      authToken,
      authHydrated: false,
      error: null,
    });

    if (!authToken) {
      set({
        ...emptyWorkspaceState(),
        authHydrated: true,
        authToken: '',
      });
      return;
    }

    set({ loading: true });

    try {
      const spaces = await knowledgeSpaceService.list();
      const persistedSpaceId = getPersistedSpaceId();
      const selectedSpaceId =
        get().selectedSpaceId ??
        (persistedSpaceId && spaces.some((space) => space.id === persistedSpaceId)
          ? persistedSpaceId
          : null) ??
        spaces[0]?.id ??
        null;
      persistSelectedSpaceId(selectedSpaceId);

      set({
        authHydrated: true,
        loading: false,
        selectedSpaceId,
        spaces,
      });

      if (selectedSpaceId) {
        await get().loadDocuments(selectedSpaceId);
        await get().loadSpaceMembers(selectedSpaceId);
        await get().loadTaxonomy(selectedSpaceId);
      }
    } catch (error) {
      set({
        authHydrated: true,
        error: toErrorMessage(error),
        loading: false,
        spaces: [],
      });
    }
  },

  async loadDocuments(spaceId = get().selectedSpaceId ?? undefined) {
    if (!spaceId) {
      set({
        categories: [],
        documentAccessScope: null,
        documentAccessScopeError: null,
        documentMetadata: null,
        documentPreview: null,
        documentPreviewError: null,
        documentTaxonomy: null,
        documentTaxonomyError: null,
        documentVersions: [],
        documentVersionsError: null,
        documents: [],
        pipelineEvents: [],
        pipelineJobs: [],
        selectedDocumentId: null,
        selectedDocumentIds: [],
        selectedPipelineJobId: null,
        tags: [],
        taxonomyError: null,
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
        selectedDocumentIds: get().selectedDocumentIds.filter((documentId) =>
          documents.some((document) => document.id === documentId),
        ),
      });

      if (selectedDocumentId) {
        await get().selectDocument(selectedDocumentId);
      } else {
        set({
          documentAccessScope: null,
          documentAccessScopeError: null,
          documentMetadata: null,
          documentPreview: null,
          documentPreviewError: null,
          documentTaxonomy: null,
          documentTaxonomyError: null,
          documentVersions: [],
          documentVersionsError: null,
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

  async loadDocumentPreview(documentId = get().selectedDocumentId ?? undefined) {
    if (!documentId) {
      set({
        documentPreview: null,
        documentPreviewError: null,
        loadingDocumentPreview: false,
      });
      return;
    }

    set({
      documentPreviewError: null,
      loadingDocumentPreview: true,
    });

    try {
      const documentPreview = await documentService.getPreview(documentId);

      set({
        documentPreview,
        loadingDocumentPreview: false,
      });
    } catch (error) {
      set({
        documentPreview: null,
        documentPreviewError: toErrorMessage(error),
        loadingDocumentPreview: false,
      });
    }
  },

  async loadDocumentTaxonomy(documentId = get().selectedDocumentId ?? undefined) {
    if (!documentId) {
      set({
        documentTaxonomy: null,
        documentTaxonomyError: null,
        loadingDocumentTaxonomy: false,
      });
      return;
    }

    set({
      documentTaxonomyError: null,
      loadingDocumentTaxonomy: true,
    });

    try {
      const documentTaxonomy = await taxonomyService.getDocumentTaxonomy(documentId);

      set({
        documentTaxonomy,
        loadingDocumentTaxonomy: false,
      });
    } catch (error) {
      set({
        documentTaxonomy: null,
        documentTaxonomyError: toErrorMessage(error),
        loadingDocumentTaxonomy: false,
      });
    }
  },

  async loadDocumentVersions(documentId = get().selectedDocumentId ?? undefined) {
    if (!documentId) {
      set({
        documentVersions: [],
        documentVersionsError: null,
        loadingDocumentVersions: false,
      });
      return;
    }

    set({
      documentVersionsError: null,
      loadingDocumentVersions: true,
    });

    try {
      const documentVersions = await documentService.listVersions(documentId);

      set({
        documentVersions,
        loadingDocumentVersions: false,
      });
    } catch (error) {
      set({
        documentVersions: [],
        documentVersionsError: toErrorMessage(error),
        loadingDocumentVersions: false,
      });
    }
  },

  async loadSpaceMembers(spaceId = get().selectedSpaceId ?? undefined) {
    if (!spaceId) {
      set({
        loadingSpaceMembers: false,
        spaceMembers: [],
        spaceMembersError: null,
      });
      return;
    }

    set({ loadingSpaceMembers: true, spaceMembersError: null });

    try {
      const spaceMembers = await knowledgeSpaceService.listMembers(spaceId);

      set({
        loadingSpaceMembers: false,
        spaceMembers,
      });
    } catch (error) {
      set({
        loadingSpaceMembers: false,
        spaceMembers: [],
        spaceMembersError: toErrorMessage(error),
      });
    }
  },

  async loadTaxonomy(spaceId = get().selectedSpaceId ?? undefined) {
    if (!spaceId) {
      set({
        categories: [],
        tags: [],
        taxonomyError: null,
      });
      return;
    }

    set({ taxonomyError: null });

    try {
      const [categories, tags] = await Promise.all([
        taxonomyService.listCategories(spaceId),
        taxonomyService.listTags(spaceId),
      ]);

      set({
        categories,
        tags,
      });
    } catch (error) {
      set({
        categories: [],
        tags: [],
        taxonomyError: toErrorMessage(error),
      });
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

  async login(email: string, password: string) {
    set({
      authError: null,
      authLoading: true,
    });

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      persistAuthToken(response.accessToken);
      set({
        ...emptyWorkspaceState(),
        authError: null,
        authHydrated: true,
        authLoading: false,
        authToken: response.accessToken,
        authUser: response.user,
      });

      await get().initialize();
    } catch (error) {
      set({
        authError: toErrorMessage(error),
        authLoading: false,
      });
    }
  },

  async selectDocument(documentId: string | null) {
    set({
      documentAccessScope: null,
      documentAccessScopeError: null,
      documentMetadata: null,
      documentPreview: null,
      documentPreviewError: null,
      documentTaxonomy: null,
      documentTaxonomyError: null,
      documentVersions: [],
      documentVersionsError: null,
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
      const selectedDocument = get().documents.find((document) => document.id === documentId);
      const accessScopeRequest = documentService.getAccessScope(documentId);
      const metadataRequest =
        selectedDocument?.status === 'READY'
          ? documentService.getMetadata(documentId)
          : Promise.resolve(null);
      const [accessScopeResponse, metadataResponse, ingestionStatus] = await Promise.allSettled([
        accessScopeRequest,
        metadataRequest,
        ingestionService.getStatus(documentId),
      ]);

      set({
        documentAccessScope:
          accessScopeResponse.status === 'fulfilled' ? accessScopeResponse.value.accessScope : null,
        documentAccessScopeError:
          accessScopeResponse.status === 'rejected'
            ? toErrorMessage(accessScopeResponse.reason)
            : null,
        documentMetadata:
          metadataResponse.status === 'fulfilled'
            ? (metadataResponse.value?.metadata ?? null)
            : null,
        ingestionStatus: ingestionStatus.status === 'fulfilled' ? ingestionStatus.value : null,
      });

      if (accessScopeResponse.status === 'rejected') {
        set({ error: toErrorMessage(accessScopeResponse.reason) });
      }

      if (
        metadataResponse.status === 'rejected' &&
        !isMetadataUnavailable(metadataResponse.reason)
      ) {
        set({ error: toErrorMessage(metadataResponse.reason) });
      }
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }

    await Promise.all([
      get().loadPipeline(documentId),
      get().loadDocumentVersions(documentId),
      get().loadDocumentTaxonomy(documentId),
    ]);
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

  async removeSpaceMember(userId: string) {
    const spaceId = get().selectedSpaceId;

    if (!spaceId) {
      return;
    }

    set({ loadingSpaceMembers: true, spaceMembersError: null });

    try {
      const spaceMembers = await knowledgeSpaceService.removeMember(spaceId, userId);
      const spaces = await knowledgeSpaceService.list();

      if (!spaces.some((space) => space.id === spaceId)) {
        persistSelectedSpaceId(null);
        set({
          ...emptyWorkspaceState(),
          loadingSpaceMembers: false,
          spaces,
        });
        return;
      }

      set({
        loadingSpaceMembers: false,
        spaceMembers,
        spaces,
      });
    } catch (error) {
      set({
        loadingSpaceMembers: false,
        spaceMembersError: toErrorMessage(error),
      });
    }
  },

  async selectSpace(spaceId: string) {
    set({
      categories: [],
      documentAccessScope: null,
      documentAccessScopeError: null,
      documentMetadata: null,
      documentPreview: null,
      documentPreviewError: null,
      documentTaxonomy: null,
      documentTaxonomyError: null,
      documentVersions: [],
      documentVersionsError: null,
      error: null,
      ingestionState: { status: 'idle' },
      ingestionStatus: null,
      pipelineEvents: [],
      pipelineJobs: [],
      selectedDocumentId: null,
      selectedDocumentIds: [],
      selectedPipelineJobId: null,
      selectedSpaceId: spaceId,
      spaceMembers: [],
      spaceMembersError: null,
      tags: [],
      taxonomyError: null,
    });
    persistSelectedSpaceId(spaceId);

    await Promise.all([
      get().loadDocuments(spaceId),
      get().loadSpaceMembers(spaceId),
      get().loadTaxonomy(spaceId),
    ]);
  },

  setActiveTab(tab: WorkbenchTab) {
    set({ activeTab: tab });
  },

  setActiveSection(section: AppSection) {
    set({ activeSection: section });
  },

  async setAuthToken(token: string) {
    const normalizedToken = token.trim();

    persistAuthToken(normalizedToken);

    set({
      ...emptyWorkspaceState(),
      authError: null,
      authHydrated: true,
      authLoading: false,
      authToken: normalizedToken,
      authUser: null,
    });

    await get().initialize();
  },

  setIngestionOptions(options: Partial<IngestionOptions>) {
    set((state) => ({
      ingestionOptions: {
        ...state.ingestionOptions,
        ...options,
      },
    }));
  },

  async setSelectedSpaceFromGlobalSwitcher(spaceId: string) {
    await get().selectSpace(spaceId);
  },

  toggleDocumentSelection(documentId: string) {
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(documentId)
        ? state.selectedDocumentIds.filter((id) => id !== documentId)
        : [...state.selectedDocumentIds, documentId],
    }));
  },

  async updateDocumentTaxonomy(input: UpdateDocumentTaxonomyRequest) {
    const documentId = get().selectedDocumentId;

    if (!documentId) {
      return;
    }

    set({
      documentTaxonomyError: null,
      loadingDocumentTaxonomy: true,
    });

    try {
      const documentTaxonomy = await taxonomyService.updateDocumentTaxonomy(documentId, input);

      set((state) => ({
        documentTaxonomy,
        documents: state.documents.map((document) =>
          document.id === documentId
            ? {
                ...document,
                categoryId: documentTaxonomy.category?.id ?? null,
              }
            : document,
        ),
        loadingDocumentTaxonomy: false,
      }));
    } catch (error) {
      set({
        documentTaxonomyError: toErrorMessage(error),
        loadingDocumentTaxonomy: false,
      });
    }
  },

  async updateSpaceMemberRole(userId: string, role: SpaceMemberRole) {
    const spaceId = get().selectedSpaceId;

    if (!spaceId) {
      return;
    }

    set({ loadingSpaceMembers: true, spaceMembersError: null });

    try {
      const spaceMembers = await knowledgeSpaceService.updateMember(spaceId, userId, {
        role,
      });
      const spaces = await knowledgeSpaceService.list();

      set({
        loadingSpaceMembers: false,
        spaceMembers,
        spaces,
      });
    } catch (error) {
      set({
        loadingSpaceMembers: false,
        spaceMembersError: toErrorMessage(error),
      });
    }
  },

  async updateDocumentAccessScope(accessScope: DocumentAccessScope) {
    const documentId = get().selectedDocumentId;

    if (!documentId) {
      return;
    }

    set({ documentAccessScopeError: null, loadingDocuments: true });

    try {
      const response = await documentService.updateAccessScope(documentId, accessScope);

      set((state) => ({
        documentAccessScope: response.accessScope,
        documentMetadata: state.documentMetadata
          ? {
              ...state.documentMetadata,
              allowedDepartmentIds: response.accessScope.allowedDepartmentIds,
              departmentId: response.accessScope.departmentId,
              securityLevel: response.accessScope.securityLevel,
            }
          : state.documentMetadata,
        documents: state.documents.map((document) =>
          document.id === documentId
            ? {
                ...document,
                accessScope: response.accessScope,
              }
            : document,
        ),
        loadingDocuments: false,
      }));
    } catch (error) {
      set({
        documentAccessScopeError: toErrorMessage(error),
        loadingDocuments: false,
      });
    }
  },

  async updateSelectedSpaceProfile(profile) {
    const spaceId = get().selectedSpaceId;

    if (!spaceId) {
      return;
    }

    set({ error: null, loading: true });

    try {
      const updatedSpace = await knowledgeSpaceService.update(spaceId, profile);

      set((state) => ({
        loading: false,
        spaces: state.spaces.map((space) => (space.id === spaceId ? updatedSpace : space)),
      }));
    } catch (error) {
      set({ error: toErrorMessage(error), loading: false });
    }
  },

  async uploadDocument(file: File) {
    const spaceId = get().selectedSpaceId;

    if (!spaceId) {
      set({ error: '请先创建或选择知识空间。' });
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

  async uploadDocumentVersion(file: File) {
    const documentId = get().selectedDocumentId;
    const spaceId = get().selectedSpaceId;

    if (!documentId || !spaceId) {
      set({ error: '请先选择一个文档，再上传新版本。' });
      return;
    }

    set({
      error: null,
      uploadingDocumentVersion: true,
    });

    try {
      const response = await uploadService.uploadDocumentVersion(documentId, file, {
        title: file.name,
      });

      set((state) => ({
        documents: state.documents.map((document) =>
          document.id === documentId ? response.document : document,
        ),
        selectedDocumentId: response.document.id,
        uploadingDocumentVersion: false,
      }));

      await get().loadDocuments(spaceId);
      await get().selectDocument(response.document.id);
      await get().loadDocumentPreview(response.document.id);
    } catch (error) {
      set({
        error: toErrorMessage(error),
        uploadingDocumentVersion: false,
      });
    }
  },
}));
