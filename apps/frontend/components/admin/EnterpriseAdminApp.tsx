'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileArchive,
  FileText,
  Gauge,
  Loader2,
  LogOut,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { AgentDebugWorkbench } from '@/components/agent-debug';
import { ConsoleShell } from '@/components/admin/ConsoleShell';
import { SpaceCreationDialog } from '@/components/workbench/SpaceCreationDialog';
import { SearchCenter } from '@/components/search';
import { DocumentAccessScopePanel } from '@/components/workbench/DocumentAccessScopePanel';
import { DocumentPreviewPanel } from '@/components/workbench/DocumentPreviewPanel';
import { SpaceProfilePanel } from '@/components/workbench/SpaceProfilePanel';
import { SpaceMembersPanel } from '@/components/workbench/SpaceMembersPanel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { documentService, type DocumentFileBlob } from '@/services/document.service';
import { pipelineService } from '@/services/pipeline.service';
import { useChatStore, type AgentTraceItem, type ChatMessage } from '@/store/chat.store';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { AgentCitation } from '@/types/agent';
import type {
  AppSection,
  DocumentStatus,
  DocumentType,
  KnowledgeDocument,
  PipelineJobStatus,
  SpacePipelineJob,
} from '@/types/workbench';
import { buildConsoleHref, buildKnowledgeBaseHref, consoleRoutes, type ConsoleRouteKey } from '@/lib/console-routes';
import { cn } from '@/lib/utils';

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

const GraphBrowser = dynamic(
  () => import('@/components/graph-browser').then((module) => module.GraphBrowser),
  {
    loading: () => <GraphBrowserLoading />,
    ssr: false,
  },
);

const loginHighlights: Array<{ label: string; icon: LucideIcon }> = [
  { icon: FileText, label: '文档入库' },
  { icon: Bot, label: '智能问答' },
  { icon: Network, label: '知识图谱' },
];

const statusLabel: Record<DocumentStatus, string> = {
  ARCHIVED: '已归档',
  CREATED: '待入库',
  FAILED: '处理失败',
  PROCESSING: '处理中',
  READY: '可检索',
};

const statusVariant: Record<DocumentStatus, BadgeProps['variant']> = {
  ARCHIVED: 'secondary',
  CREATED: 'info',
  FAILED: 'destructive',
  PROCESSING: 'warning',
  READY: 'success',
};

const typeLabel: Record<DocumentType, string> = {
  AUDIO: '音频',
  IMAGE: '图片',
  MARKDOWN: 'Markdown',
  PDF: 'PDF',
  TXT: '文本',
  VIDEO: '视频',
  WORD: 'Word',
};

const statusProgress: Record<DocumentStatus, number> = {
  ARCHIVED: 100,
  CREATED: 18,
  FAILED: 100,
  PROCESSING: 62,
  READY: 100,
};

const statusColor: Record<DocumentStatus, string> = {
  ARCHIVED: '#94a3b8',
  CREATED: '#60a5fa',
  FAILED: '#ef4444',
  PROCESSING: '#f59e0b',
  READY: '#22c55e',
};

const executionSourceLabels: Record<string, string> = {
  agent: 'AI 问答',
  assistant: 'AI 问答',
  chat: 'AI 问答',
  ingestion: '文档入库',
  retrieval: '智能搜索',
  search: '智能搜索',
};

const executionStageLabels: Record<string, string> = {
  'agent-plan': '问题理解',
  'answer-generation': '生成回答',
  chat: 'AI 问答',
  chunking: '文档分块',
  done: '完成',
  embedding: '向量生成',
  'graph-extraction': '图谱抽取',
  graph: '图谱召回',
  ingestion: '文档入库',
  'permission-filter': '权限过滤',
  reranker: '重排序',
  retrieval: '知识检索',
  search: '智能搜索',
  vector: '向量召回',
};

const executionEventTypeLabels: Record<string, string> = {
  error: '异常',
  event: '事件',
  finish: '完成',
  node: '节点',
  start: '开始',
  stage: '阶段',
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const getExecutionSourceLabel = (source: string): string => {
  const normalized = source.toLowerCase();

  return executionSourceLabels[normalized] ?? source;
};

const getExecutionStageLabel = (stage: string): string =>
  executionStageLabels[stage] ?? stage;

const getExecutionEventTypeLabel = (type: string): string =>
  executionEventTypeLabels[type] ?? type;

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
};

const formatSize = (size: number | null): string => {
  if (!size) {
    return '-';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatSpaceVisibility = (visibility?: string | null): string => {
  const labels: Record<string, string> = {
    INTERNAL: '内部可见',
    PRIVATE: '私有',
    PUBLIC: '空间内公开',
  };

  return visibility ? labels[visibility] ?? visibility : '-';
};

const getUserInitial = (email?: string | null): string => {
  if (!email) {
    return '管';
  }

  return email.slice(0, 1).toUpperCase();
};

export function EnterpriseAdminApp({ routeKey, spaceId }: { routeKey: ConsoleRouteKey; spaceId?: string }) {
  const route = consoleRoutes[routeKey];
  const activeSection = route.section;
  const authToken = useWorkbenchStore((state) => state.authToken);
  const error = useWorkbenchStore((state) => state.error);
  const loading = useWorkbenchStore((state) => state.loading);
  const setActiveSection = useWorkbenchStore((state) => state.setActiveSection);
  const initializeObservability = useObservabilityStore((state) => state.initialize);

  useEffect(() => {
    if (authToken) {
      void initializeObservability();
    }
  }, [authToken, initializeObservability]);

  useEffect(() => {
    setActiveSection(route.section);
  }, [route.section, setActiveSection]);

  return (
    <ConsoleShell routeKey={routeKey}>
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <WorkspaceSkeleton /> : <SectionContent activeSection={activeSection} routeKey={routeKey} spaceId={spaceId} />}
    </ConsoleShell>
  );
}


function SectionContent({
  activeSection,
  routeKey,
  spaceId,
}: {
  activeSection: AppSection;
  routeKey: ConsoleRouteKey;
  spaceId?: string;
}) {
  switch (activeSection) {
    case 'assistant':
      return <AssistantPage />;
    case 'documents':
      if (routeKey === 'knowledge-base-detail') {
        return <KnowledgeBaseDetailPage spaceId={spaceId} />;
      }
      if (routeKey === 'document-spaces') {
        return <DocumentSpacesPage />;
      }
      if (routeKey === 'document-tasks') {
        return <DocumentTasksPage />;
      }
      if (routeKey === 'document-access') {
        return <DocumentAccessPage />;
      }
      return <DocumentsPage />;
    case 'graph':
      return <GraphPage />;
    case 'profile':
      return <ProfilePage />;
    case 'search':
      return <SearchPage />;
    case 'system':
      return <SystemPage activeTab={routeKey === 'system-executions' ? 'executions' : routeKey === 'system-debug' ? 'debug' : 'status'} />;
    case 'dashboard':
    default:
      return <DashboardPage />;
  }
}

const workspaceStatusLabels: Record<DocumentStatus, string> = {
  ARCHIVED: '已归档',
  CREATED: '待入库',
  FAILED: '处理失败',
  PROCESSING: '处理中',
  READY: '可检索',
};

const pipelineStatusLabels: Record<PipelineJobStatus, string> = {
  CANCELED: '已取消',
  FAILED: '失败',
  QUEUED: '排队中',
  RUNNING: '处理中',
  SUCCEEDED: '成功',
};

const workspaceSpaceTypeLabels = {
  CUSTOMER: '客户知识库',
  DEPARTMENT: '部门知识库',
  GENERAL: '通用知识库',
  PROJECT: '项目知识库',
} as const;

function DocumentSpacesPage() {
  const router = useRouter();
  const authUser = useWorkbenchStore((state) => state.authUser);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const [creationOpen, setCreationOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ALL');
  const [type, setType] = useState<'ALL' | keyof typeof workspaceSpaceTypeLabels>('ALL');
  const filteredSpaces = useMemo(
    () =>
      spaces.filter((space) =>
        (type === 'ALL' || space.type === type) &&
        (status === 'ALL' || space.status === status) &&
        `${space.name} ${space.description ?? ''}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
    [keyword, spaces, status, type],
  );

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={<Button onClick={() => setCreationOpen(true)}><Plus />创建知识库</Button>}
        description="知识库是成员、资料和 AI 检索范围的隔离单元。按部门、项目或客户建立独立的知识边界。"
        title="知识库管理"
      />
      <div className="grid min-w-0 gap-2 border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <Input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索知识库名称或说明" value={keyword} />
        <Select onValueChange={(value) => setType(value as typeof type)} value={type}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">全部类型</SelectItem>{Object.entries(workspaceSpaceTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={(value) => setStatus(value as typeof status)} value={status}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">全部状态</SelectItem><SelectItem value="ACTIVE">使用中</SelectItem><SelectItem value="ARCHIVED">已归档</SelectItem></SelectContent>
        </Select>
      </div>
      {filteredSpaces.length === 0 ? <EmptyState action={<Button onClick={() => setCreationOpen(true)}><Plus />创建知识库</Button>} description="创建后即可配置成员、上传资料，并将检索和问答限定在该知识范围内。" icon={Database} title="暂无知识库" /> : <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredSpaces.map((space) => {
        const role = space.members.find((member) => member.userId === authUser?.id)?.role ?? 'VIEWER';
        return <button className="grid min-h-48 min-w-0 content-between border bg-card p-4 text-left transition-colors hover:bg-muted" key={space.id} onClick={() => router.push(buildKnowledgeBaseHref(space.id))} type="button"><div className="min-w-0"><div className="flex items-start justify-between gap-3"><Database className="mt-0.5 size-4 shrink-0 text-primary" /><Badge variant="secondary">{workspaceSpaceTypeLabels[space.type]}</Badge></div><h2 className="mt-4 truncate text-base font-semibold" title={space.name}>{space.name}</h2><p className="mt-1 line-clamp-3 min-h-15 text-sm leading-6 text-muted-foreground">{space.description || '未填写知识库说明。'}</p></div><div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs text-muted-foreground"><span>{space.documentCount} 份文档</span><span>{space.memberCount} 名成员</span><span className="truncate">{formatSpaceVisibility(space.visibility)}</span><span>你的角色：{role === 'OWNER' ? '负责人' : role === 'EDITOR' ? '编辑者' : '查看者'}</span><span className="col-span-2">更新于 {formatDateTime(space.updatedAt)}</span></div></button>;
      })}</div>}
      <SpaceCreationDialog onOpenChange={setCreationOpen} open={creationOpen} />
    </div>
  );
}

function KnowledgeBaseDetailPage({ spaceId }: { spaceId?: string }) {
  const router = useRouter();
  const authUser = useWorkbenchStore((state) => state.authUser);
  const deleteSelectedSpace = useWorkbenchStore((state) => state.deleteSelectedSpace);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const selectedSpace = spaceId ? spaces.find((space) => space.id === spaceId) ?? null : null;
  const selectSpace = useWorkbenchStore((state) => state.selectSpace);
  const isSelectedSpaceSynchronized = selectedSpaceId === spaceId;
  const currentMember =
    selectedSpace?.members.find((member) => member.userId === authUser?.id) ??
    (isSelectedSpaceSynchronized ? spaceMembers.find((member) => member.userId === authUser?.id) : null) ??
    null;
  const canDelete = currentMember?.role === 'OWNER';
  const [creationOpen, setCreationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (spaceId && spaceId !== selectedSpaceId && spaces.some((space) => space.id === spaceId)) {
      void selectSpace(spaceId);
    }
  }, [selectedSpaceId, selectSpace, spaceId, spaces]);

  const handleDelete = async () => {
    if (!selectedSpace || deleteConfirmation.trim() !== selectedSpace.name) {
      return;
    }

    await deleteSelectedSpace();
    setDeleteOpen(false);
    setDeleteConfirmation('');
    router.replace(buildConsoleHref('document-spaces'));
  };

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={selectedSpace && isSelectedSpaceSynchronized ? <><Button onClick={() => router.push(buildConsoleHref('documents', { space: selectedSpace.id }))} variant="outline"><FileText />管理文档</Button><Button onClick={() => router.push(buildConsoleHref('document-access', { space: selectedSpace.id }))} variant="outline"><ShieldCheck />访问权限</Button></> : undefined}
        description={selectedSpace ? `知识库管理 / ${selectedSpace.name}` : '知识库详情'}
        title="知识库详情"
      />
      {!selectedSpace ? (
        <EmptyState
          action={<Button onClick={() => setCreationOpen(true)}><Plus />创建第一个知识库</Button>}
          description="创建后即可邀请成员、上传资料，并将检索与问答限定在这个知识范围内。"
          icon={Database}
          title="知识库不存在或无访问权限"
        />
      ) : !isSelectedSpaceSynchronized ? (
        <section className="grid min-w-0 gap-3 border border-border bg-card p-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-36 w-full" />
        </section>
      ) : (
        <>
          <section className="grid min-w-0 gap-4 border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-base font-semibold" title={selectedSpace.name}>{selectedSpace.name}</h2>
                <Badge variant="secondary">{workspaceSpaceTypeLabels[selectedSpace.type]}</Badge>
              </div>
              <p className="mt-1 max-w-3xl break-words text-sm text-muted-foreground">{selectedSpace.description || '未填写空间说明。'}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>可见范围：{formatSpaceVisibility(selectedSpace.visibility)}</span>
              <span>{spaceMembers.length} 名成员</span>
            </div>
          </section>
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <div className="min-w-0"><SpaceProfilePanel /></div>
            <div className="min-w-0"><SpaceMembersPanel /></div>
          </div>
          <Card className="min-w-0 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base">空间生命周期</CardTitle>
              <CardDescription>删除空间会将其从常规工作区中移除，后端继续保留软删除审计记录。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {canDelete
                  ? '你是空间负责人，可以删除该空间。系统管理员身份不会替代空间角色。'
                  : '仅空间负责人可以删除空间；系统管理员身份不会自动获得此权限。'}
              </p>
              {canDelete ? <Button onClick={() => setDeleteOpen(true)} variant="destructive"><Trash2 />删除空间</Button> : null}
            </CardContent>
          </Card>
        </>
      )}
      <SpaceCreationDialog onOpenChange={setCreationOpen} open={creationOpen} />
      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除知识空间</DialogTitle>
            <DialogDescription>
              此操作会停止该空间的日常访问。请输入空间名称“{selectedSpace?.name}”确认。
            </DialogDescription>
          </DialogHeader>
          <Input onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={selectedSpace?.name} value={deleteConfirmation} />
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)} variant="outline">取消</Button>
            <Button disabled={!selectedSpace || deleteConfirmation.trim() !== selectedSpace.name} onClick={() => void handleDelete()} variant="destructive"><Trash2 />确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentAccessPage() {
  const searchParams = useSearchParams();
  const documents = useWorkbenchStore((state) => state.documents);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const documentIdFromUrl = searchParams.get('document');
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;

  useEffect(() => {
    if (
      documentIdFromUrl &&
      documentIdFromUrl !== selectedDocumentId &&
      documents.some((document) => document.id === documentIdFromUrl)
    ) {
      void selectDocument(documentIdFromUrl);
    }
  }, [documentIdFromUrl, documents, selectDocument, selectedDocumentId]);

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        description="为文档设置安全级别和部门访问范围。空间成员角色决定是否可以修改这些规则。"
        title="访问权限"
      />
      <section className="grid min-w-0 gap-3 border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">当前文档</p>
          <p className="mt-1 truncate text-base font-semibold text-foreground" title={selectedDocument?.title}>{selectedDocument?.title ?? '尚未选择文档'}</p>
        </div>
        {selectedDocument ? <Badge variant={statusVariant[selectedDocument.status]}>{workspaceStatusLabels[selectedDocument.status]}</Badge> : null}
      </section>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <Card className="min-w-0">
          <CardHeader><CardTitle>选择文档</CardTitle><CardDescription>先选择需要查看或调整访问范围的文档。</CardDescription></CardHeader>
          <CardContent className="grid max-h-[65vh] gap-1 overflow-auto">
            {documents.length === 0 ? <p className="text-sm text-muted-foreground">当前空间还没有文档。</p> : null}
            {documents.map((document) => (
              <Button className="justify-start" key={document.id} onClick={() => void selectDocument(document.id)} variant={document.id === selectedDocumentId ? 'secondary' : 'ghost'}>
                <FileText className="size-4" /><span className="truncate" title={document.title}>{document.title}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
        <div className="min-w-0"><DocumentAccessScopePanel /></div>
      </div>
    </div>
  );
}

function DocumentTasksPage() {
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<SpacePipelineJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PipelineJobStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!selectedSpaceId) {
      setJobs([]);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const result = await pipelineService.listSpaceJobs(selectedSpaceId, { limit: 50, status: status === 'ALL' ? undefined : status });
        if (active) {
          setError(null);
          setJobs(result.items);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : '加载入库任务失败。');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedSpaceId, status]);

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={<Select onValueChange={(value) => setStatus(value as PipelineJobStatus | 'ALL')} value={status}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">全部状态</SelectItem>{Object.entries(pipelineStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>}
        description="上传后的文档会自动进入队列。这里用于查看等待、处理、失败和重新处理的任务记录。"
        title="入库任务"
      />
      <Card className="min-w-0"><CardContent className="grid gap-3 p-4">
        {!selectedSpaceId ? <p className="text-sm text-muted-foreground">请先在顶部选择知识空间。</p> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {loading && jobs.length === 0 ? <p className="text-sm text-muted-foreground">正在加载任务...</p> : null}
        {!loading && selectedSpaceId && jobs.length === 0 ? <p className="text-sm text-muted-foreground">当前空间暂无入库任务。</p> : null}
        {jobs.map((job) => <article className="grid min-w-0 gap-2 border-b border-border pb-3 text-sm last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={job.id}><div className="min-w-0"><p className="truncate font-medium">{job.document.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{job.latestEvent?.stage ?? '等待处理'} · {formatDateTime(job.updatedAt)}</p></div><Badge className="w-fit" variant={job.status === 'SUCCEEDED' ? 'success' : job.status === 'FAILED' ? 'destructive' : 'warning'}>{pipelineStatusLabels[job.status]}</Badge></article>)}
      </CardContent></Card>
    </div>
  );
}

function DocumentsPage() {
  const router = useRouter();
  const deleteSelectedDocument = useWorkbenchStore((state) => state.deleteSelectedDocument);
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestSelectedDocument = useWorkbenchStore((state) => state.ingestSelectedDocument);
  const ingestionOptions = useWorkbenchStore((state) => state.ingestionOptions);
  const ingestionState = useWorkbenchStore((state) => state.ingestionState);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const setIngestionOptions = useWorkbenchStore((state) => state.setIngestionOptions);
  const uploadDocument = useWorkbenchStore((state) => state.uploadDocument);
  const uploadState = useWorkbenchStore((state) => state.uploadState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [rawPreviewDocument, setRawPreviewDocument] = useState<KnowledgeDocument | null>(null);
  const [rawPreviewFile, setRawPreviewFile] = useState<DocumentFileBlob | null>(null);
  const [rawPreviewLoading, setRawPreviewLoading] = useState(false);
  const [rawPreviewOpen, setRawPreviewOpen] = useState(false);
  const [rawPreviewText, setRawPreviewText] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const filteredDocuments = useMemo(() => documents.filter((document) => document.title.toLowerCase().includes(keyword.trim().toLowerCase()) && (statusFilter === 'ALL' || document.status === statusFilter)), [documents, keyword, statusFilter]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    await uploadDocument(file);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReprocess = async (documentId: string) => {
    await selectDocument(documentId);
    await ingestSelectedDocument();
  };

  const closeRawPreview = () => {
    if (rawPreviewFile) {
      URL.revokeObjectURL(rawPreviewFile.url);
    }
    setRawPreviewDocument(null);
    setRawPreviewFile(null);
    setRawPreviewText(null);
    setRawPreviewLoading(false);
  };

  const handleRawPreview = async (document: KnowledgeDocument) => {
    closeRawPreview();
    setFileActionError(null);
    setRawPreviewDocument(document);
    setRawPreviewOpen(true);
    setRawPreviewLoading(true);

    try {
      const file = await documentService.preview(document);
      setRawPreviewFile(file);
      if (document.type === 'TXT' || document.type === 'MARKDOWN') {
        setRawPreviewText(await file.blob.text());
      }
    } catch (error) {
      setFileActionError(error instanceof Error ? error.message : '原文件预览失败。');
    } finally {
      setRawPreviewLoading(false);
    }
  };

  const handleDownload = async (document: KnowledgeDocument) => {
    setFileActionError(null);
    try {
      await documentService.download(document);
    } catch (error) {
      setFileActionError(error instanceof Error ? error.message : '原文件下载失败。');
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={!selectedSpaceId ? <Button onClick={() => router.push(buildConsoleHref('document-spaces'))} variant="outline"><Database />创建知识空间</Button> : undefined}
        description="在当前知识空间上传资料。系统会自动将文件排队、解析、分块、向量化并建立检索索引。"
        title="文档中心"
      />
      <section className="grid min-w-0 gap-3 border border-border bg-card p-4 md:grid-cols-3">
        <StatusStep label="知识空间" value={selectedSpaceId ? '已选择' : '待选择'} tone={selectedSpaceId ? 'success' : 'default'} />
        <StatusStep label="文档上传" value={uploadState.status === 'uploading' ? '上传中' : file ? '待上传' : '就绪'} tone={uploadState.status === 'uploading' ? 'warning' : 'default'} />
        <StatusStep label="自动入库" value={ingestionState.status === 'queued' ? '排队中' : ingestionState.status === 'running' ? '处理中' : selectedDocument ? workspaceStatusLabels[selectedDocument.status] : '待选择'} tone={selectedDocument?.status === 'READY' ? 'success' : ingestionState.status === 'queued' || ingestionState.status === 'running' ? 'warning' : 'default'} />
      </section>
      {fileActionError ? <ErrorBanner message={fileActionError} /> : null}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>文档列表</CardTitle><CardDescription>当前显示 {filteredDocuments.length} / {documents.length} 份文档。</CardDescription></div><form className="flex flex-wrap gap-2" onSubmit={handleUpload}><input accept={acceptedDocumentTypes} hidden onChange={(event) => setFile(event.target.files?.[0] ?? null)} ref={fileInputRef} type="file" /><Button disabled={!selectedSpaceId || uploadState.status === 'uploading'} onClick={() => fileInputRef.current?.click()} type="button" variant="outline"><UploadCloud />选择文件</Button><Button disabled={!selectedSpaceId || !file || uploadState.status === 'uploading'} type="submit">{uploadState.status === 'uploading' ? <Loader2 className="animate-spin" /> : <UploadCloud />}上传并自动入库</Button></form></div>
            <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_180px]"><Input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索文档名称" value={keyword} /><Select onValueChange={(value) => setStatusFilter(value as DocumentStatus | 'ALL')} value={statusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">全部状态</SelectItem>{Object.entries(workspaceStatusLabels).map(([status, label]) => <SelectItem key={status} value={status}>{label}</SelectItem>)}</SelectContent></Select></div>
            {file ? <p className="text-xs text-muted-foreground">已选择：{file.name}</p> : null}
          </CardHeader>
          <CardContent>
            {!selectedSpaceId ? <EmptyState action={<Button onClick={() => router.push(buildConsoleHref('document-spaces'))} variant="outline">前往知识空间</Button>} description="先创建或选择知识空间，再上传文档。" icon={Database} title="请选择知识空间" /> : loadingDocuments ? <div className="grid gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : filteredDocuments.length === 0 ? <EmptyState description="当前筛选条件下没有文档。" icon={FileText} title="暂无文档" /> : <div className="overflow-x-auto"><Table className="min-w-[720px]"><TableHeader><TableRow><TableHead>文档名称</TableHead><TableHead>类型</TableHead><TableHead>大小</TableHead><TableHead>处理状态</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredDocuments.map((document) => <TableRow className={cn(document.id === selectedDocumentId && 'bg-muted/60')} key={document.id} onClick={() => void selectDocument(document.id)}><TableCell><div className="flex min-w-0 items-center gap-2"><DocumentTypeIcon type={document.type} /><span className="max-w-64 truncate font-medium" title={document.title}>{document.title}</span></div></TableCell><TableCell>{typeLabel[document.type]}</TableCell><TableCell>{formatSize(document.size)}</TableCell><TableCell><div className="grid min-w-32 gap-1"><Badge className="w-fit" variant={statusVariant[document.status]}>{workspaceStatusLabels[document.status]}</Badge><Progress className="h-1.5" value={statusProgress[document.status]} /></div></TableCell><TableCell>{formatDateTime(document.updatedAt)}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /><span className="sr-only">打开操作</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleRawPreview(document); }}><Eye className="size-4" />预览原文件</DropdownMenuItem><DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleDownload(document); }}><Download className="size-4" />下载原文件</DropdownMenuItem><DropdownMenuItem onClick={(event) => { event.stopPropagation(); void selectDocument(document.id); }}><FileText className="size-4" />查看处理详情</DropdownMenuItem><DropdownMenuItem onClick={(event) => { event.stopPropagation(); router.push(buildConsoleHref('document-access', { document: document.id, space: selectedSpaceId })); }}><ShieldCheck className="size-4" />管理访问范围</DropdownMenuItem><DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleReprocess(document.id); }}><RefreshCw className="size-4" />{document.status === 'FAILED' ? '重试入库' : '重新处理'}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={(event) => { event.stopPropagation(); void selectDocument(document.id).then(() => deleteSelectedDocument()); }}><Trash2 className="size-4" />删除文档</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div>}
          </CardContent>
        </Card>
        <div className="grid min-w-0 gap-4">
          <DocumentPreviewPanel />
          <Card className="min-w-0"><CardHeader><CardTitle>文档处理</CardTitle><CardDescription>{selectedDocument?.title ?? '选择一份文档后查看处理状态。'}</CardDescription></CardHeader><CardContent className="grid gap-4">{selectedDocument ? <><div className="grid gap-3 rounded-md border bg-muted/35 p-3 text-sm"><MetricLine label="文档状态" value={workspaceStatusLabels[selectedDocument.status]} /><MetricLine label="分块数量" value={ingestionStatus?.chunkCount ?? '-'} /><MetricLine label="向量数量" value={ingestionStatus?.embeddingCount ?? '-'} /><MetricLine label="图谱实体" value={ingestionStatus?.graphEntityCount ?? '-'} /></div><label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input checked={ingestionOptions.includeGraph} onChange={(event) => setIngestionOptions({ includeGraph: event.target.checked })} type="checkbox" /><span>重新处理时抽取知识图谱</span></label><Button disabled={ingestionState.status === 'queued' || ingestionState.status === 'running'} onClick={() => void ingestSelectedDocument()}>{ingestionState.status === 'queued' || ingestionState.status === 'running' ? <Loader2 className="animate-spin" /> : <RefreshCw />}{ingestionState.status === 'queued' ? '排队中' : ingestionState.status === 'running' ? '处理中' : selectedDocument.status === 'FAILED' ? '重试入库' : '重新处理'}</Button><p className="text-xs leading-6 text-muted-foreground">上传后默认执行解析、分块、向量化和索引。图谱抽取只在重新处理时按当前选项执行。</p></> : <EmptyState description="从文档列表选择一份文档。" icon={FileText} title="未选择文档" />}</CardContent></Card>
        </div>
      </div>
      <Dialog onOpenChange={(open) => { setRawPreviewOpen(open); if (!open) closeRawPreview(); }} open={rawPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>原文件预览</DialogTitle><DialogDescription>{rawPreviewDocument?.title ?? '尚未选择文档'}</DialogDescription></DialogHeader>
          <div className="min-h-[420px] overflow-hidden rounded-md border bg-slate-50">
            {rawPreviewLoading ? <div className="grid h-[420px] place-items-center text-sm text-muted-foreground">正在加载原文件...</div> : rawPreviewDocument?.type === 'PDF' && rawPreviewFile ? <iframe className="h-[70vh] w-full bg-white" src={rawPreviewFile.url} title={rawPreviewDocument.title} /> : rawPreviewDocument?.type === 'IMAGE' && rawPreviewFile ? <div className="grid max-h-[70vh] place-items-center overflow-auto p-4"><Image alt={rawPreviewDocument.title} className="max-h-[66vh] max-w-full rounded-md" height={1000} src={rawPreviewFile.url} unoptimized width={1600} /></div> : rawPreviewText !== null ? <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap bg-white p-4 text-sm leading-7">{rawPreviewText}</pre> : <div className="grid h-[420px] place-items-center p-6 text-center"><div><FileText className="mx-auto mb-3 size-9 text-slate-400" /><p className="font-medium">此文件类型不支持在线预览</p><p className="mt-2 text-sm text-muted-foreground">可下载原文件后在本地查看。</p>{rawPreviewDocument ? <Button className="mt-4" onClick={() => void handleDownload(rawPreviewDocument)} variant="outline"><Download />下载原文件</Button> : null}</div></div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusStep({ label, tone, value }: { label: string; tone: 'default' | 'success' | 'warning'; value: string }) {
  return <div className="min-w-0 border border-border bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{label}</span><Badge variant={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'secondary'}>{value}</Badge></div></div>;
}

function SystemPage({ activeTab }: { activeTab: 'status' | 'executions' | 'debug' }) {
  const authToken = useWorkbenchStore((state) => state.authToken);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const setAuthToken = useWorkbenchStore((state) => state.setAuthToken);
  const executionRuns = useObservabilityStore((state) => state.executionRuns);
  const loadingReadiness = useObservabilityStore((state) => state.loadingReadiness);
  const metricsBreakdown = useObservabilityStore((state) => state.metricsBreakdown);
  const readiness = useObservabilityStore((state) => state.readiness);
  const refresh = useObservabilityStore((state) => state.refresh);
  const selectExecution = useObservabilityStore((state) => state.selectExecution);
  const selectedRun = useObservabilityStore((state) => state.selectedRun);
  const timeline = useObservabilityStore((state) => state.timeline);
  const [manualToken, setManualTokenDraft] = useState(authToken);
  const page = {
    debug: { description: '用于排查认证与 Agent 执行问题的受限工具。', title: '高级调试' },
    executions: { description: '查看检索、问答和入库等操作的执行时间线。', title: '执行记录' },
    status: { description: '监控服务可用性、依赖检查和运行指标。', title: '系统健康' },
  }[activeTab];

  const handleManualToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setAuthToken(manualToken);
  };

  return (
    <div className="grid gap-4">
      <PageHeader actions={<Button onClick={() => void refresh()} variant="outline"><RefreshCw />刷新</Button>} description={page.description} title={page.title} />
      {activeTab === 'status' ? <>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={Gauge} label="总体状态" tone={readiness?.status === 'ok' ? 'success' : 'warning'} value={readiness?.status === 'ok' ? '正常' : '待检查'} />
          <StatCard icon={Activity} label="监控指标" value={metricsBreakdown ? '已接入' : '待刷新'} />
          <StatCard icon={Database} label="检查项" value={readiness?.checks.length ?? 0} />
        </div>
        <Card><CardHeader><CardTitle>服务健康检查</CardTitle><CardDescription>来自 `/health/readiness` 的依赖与服务检查结果。</CardDescription></CardHeader><CardContent>{loadingReadiness ? <div className="grid gap-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> : !readiness ? <EmptyState description="点击刷新获取系统健康状态。" icon={Gauge} title="暂无状态" /> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{readiness.checks.map((check) => <div className="rounded-md border p-3" key={check.name}><div className="flex items-center justify-between gap-2"><span className="font-medium">{check.name}</span><Badge variant={check.status === 'ok' ? 'success' : check.status === 'failed' ? 'destructive' : 'secondary'}>{check.status === 'ok' ? '正常' : check.status === 'failed' ? '失败' : '跳过'}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{check.message ?? `${check.durationMs ?? 0} ms`}</p></div>)}</div>}</CardContent></Card>
      </> : null}
      {activeTab === 'executions' ? <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card><CardHeader><CardTitle>最近执行</CardTitle><CardDescription>{executionRuns.length} 条记录</CardDescription></CardHeader><CardContent className="grid max-h-[65vh] gap-2 overflow-auto">{executionRuns.length === 0 ? <EmptyState description="问答、搜索或入库后会生成执行记录。" icon={Activity} title="暂无记录" /> : executionRuns.map((run) => <button className="rounded-md border p-3 text-left text-sm transition hover:bg-muted" key={run.executionId} onClick={() => void selectExecution(run.executionId)} type="button"><div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{getExecutionSourceLabel(run.source)}</span><Badge variant={run.status === 'SUCCEEDED' ? 'success' : run.status === 'FAILED' ? 'destructive' : 'warning'}>{run.status === 'SUCCEEDED' ? '成功' : run.status === 'FAILED' ? '失败' : '运行中'}</Badge></div><div className="mt-1 text-xs text-muted-foreground">{formatDateTime(run.startedAt)}</div></button>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>执行时间线</CardTitle><CardDescription>{selectedRun?.executionId ?? '选择一条执行记录查看详情。'}</CardDescription></CardHeader><CardContent className="grid gap-3">{timeline.length === 0 ? <EmptyState description="选择执行记录后显示处理节点和耗时。" icon={Activity} title="暂无时间线" /> : timeline.map((event) => <div className="grid gap-2 rounded-md border p-3 text-sm" key={event.id}><div className="flex items-center justify-between gap-2"><span className="font-medium">{getExecutionStageLabel(event.stage)}</span><Badge variant={event.status === 'SUCCEEDED' ? 'success' : event.status === 'FAILED' ? 'destructive' : 'secondary'}>{event.status === 'SUCCEEDED' ? '成功' : event.status === 'FAILED' ? '失败' : '跳过'}</Badge></div><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{getExecutionEventTypeLabel(event.type)}</span><span>{formatDateTime(event.timestamp)}</span><span>{event.durationMs ?? 0} ms</span></div>{event.errorMessage ? <ErrorBanner message={event.errorMessage} /> : null}</div>)}</CardContent></Card>
      </div> : null}
      {activeTab === 'debug' ? <>
        <Card><CardHeader><CardTitle>访问凭证</CardTitle><CardDescription>仅在高级调试场景使用；日常工作区会自动使用当前登录凭证。</CardDescription></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={handleManualToken}><Input onChange={(event) => setManualTokenDraft(event.target.value)} placeholder="粘贴 JWT Token" type="password" value={manualToken} /><Button type="submit" variant="outline">保存凭证</Button><Button onClick={clearAuth} type="button" variant="outline">清除</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle>高级调试面板</CardTitle><CardDescription>用于排查 Agent 的执行链路和节点输出。</CardDescription></CardHeader><CardContent><AgentDebugWorkbench /></CardContent></Card>
      </> : null}
    </div>
  );
}

export function LoginPage() {
  const authError = useWorkbenchStore((state) => state.authError);
  const authHydrated = useWorkbenchStore((state) => state.authHydrated);
  const authLoading = useWorkbenchStore((state) => state.authLoading);
  const authToken = useWorkbenchStore((state) => state.authToken);
  const initialize = useWorkbenchStore((state) => state.initialize);
  const login = useWorkbenchStore((state) => state.login);
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin123!');

  useEffect(() => {
    if (!authHydrated) {
      void initialize();
    }
  }, [authHydrated, initialize]);

  useEffect(() => {
    if (authHydrated && authToken) {
      router.replace('/console');
    }
  }, [authHydrated, authToken, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
    setPassword('');

    if (useWorkbenchStore.getState().authToken) {
      router.replace('/console');
    }
  };

  if (!authHydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <WorkspaceSkeleton />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(420px,0.9fr)_1fr]">
      <section className="hidden items-center justify-center border-r border-border bg-card px-12 lg:flex">
        <div className="max-w-lg">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-6" />
            </span>
            <span className="text-lg font-semibold">企业知识库</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            清晰管理企业知识状态
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
            围绕文档入库、智能检索、AI 问答和引用溯源构建的企业级知识工作台。
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {loginHighlights.map(({ icon: Icon, label }) => (
              <div className="rounded-lg border border-border bg-slate-50 p-4" key={label}>
                <Icon className="mb-3 size-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <BookOpen className="size-7" />
            </div>
            <CardTitle className="text-2xl">登录企业知识库</CardTitle>
            <CardDescription>欢迎登录企业智能知识库系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">账号邮箱</span>
                <Input
                  autoComplete="email"
                  disabled={authLoading}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="请输入账号"
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">登录密码</span>
                <Input
                  autoComplete="current-password"
                  disabled={authLoading}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  type="password"
                  value={password}
                />
              </label>
              {authError ? <ErrorBanner message={authError} /> : null}
              <Button disabled={authLoading || !email.trim() || !password} type="submit">
                {authLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {authLoading ? '正在登录' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function DashboardPage() {
  const router = useRouter();
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const executionRuns = useObservabilityStore((state) => state.executionRuns);
  const readiness = useObservabilityStore((state) => state.readiness);
  const recentDocuments = documents.slice(0, 6);
  const readyCount = documents.filter((document) => document.status === 'READY').length;
  const processingCount = documents.filter((document) => document.status === 'PROCESSING').length;
  const failedCount = documents.filter((document) => document.status === 'FAILED').length;
  const totalSize = documents.reduce((sum, document) => sum + (document.size ?? 0), 0);
  const chartData = useMemo(() => buildDailyDocumentData(documents), [documents]);
  const statusData = useMemo(() => buildStatusData(documents), [documents]);
  const currentSpace = spaces.find((space) => space.id === selectedSpaceId);
  const readyRate = documents.length ? Math.round((readyCount / documents.length) * 100) : 0;
  const chartConfig = {
    count: {
      color: '#2563eb',
      label: '新增文档',
    },
  } satisfies ChartConfig;
  const navigate = (key: ConsoleRouteKey) => router.push(buildConsoleHref(key, { space: selectedSpaceId }));

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('documents')}>
              <UploadCloud />
              上传文档
            </Button>
            <Button onClick={() => navigate('assistant')} variant="outline">
              <Bot />
              发起问答
            </Button>
          </div>
        }
        description="从文档入库、搜索问答到系统健康状态，集中查看企业知识库运行情况。"
        title="仪表盘"
      />

      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={readiness?.status === 'ok' ? 'success' : 'warning'}>
                {readiness?.status === 'ok' ? '系统健康' : '状态待检查'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentSpace ? `当前空间：${currentSpace.name}` : '尚未选择知识空间'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">一眼看到知识状态</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {documents.length > 0
                ? `${documents.length} 份文档中 ${readyCount} 份可检索，解析成功率 ${readyRate}%。`
                : '创建知识空间并上传文档后，这里会显示真实知识状态。'}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <Button
              className="justify-start"
              onClick={() => navigate('documents')}
              variant="outline"
            >
              <UploadCloud />
              上传文档
            </Button>
            <Button
              className="justify-start"
              onClick={() => navigate('search')}
              variant="outline"
            >
              <Search />
              查找知识
            </Button>
            <Button className="justify-start" onClick={() => navigate('assistant')}>
              <Bot />
              发起问答
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Database} label="知识空间" value={spaces.length} />
        <StatCard icon={FileText} label="文档总数" value={documents.length} />
        <StatCard icon={CheckCircle2} label="已解析文档" value={readyCount} />
        <StatCard icon={Bot} label="近期问答" value={executionRuns.length} />
        <StatCard
          icon={Gauge}
          label="系统状态"
          tone={readiness?.status === 'ok' ? 'success' : 'warning'}
          value={readiness?.status === 'ok' ? '正常' : '待检查'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>运营待办</CardTitle>
          <CardDescription>优先处理会影响知识可用性、检索质量和访问范围的事项。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <button className="group border border-border p-3 text-left hover:bg-muted/60" onClick={() => navigate('documents')} type="button">
            <div className="flex items-start justify-between gap-3">
              <FileText className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{documents.length === 0 ? '开始入库' : `${readyCount} 份可检索`}</span>
            </div>
            <p className="mt-3 text-sm font-medium">文档质量</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {documents.length === 0 ? '创建空间后上传首批业务资料。' : `当前解析成功率 ${readyRate}%。`}
            </p>
          </button>
          <button className="group border border-border p-3 text-left hover:bg-muted/60" onClick={() => navigate('document-tasks')} type="button">
            <div className="flex items-start justify-between gap-3">
              <FileArchive className="size-4 text-warning" />
              <span className="text-sm font-semibold text-foreground">{processingCount} 个进行中</span>
            </div>
            <p className="mt-3 text-sm font-medium">入库任务</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">检查解析队列、失败原因和处理进度。</p>
          </button>
          <button className="group border border-border p-3 text-left hover:bg-muted/60" onClick={() => navigate('document-access')} type="button">
            <div className="flex items-start justify-between gap-3">
              <ShieldCheck className="size-4 text-success" />
              <span className="text-sm font-semibold text-foreground">{spaces.length} 个空间</span>
            </div>
            <p className="mt-3 text-sm font-medium">访问治理</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">核查空间范围、文档可见性与成员权限。</p>
          </button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>访问趋势</CardTitle>
              <CardDescription>最近 7 天新增文档趋势</CardDescription>
            </div>
            <Badge variant="info">真实数据</Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-72 w-full" config={chartConfig}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillCount" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="count"
                  fill="url(#fillCount)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>文档状态分布</CardTitle>
            <CardDescription>
              {processingCount > 0 ? `${processingCount} 份文档正在解析` : '当前无解析中的文档'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="mx-auto h-72 max-w-md" config={{}}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={92}
                >
                  {statusData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="grid gap-2 text-sm">
              {statusData.map((entry) => (
                <div className="flex items-center justify-between" key={entry.name}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>近期操作记录</CardTitle>
              <CardDescription>最近更新的文档与执行状态</CardDescription>
            </div>
            <Button onClick={() => navigate('documents')} size="sm" variant="outline">
              查看更多
            </Button>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <div className="grid gap-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : recentDocuments.length === 0 ? (
              <EmptyState
                action={<Button onClick={() => navigate('documents')}>去上传文档</Button>}
                description={
                  selectedSpaceId
                    ? '当前知识空间还没有文档。'
                    : '请选择或创建知识空间后再上传文档。'
                }
                icon={FileText}
                title="暂无文档"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文档名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>更新时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="max-w-[320px] truncate font-medium">
                        {document.title}
                      </TableCell>
                      <TableCell>{typeLabel[document.type]}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[document.status]}>
                          {statusLabel[document.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(document.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>知识库概况</CardTitle>
            <CardDescription>当前空间的基础容量与质量状态</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <MetricLine label="总容量" value={formatSize(totalSize)} />
            <MetricLine
              label="解析成功率"
              value={
                documents.length ? `${Math.round((readyCount / documents.length) * 100)}%` : '-'
              }
            />
            <MetricLine label="失败文档" value={failedCount} />
            <Separator />
            <div className="grid gap-2">
              <p className="text-sm font-medium">推荐下一步</p>
              <Button
                className="justify-start"
                onClick={() => navigate('search')}
                variant="outline"
              >
                <Search />
                试试智能搜索
              </Button>
              <Button
                className="justify-start"
                onClick={() => navigate('graph')}
                variant="outline"
              >
                <Network />
                查看图谱洞察
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SearchPage() {
  return <SearchCenter />;
}

function AssistantPage() {
  const {
    attachments,
    citations,
    conversationId,
    conversations,
    createConversation,
    deleteConversation,
    error,
    initialize,
    messages,
    removeAttachment,
    selectConversation,
    sendMessage,
    streaming,
    streamingMessage,
    trace,
    uploadAttachment,
  } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const visibleMessages = streamingMessage ? [...messages, streamingMessage] : messages;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = messageDraft.trim();

    if (!message || streaming) {
      return;
    }

    void sendMessage(message);
    setMessageDraft('');
  };

  return (
    <div className="grid gap-4">
      <PageHeader
        actions={
          <Button onClick={() => void createConversation()}>
            <Plus />
            新建对话
          </Button>
        }
        description="面向企业知识库的自然语言问答，回答会附带引用来源。"
        title="AI 智能问答"
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid min-h-[calc(100vh-12rem)] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="min-h-0">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>会话列表</CardTitle>
              <CardDescription>{conversations.length} 个会话</CardDescription>
            </div>
            <Button onClick={() => void createConversation()} size="icon" variant="outline">
              <Plus />
            </Button>
          </CardHeader>
          <CardContent className="grid max-h-[62vh] gap-2 overflow-auto">
            {conversations.map((conversation) => (
              <button
                className={cn(
                  'rounded-md border p-3 text-left transition hover:bg-muted',
                  conversation.id === conversationId && 'border-primary bg-accent',
                )}
                key={conversation.id}
                onClick={() => void selectConversation(conversation.id)}
                type="button"
              >
                <div className="line-clamp-1 text-sm font-medium">
                  {conversation.title || '新对话'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(conversation.updatedAt)}
                </div>
              </button>
            ))}
            {conversationId ? (
              <Button onClick={() => void deleteConversation(conversationId)} variant="outline">
                <Trash2 />
                删除当前会话
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="grid min-h-0 grid-rows-[1fr_auto]">
          <CardContent className="min-h-0 overflow-auto p-5">
            {visibleMessages.length === 0 ? (
              <EmptyState
                description="可以询问制度条款、流程要求、文档内容或跨文档关联问题。"
                icon={Bot}
                title="开始一次知识问答"
              />
            ) : (
              <div className="grid gap-4">
                {visibleMessages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </CardContent>
          <form className="border-t p-4" onSubmit={handleSubmit}>
            {attachments.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <Badge
                    key={attachment.clientId}
                    variant={attachment.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {attachment.filename}
                    <button
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      onClick={() => removeAttachment(attachment.clientId)}
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="grid gap-3">
              <Textarea
                disabled={streaming}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="请输入问题，Shift + Enter 换行"
                value={messageDraft}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{messageDraft.length} / 2000</span>
                <div className="flex gap-2">
                  <input
                    accept="image/*,audio/*,video/*"
                    hidden
                    onChange={(event) => {
                      Array.from(event.target.files ?? []).forEach(
                        (file) => void uploadAttachment(file),
                      );
                      event.target.value = '';
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button
                    disabled={streaming}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <UploadCloud />
                    附件
                  </Button>
                  <Button disabled={streaming || !messageDraft.trim()} type="submit">
                    {streaming ? <Loader2 className="animate-spin" /> : <Send />}
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>回答依据</CardTitle>
            <CardDescription>执行过程与引用来源</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="citations">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="citations">引用来源</TabsTrigger>
                <TabsTrigger value="trace">处理过程</TabsTrigger>
              </TabsList>
              <TabsContent className="grid gap-3" value="citations">
                {citations.length === 0 ? (
                  <EmptyState
                    description="发送问题后会显示引用来源。"
                    icon={FileText}
                    title="暂无引用"
                  />
                ) : (
                  <CitationDocumentReferences citations={citations} />
                )}
              </TabsContent>
              <TabsContent className="grid gap-2" value="trace">
                {trace.length === 0 ? (
                  <EmptyState
                    description="系统处理问题时会显示步骤。"
                    icon={Activity}
                    title="暂无过程"
                  />
                ) : (
                  trace.map((item) => <TraceItem item={item} key={item.node} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GraphPage() {
  return <GraphBrowser />;
}

function GraphBrowserLoading() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
      正在加载知识图谱...
    </div>
  );
}

function ProfilePage() {
  const authToken = useWorkbenchStore((state) => state.authToken);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const spaces = useWorkbenchStore((state) => state.spaces);

  return (
    <div className="grid gap-4">
      <PageHeader description="查看当前账号、空间和权限信息。" title="个人中心" />
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="size-20">
              <AvatarFallback className="text-2xl">
                {getUserInitial(authUser?.email)}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{authUser?.email ?? '已登录用户'}</CardTitle>
            <CardDescription>{authUser?.tenantId ?? '当前会话使用本地凭证'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <MetricLine label="登录方式" value={authUser ? '账号密码' : '访问凭证'} />
            <MetricLine label="可访问空间" value={spaces.length} />
            <MetricLine label="凭证状态" value={authToken ? '已保存' : '未保存'} />
            <Button onClick={clearAuth} variant="outline">
              <LogOut />
              退出登录
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>权限与空间</CardTitle>
            <CardDescription>来自登录响应和知识空间接口的真实数据</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <p className="text-sm font-medium">角色</p>
              <div className="flex flex-wrap gap-2">
                {(authUser?.roles.length ? authUser.roles : ['管理员']).map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">权限</p>
              <div className="flex flex-wrap gap-2">
                {(authUser?.permissions.length ? authUser.permissions : ['knowledge.read']).map(
                  (permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ),
                )}
              </div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <p className="text-sm font-medium">知识空间</p>
              {spaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可访问知识空间。</p>
              ) : (
                spaces.map((space) => (
                  <div
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                    key={space.id}
                  >
                    <span>{space.name}</span>
                    <Badge variant={space.visibility === 'PRIVATE' ? 'secondary' : 'info'}>
                      {space.visibility}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PageHeader({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  tone = 'default',
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone?: 'default' | 'success' | 'warning';
  value: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md border',
              tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-600'
                  : 'border-blue-200 bg-blue-50 text-primary',
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-3 truncate text-2xl font-semibold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetricLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  );
}

interface CitationDocumentGroup {
  citations: AgentCitation[];
  document?: KnowledgeDocument;
  documentId: string;
  graphCount: number;
  maxScore: number;
}

function CitationDocumentReferences({ citations }: { citations: AgentCitation[] }) {
  const documents = useWorkbenchStore((state) => state.documents);
  const [extraDocuments, setExtraDocuments] = useState<Record<string, KnowledgeDocument>>({});
  const documentById = useMemo(() => {
    const entries = [...documents, ...Object.values(extraDocuments)].map(
      (document) => [document.id, document] as const,
    );

    return new Map(entries);
  }, [documents, extraDocuments]);
  const groups = useMemo(
    () => buildCitationDocumentGroups(citations, documentById),
    [citations, documentById],
  );

  useEffect(() => {
    const missingDocumentIds = [
      ...new Set(citations.map((citation) => citation.documentId).filter(Boolean)),
    ].filter((documentId) => !documentById.has(documentId));

    if (missingDocumentIds.length === 0) {
      return;
    }

    let canceled = false;

    void Promise.allSettled(
      missingDocumentIds.map((documentId) => documentService.get(documentId)),
    ).then((results) => {
      if (canceled) {
        return;
      }

      const loadedDocuments = results
        .filter(
          (result): result is PromiseFulfilledResult<KnowledgeDocument> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);

      if (loadedDocuments.length === 0) {
        return;
      }

      setExtraDocuments((current) => ({
        ...current,
        ...Object.fromEntries(loadedDocuments.map((document) => [document.id, document])),
      }));
    });

    return () => {
      canceled = true;
    };
  }, [citations, documentById]);

  if (groups.length === 0) {
    return (
      <EmptyState
        description="回答完成后会显示引用过的文档。"
        icon={FileText}
        title="暂无引用文档"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <details className="rounded-md border bg-card p-3 text-sm" key={group.documentId}>
          <summary className="cursor-pointer list-none">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">
                    {group.document?.title ?? `文档 ${group.documentId.slice(0, 8)}`}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{group.document ? typeLabel[group.document.type] : '知识来源'}</span>
                  <span>{group.citations.length} 个片段</span>
                  {group.graphCount > 0 ? <span>{group.graphCount} 条图谱关系</span> : null}
                  <span>最高相关度 {group.maxScore.toFixed(3)}</span>
                </div>
              </div>
              <Badge variant={group.graphCount > 0 ? 'info' : 'secondary'}>
                {group.graphCount > 0 ? '含图谱' : '文档'}
              </Badge>
            </div>
          </summary>
          <div className="mt-3 grid gap-2">
            {group.citations.map((citation, index) => (
              <div
                className="rounded-md border bg-slate-50 p-3 text-xs leading-6"
                key={`${citation.chunkId}-${index}`}
              >
                <div className="mb-1 flex flex-wrap gap-2 text-muted-foreground">
                  <span>片段 {index + 1}</span>
                  <span>相关度 {citation.score.toFixed(3)}</span>
                  {citation.metadata.sectionTitle ? (
                    <span>{String(citation.metadata.sectionTitle)}</span>
                  ) : null}
                </div>
                <p className="line-clamp-4 text-foreground">{citation.content}</p>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
      <Icon className="mb-3 size-8 text-slate-400" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function DocumentTypeIcon({ type }: { type: DocumentType }) {
  const iconClass = 'size-8 rounded-md p-1.5 text-white';
  const iconMap: Partial<Record<DocumentType, [LucideIcon, string]>> = {
    AUDIO: [Activity, 'bg-violet-500'],
    IMAGE: [FileArchive, 'bg-emerald-500'],
    PDF: [FileText, 'bg-red-500'],
    VIDEO: [FileArchive, 'bg-orange-500'],
    WORD: [FileText, 'bg-blue-500'],
  };
  const [Icon, color] = iconMap[type] ?? [FileText, 'bg-slate-500'];

  return <Icon className={cn(iconClass, color)} />;
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const roleLabel =
    message.role === 'assistant' ? 'AI 助手' : message.role === 'user' ? '我' : '系统';

  return (
    <article className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[86%] rounded-lg border px-4 py-3 text-sm leading-7',
          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card',
        )}
      >
        <div
          className={cn(
            'mb-1 text-xs',
            message.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {roleLabel}
          {message.status === 'streaming' ? ' · 正在生成' : ''}
        </div>
        {message.attachments?.length ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {message.attachments.map((attachment) => (
              <Badge key={attachment.id} variant="secondary">
                {attachment.filename}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="prose-text">{renderPlainMarkdown(message.content)}</div>
        {message.role === 'assistant' && message.citations?.length ? (
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">本次回答引用文档</p>
            <CitationDocumentReferences citations={message.citations} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TraceItem({ item }: { item: AgentTraceItem }) {
  const labelMap: Record<string, string> = {
    answer: '生成回答',
    graph: '图谱检索',
    memory: '记忆上下文',
    planner: '问题规划',
    retrieval: '知识检索',
    verification: '答案校验',
  };

  return (
    <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
      <span
        className={cn(
          'mt-1 size-2.5 rounded-full',
          item.status === 'success'
            ? 'bg-emerald-500'
            : item.status === 'failed'
              ? 'bg-red-500'
              : 'bg-amber-500',
        )}
      />
      <div className="min-w-0">
        <p className="font-medium">{labelMap[item.node] ?? item.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.detail ?? item.status}</p>
      </div>
    </div>
  );
}

function buildDailyDocumentData(documents: KnowledgeDocument[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      count: documents.filter((document) => document.createdAt.slice(0, 10) === key).length,
      label: formatDate(date.toISOString()),
    };
  });

  return days;
}

function buildStatusData(documents: KnowledgeDocument[]) {
  const entries = Object.entries(statusLabel).map(([status, name]) => ({
    color: statusColor[status as DocumentStatus],
    name,
    value: documents.filter((document) => document.status === status).length,
  }));

  return entries.some((entry) => entry.value > 0)
    ? entries
    : [{ color: '#dbeafe', name: '暂无数据', value: 1 }];
}

function buildCitationDocumentGroups(
  citations: AgentCitation[],
  documentById: Map<string, KnowledgeDocument>,
): CitationDocumentGroup[] {
  const groups = new Map<string, CitationDocumentGroup>();

  citations.forEach((citation) => {
    const existing = groups.get(citation.documentId);
    const isGraph = citation.chunkId.startsWith('graph:') || Boolean(citation.metadata.graphSource);

    if (!existing) {
      groups.set(citation.documentId, {
        citations: [citation],
        document: documentById.get(citation.documentId),
        documentId: citation.documentId,
        graphCount: isGraph ? 1 : 0,
        maxScore: citation.score,
      });
      return;
    }

    existing.citations.push(citation);
    existing.graphCount += isGraph ? 1 : 0;
    existing.maxScore = Math.max(existing.maxScore, citation.score);
  });

  return [...groups.values()].sort((left, right) => right.maxScore - left.maxScore);
}

function renderPlainMarkdown(content: string) {
  if (!content) {
    return null;
  }

  return content.split('\n').map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <br key={`br-${index}`} />;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <p className="pl-4 before:mr-2 before:content-['•']" key={`li-${index}`}>
          {trimmed.replace(/^[-*]\s+/, '')}
        </p>
      );
    }

    return <p key={`p-${index}`}>{trimmed.replace(/^#+\s*/, '')}</p>;
  });
}
