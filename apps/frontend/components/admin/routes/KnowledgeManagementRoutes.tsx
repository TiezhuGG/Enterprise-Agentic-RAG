'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, FileArchive, FileText, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { ConsoleEmptyState, ConsoleErrorBanner, ConsolePageHeader, ConsoleStatusBadge } from '@/components/admin/ConsolePagePrimitives';
import { SpaceCreationDialog } from '@/components/workbench/SpaceCreationDialog';
import { SpaceMembersPanel } from '@/components/workbench/SpaceMembersPanel';
import { SpaceProfilePanel } from '@/components/workbench/SpaceProfilePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildConsoleHref, buildKnowledgeBaseHref, type ConsoleRouteKey } from '@/lib/console-routes';
import { pipelineService } from '@/services/pipeline.service';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { PipelineJobStatus, SpacePipelineJob } from '@/types/workbench';

const pipelineStatusLabels: Record<PipelineJobStatus, string> = {
  CANCELED: '已取消',
  FAILED: '失败',
  QUEUED: '排队中',
  RUNNING: '处理中',
  SUCCEEDED: '成功',
};

const knowledgeBaseTypeLabels = {
  CUSTOMER: '客户知识库',
  DEPARTMENT: '部门知识库',
  GENERAL: '通用知识库',
  PROJECT: '项目知识库',
} as const;

const formatKnowledgeBaseDate = (value?: string | null): string => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

export function KnowledgeManagementRoutes({ routeKey, spaceId }: { routeKey: ConsoleRouteKey; spaceId?: string }) {
  if (routeKey === 'document-spaces') {
    return <KnowledgeBaseListPage />;
  }

  if (routeKey === 'knowledge-base-detail') {
    return <KnowledgeBaseDetailPage spaceId={spaceId} />;
  }

  if (routeKey === 'document-tasks') {
    return <DocumentTasksPage />;
  }

  return null;
}

function KnowledgeBaseListPage() {
  const router = useRouter();
  const authUser = useWorkbenchStore((state) => state.authUser);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const [creationOpen, setCreationOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ALL');
  const [type, setType] = useState<'ALL' | keyof typeof knowledgeBaseTypeLabels>('ALL');
  const filteredSpaces = useMemo(
    () => spaces.filter((space) =>
      (type === 'ALL' || space.type === type) &&
      (status === 'ALL' || space.status === status) &&
      `${space.name} ${space.description ?? ''} ${space.department?.name ?? ''}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [keyword, spaces, status, type],
  );

  return (
    <div className="grid min-w-0 gap-4">
      <ConsolePageHeader actions={<Button onClick={() => setCreationOpen(true)}><Plus />创建知识库</Button>} description="知识库是成员、资料和 AI 检索范围的隔离单元。按部门、项目或客户建立独立的知识边界。" title="知识库管理" />
      <div className="grid min-w-0 gap-2 border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <Input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索知识库名称或说明" value={keyword} />
        <Select onValueChange={(value) => setType(value as typeof type)} value={type}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">全部类型</SelectItem>{Object.entries(knowledgeBaseTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select onValueChange={(value) => setStatus(value as typeof status)} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">全部状态</SelectItem><SelectItem value="ACTIVE">使用中</SelectItem><SelectItem value="ARCHIVED">已归档</SelectItem></SelectContent></Select>
      </div>
      {filteredSpaces.length === 0 ? <ConsoleEmptyState action={<Button onClick={() => setCreationOpen(true)}><Plus />创建知识库</Button>} description="创建后即可配置成员、上传资料，并将检索和问答限定在该知识范围内。" icon={Database} title="暂无知识库" /> : <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredSpaces.map((space) => {
        const role = space.members.find((member) => member.userId === authUser?.id)?.role ?? 'VIEWER';
        return <button className="grid min-h-48 min-w-0 content-between border bg-card p-4 text-left transition-colors hover:bg-muted" key={space.id} onClick={() => router.push(buildKnowledgeBaseHref(space.id))} type="button"><div className="min-w-0"><div className="flex items-start justify-between gap-3"><Database className="mt-0.5 size-4 shrink-0 text-primary" /><Badge variant="secondary">{knowledgeBaseTypeLabels[space.type]}</Badge></div><h2 className="mt-4 truncate text-base font-semibold" title={space.name}>{space.name}</h2><p className="mt-1 line-clamp-3 min-h-15 text-sm leading-6 text-muted-foreground">{space.description || '未填写知识库说明。'}</p></div><div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs text-muted-foreground"><span>{space.documentCount} 份文档</span><span>{space.memberCount} 名成员</span><span className="truncate" title={space.department?.name}>归属：{space.department?.name ?? '未绑定部门'}</span><span>你的角色：{role === 'OWNER' ? '负责人' : role === 'EDITOR' ? '编辑者' : '查看者'}</span><span className="col-span-2">更新于 {formatKnowledgeBaseDate(space.updatedAt)}</span></div></button>;
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
  const selectSpace = useWorkbenchStore((state) => state.selectSpace);
  const selectedSpace = spaceId ? spaces.find((space) => space.id === spaceId) ?? null : null;
  const isSynchronized = selectedSpaceId === spaceId;
  const currentMember = selectedSpace?.members.find((member) => member.userId === authUser?.id) ?? (isSynchronized ? spaceMembers.find((member) => member.userId === authUser?.id) : null) ?? null;
  const canDelete = currentMember?.role === 'OWNER';
  const [creationOpen, setCreationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (spaceId && spaceId !== selectedSpaceId && spaces.some((space) => space.id === spaceId)) void selectSpace(spaceId);
  }, [selectedSpaceId, selectSpace, spaceId, spaces]);

  const deleteSpace = async () => {
    if (!selectedSpace || confirmation.trim() !== selectedSpace.name) return;
    await deleteSelectedSpace();
    setDeleteOpen(false);
    setConfirmation('');
    router.replace(buildConsoleHref('document-spaces'));
  };

  return (
    <div className="grid min-w-0 gap-4">
      <ConsolePageHeader actions={selectedSpace && isSynchronized ? <><Button onClick={() => router.push(buildConsoleHref('documents', { space: selectedSpace.id }))} variant="outline"><FileText />管理文档</Button><Button onClick={() => router.push(buildConsoleHref('document-access', { space: selectedSpace.id }))} variant="outline"><ShieldCheck />访问权限</Button></> : undefined} description={selectedSpace ? `知识库管理 / ${selectedSpace.name}` : '知识库详情'} title="知识库详情" />
      {!selectedSpace ? <ConsoleEmptyState action={<Button onClick={() => setCreationOpen(true)}><Plus />创建第一个知识库</Button>} description="创建后即可邀请成员、上传资料，并将检索与问答限定在这个知识范围内。" icon={Database} title="知识库不存在或无访问权限" /> : !isSynchronized ? <Card><CardContent className="grid gap-3 p-4"><div className="h-5 w-48 animate-pulse bg-muted" /><div className="h-4 w-full max-w-2xl animate-pulse bg-muted" /><div className="h-36 w-full animate-pulse bg-muted" /></CardContent></Card> : <>
        <section className="grid min-w-0 gap-4 border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><h2 className="truncate text-base font-semibold" title={selectedSpace.name}>{selectedSpace.name}</h2><Badge variant="secondary">{knowledgeBaseTypeLabels[selectedSpace.type]}</Badge></div><p className="mt-1 max-w-3xl break-words text-sm text-muted-foreground">{selectedSpace.description || '未填写知识库说明。'}</p></div><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>归属部门：{selectedSpace.department?.name ?? '未绑定部门'}</span><span>{spaceMembers.length} 名成员</span></div></section>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2"><div className="min-w-0"><SpaceProfilePanel /></div><div className="min-w-0"><SpaceMembersPanel /></div></div>
        <Card className="min-w-0 border-destructive/30"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{canDelete ? '你是知识库负责人，可以删除该知识库。系统管理员身份不会替代知识库成员角色。' : '仅知识库负责人可以删除知识库；系统管理员身份不会自动获得此权限。'}</p>{canDelete ? <Button onClick={() => setDeleteOpen(true)} variant="destructive"><Trash2 />删除知识库</Button> : null}</CardContent></Card>
      </>}
      <SpaceCreationDialog onOpenChange={setCreationOpen} open={creationOpen} />
      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}><DialogContent><DialogHeader><DialogTitle>删除知识库</DialogTitle><DialogDescription>此操作会停止该知识库的日常访问。请输入知识库名称“{selectedSpace?.name}”确认。</DialogDescription></DialogHeader><Input onChange={(event) => setConfirmation(event.target.value)} placeholder={selectedSpace?.name} value={confirmation} /><DialogFooter><Button onClick={() => setDeleteOpen(false)} variant="outline">取消</Button><Button disabled={!selectedSpace || confirmation.trim() !== selectedSpace.name} onClick={() => void deleteSpace()} variant="destructive"><Trash2 />确认删除</Button></DialogFooter></DialogContent></Dialog>
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
        const result = await pipelineService.listSpaceJobs(selectedSpaceId, {
          limit: 50,
          status: status === 'ALL' ? undefined : status,
        });
        if (!active) return;
        setError(null);
        setJobs(result.items);
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
      <ConsolePageHeader
        actions={<Select onValueChange={(value) => setStatus(value as PipelineJobStatus | 'ALL')} value={status}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">全部状态</SelectItem>{Object.entries(pipelineStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>}
        description="上传后的文档会自动进入队列。这里用于查看等待、处理、失败和重新处理的入库记录。"
        title="入库任务"
      />
      <Card className="min-w-0"><CardContent className="grid gap-3 p-4">
        {!selectedSpaceId ? <ConsoleEmptyState description="请先在顶部选择知识库，再查看其入库任务。" icon={FileArchive} title="尚未选择知识库" /> : null}
        {error ? <ConsoleErrorBanner message={error} /> : null}
        {loading && jobs.length === 0 ? <p className="text-sm text-muted-foreground">正在加载任务...</p> : null}
        {!loading && selectedSpaceId && jobs.length === 0 ? <ConsoleEmptyState description="上传文档后会自动创建入库任务。" icon={FileArchive} title="当前知识库暂无入库任务" /> : null}
        {jobs.map((job) => <article className="grid min-w-0 gap-2 border-b border-border pb-3 text-sm last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={job.id}><div className="min-w-0"><p className="truncate font-medium">{job.document.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{job.latestEvent?.stage ?? '等待处理'} · {formatDateTime(job.updatedAt)}</p></div><ConsoleStatusBadge tone={job.status === 'SUCCEEDED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>{pipelineStatusLabels[job.status]}</ConsoleStatusBadge></article>)}
      </CardContent></Card>
    </div>
  );
}
