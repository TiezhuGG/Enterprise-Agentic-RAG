'use client';

import { create } from 'zustand';
import { getAuthToken, setAuthToken as persistAuthToken } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { documentService } from '@/services/document.service';
import { ingestionService } from '@/services/ingestion.service';
import { knowledgeSpaceService } from '@/services/knowledge-space.service';
import { pipelineService } from '@/services/pipeline.service';
import { uploadService } from '@/services/upload.service';
import { toUserFacingErrorMessage } from '@/lib/workbench-copy';
import type {
  DocumentAccessScope,
  DocumentContentMetadata,
  IngestionResult,
  IngestionOptions,
  IngestionState,
  IngestionStatus,
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
  documentAccessScope: DocumentAccessScope | null;
  documentAccessScopeError: string | null;
  documentMetadata: DocumentContentMetadata | null;
  documents: KnowledgeDocument[];
  error: string | null;
  ingestionState: IngestionState;
  ingestionOptions: IngestionOptions;
  ingestionStatus: IngestionStatus | null;
  loading: boolean;
  loadingDocuments: boolean;
  loadingPipeline: boolean;
  loadingSpaceMembers: boolean;
  pipelineEvents: PipelineEvent[];
  pipelineJobs: PipelineJob[];
  selectedDocumentId: string | null;
  selectedPipelineJobId: string | null;
  selectedSpaceId: string | null;
  spaceMembers: SpaceMemberDetail[];
  spaceMembersError: string | null;
  spaces: KnowledgeSpace[];
  uploadState: UploadState;
  clearAuth: () => void;
  createSpace: (name: string) => Promise<void>;
  deleteSelectedDocument: () => Promise<void>;
  addSpaceMember: (email: string, role: SpaceMemberRole) => Promise<void>;
  ingestSelectedDocument: () => Promise<void>;
  initialize: () => Promise<void>;
  loadDocuments: (spaceId?: string) => Promise<void>;
  loadSpaceMembers: (spaceId?: string) => Promise<void>;
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
  updateDocumentAccessScope: (accessScope: DocumentAccessScope) => Promise<void>;
  updateSpaceMemberRole: (userId: string, role: SpaceMemberRole) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
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
  documentAccessScope: null,
  documentAccessScopeError: null,
  documentMetadata: null,
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
  loadingDocuments: false,
  loadingPipeline: false,
  loadingSpaceMembers: false,
  pipelineEvents: [],
  pipelineJobs: [],
  selectedDocumentId: null,
  selectedPipelineJobId: null,
  selectedSpaceId: null,
  spaceMembers: [],
  spaceMembersError: null,
  spaces: [],
  uploadState: {
    status: 'idle' as const,
  },
});

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  activeSection: 'dashboard',
  activeTab: 'pipeline',
  authError: null,
  authHydrated: false,
  authLoading: false,
  authToken: '',
  authUser: null,
  documentAccessScope: null,
  documentAccessScopeError: null,
  documentMetadata: null,
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
  loadingDocuments: false,
  loadingPipeline: false,
  loadingSpaceMembers: false,
  pipelineEvents: [],
  pipelineJobs: [],
  selectedDocumentId: null,
  selectedPipelineJobId: null,
  selectedSpaceId: null,
  spaceMembers: [],
  spaceMembersError: null,
  spaces: [],
  uploadState: {
    status: 'idle',
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
      persistSelectedSpaceId(space.id);

      await get().loadDocuments(space.id);
      await get().loadSpaceMembers(space.id);
    } catch (error) {
      set({ error: toErrorMessage(error), loading: false });
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
        documentAccessScope: null,
        documentAccessScopeError: null,
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
          documentAccessScope: null,
          documentAccessScopeError: null,
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
      documentAccessScope: null,
      documentAccessScopeError: null,
      documentMetadata: null,
      error: null,
      ingestionState: { status: 'idle' },
      ingestionStatus: null,
      pipelineEvents: [],
      pipelineJobs: [],
      selectedDocumentId: null,
      selectedPipelineJobId: null,
      selectedSpaceId: spaceId,
      spaceMembers: [],
      spaceMembersError: null,
    });
    persistSelectedSpaceId(spaceId);

    await Promise.all([get().loadDocuments(spaceId), get().loadSpaceMembers(spaceId)]);
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
}));
