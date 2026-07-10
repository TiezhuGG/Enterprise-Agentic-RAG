'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  FileArchive,
  FileText,
  FolderOpen,
  Gauge,
  GitBranch,
  Grid2X2,
  History,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Network,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { AgentDebugWorkbench } from '@/components/agent-debug';
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
  DropdownMenuLabel,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore, type AgentTraceItem, type ChatMessage } from '@/store/chat.store';
import { useObservabilityStore } from '@/store/observability.store';
import { useSearchStore } from '@/store/search.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { AgentCitation } from '@/types/agent';
import type { AppSection, DocumentStatus, DocumentType, KnowledgeDocument } from '@/types/workbench';
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

const mainNav: Array<{ section: AppSection; label: string; icon: LucideIcon }> = [
  { icon: Home, label: '首页大盘', section: 'dashboard' },
  { icon: FolderOpen, label: '文档管理', section: 'documents' },
  { icon: Search, label: '智能搜索', section: 'search' },
  { icon: Bot, label: 'AI智能问答', section: 'assistant' },
  { icon: Network, label: '知识图谱', section: 'graph' },
  { icon: UserRound, label: '个人中心', section: 'profile' },
  { icon: Settings, label: '系统管理', section: 'system' },
];

const loginHighlights: Array<{ label: string; icon: LucideIcon }> = [
  { icon: FileText, label: '文档入库' },
  { icon: Bot, label: '智能问答' },
  { icon: Network, label: '知识图谱' },
];

const sectionSubNav: Record<AppSection, Array<{ label: string; icon: LucideIcon }>> = {
  assistant: [
    { icon: Plus, label: '新建对话' },
    { icon: History, label: '历史会话' },
    { icon: FileText, label: '引用来源' },
  ],
  dashboard: [
    { icon: Grid2X2, label: '数据总览' },
    { icon: Activity, label: '访问分析' },
    { icon: FileArchive, label: '文档统计' },
    { icon: Bell, label: '系统公告' },
  ],
  documents: [
    { icon: FileText, label: '我的文档' },
    { icon: Building2, label: '公共文档' },
    { icon: Users, label: '部门文档' },
    { icon: FileArchive, label: '文档归档' },
  ],
  graph: [
    { icon: Network, label: '全局图谱' },
    { icon: GitBranch, label: '关系洞察' },
    { icon: BarChart3, label: '图谱统计' },
  ],
  profile: [
    { icon: UserRound, label: '个人资料' },
    { icon: ShieldCheck, label: '权限信息' },
    { icon: KeyRound, label: '访问凭证' },
  ],
  search: [
    { icon: History, label: '搜索历史' },
    { icon: Sparkles, label: '推荐问题' },
    { icon: FileText, label: '结果来源' },
  ],
  system: [
    { icon: Gauge, label: '系统状态' },
    { icon: Activity, label: '执行记录' },
    { icon: BrainCircuit, label: '高级调试' },
  ],
};

const statusLabel: Record<DocumentStatus, string> = {
  ARCHIVED: '已归档',
  CREATED: '待解析',
  FAILED: '解析失败',
  PROCESSING: '解析中',
  READY: '解析完成',
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

const getUserInitial = (email?: string | null): string => {
  if (!email) {
    return '管';
  }

  return email.slice(0, 1).toUpperCase();
};

export function EnterpriseAdminApp() {
  const activeSection = useWorkbenchStore((state) => state.activeSection);
  const authToken = useWorkbenchStore((state) => state.authToken);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const error = useWorkbenchStore((state) => state.error);
  const initialize = useWorkbenchStore((state) => state.initialize);
  const loading = useWorkbenchStore((state) => state.loading);
  const setActiveSection = useWorkbenchStore((state) => state.setActiveSection);
  const initializeObservability = useObservabilityStore((state) => state.initialize);
  const refreshObservability = useObservabilityStore((state) => state.refresh);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (authToken) {
      void initializeObservability();
    }
  }, [authToken, initializeObservability]);

  if (!authToken) {
    return <LoginPage />;
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-5">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="lg:hidden" size="icon" variant="ghost">
                  <Menu />
                  <span className="sr-only">打开导航</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72 p-0" side="left">
                <SheetHeader className="border-b px-4 py-4">
                  <SheetTitle>企业智能知识库系统</SheetTitle>
                </SheetHeader>
                <MobileNav activeSection={activeSection} onNavigate={setActiveSection} />
              </SheetContent>
            </Sheet>

            <button
              className="flex min-w-fit items-center gap-2 text-left"
              onClick={() => setActiveSection('dashboard')}
              type="button"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="size-5" />
              </span>
              <span className="hidden text-sm font-semibold sm:block">企业智能知识库系统</span>
            </button>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              {mainNav.map((item) => (
                <Button
                  className={cn(
                    'h-14 rounded-none border-b-2 border-transparent px-4',
                    activeSection === item.section &&
                      'border-primary bg-transparent text-primary hover:bg-transparent',
                  )}
                  key={item.section}
                  onClick={() => setActiveSection(item.section)}
                  variant="ghost"
                >
                  {item.label}
                </Button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => void refreshObservability()} size="icon" variant="ghost">
                    <RefreshCw />
                    <span className="sr-only">刷新状态</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>刷新系统状态</TooltipContent>
              </Tooltip>
              <Button size="icon" variant="ghost">
                <Bell />
                <span className="sr-only">通知</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 px-2" variant="ghost">
                    <Avatar className="size-8">
                      <AvatarFallback>{getUserInitial(authUser?.email)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm md:block">
                      {authUser?.email ?? '管理员'}
                    </span>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>当前账号</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveSection('profile')}>
                    <UserRound className="size-4" />
                    个人中心
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSection('system')}>
                    <Settings className="size-4" />
                    系统管理
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearAuth}>
                    <LogOut className="size-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="hidden border-r bg-card lg:block">
            <PageSideNav activeSection={activeSection} />
          </aside>

          <section className="min-w-0 p-4 lg:p-5">
            {error ? <ErrorBanner message={error} /> : null}
            {loading ? <WorkspaceSkeleton /> : <SectionContent activeSection={activeSection} />}
          </section>
        </div>
      </main>
    </TooltipProvider>
  );
}

function MobileNav({
  activeSection,
  onNavigate,
}: {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}) {
  return (
    <nav className="grid gap-1 p-3">
      {mainNav.map((item) => {
        const Icon = item.icon;

        return (
          <button
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground',
              activeSection === item.section && 'bg-accent text-primary',
            )}
            key={item.section}
            onClick={() => onNavigate(item.section)}
            type="button"
          >
            <Icon className="size-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function PageSideNav({ activeSection }: { activeSection: AppSection }) {
  const items = sectionSubNav[activeSection];
  const documents = useWorkbenchStore((state) => state.documents);
  const spaces = useWorkbenchStore((state) => state.spaces);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-5">
        <p className="text-sm font-semibold">{mainNav.find((item) => item.section === activeSection)?.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">当前空间 {spaces.length || 0} 个，文档 {documents.length || 0} 份</p>
      </div>
      <nav className="grid gap-1 p-3">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
                index === 0 && 'bg-accent text-primary',
              )}
              key={item.label}
              type="button"
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-3">
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
            <PanelLeft className="size-3.5" />
            可扩展后台
          </div>
          后续搜索接口和图谱浏览接口接入后，可直接扩展当前页面。
        </div>
      </div>
    </div>
  );
}

function SectionContent({ activeSection }: { activeSection: AppSection }) {
  switch (activeSection) {
    case 'assistant':
      return <AssistantPage />;
    case 'documents':
      return <DocumentsPage />;
    case 'graph':
      return <GraphPage />;
    case 'profile':
      return <ProfilePage />;
    case 'search':
      return <SearchPage />;
    case 'system':
      return <SystemPage />;
    case 'dashboard':
    default:
      return <DashboardPage />;
  }
}

function LoginPage() {
  const authError = useWorkbenchStore((state) => state.authError);
  const authLoading = useWorkbenchStore((state) => state.authLoading);
  const login = useWorkbenchStore((state) => state.login);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin123!');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
    setPassword('');
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden items-center justify-center bg-[#edf4ff] px-12 lg:flex">
        <div className="max-w-xl">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-6" />
            </span>
            <span className="text-lg font-semibold">企业智能知识库系统</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-slate-950">让企业知识更好找、更好问、更好用</h1>
          <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
            汇聚企业文档、知识空间、智能问答和引用溯源，把原本面向工程演示的工作台整理成普通用户也能理解的知识库后台。
          </p>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {loginHighlights.map(({ icon: Icon, label }) => (
              <div className="rounded-lg border border-blue-100 bg-white/70 p-4" key={label}>
                <Icon className="mb-3 size-6 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md border-slate-200 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <BookOpen className="size-7" />
            </div>
            <CardTitle className="text-2xl">登录系统</CardTitle>
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
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const setActiveSection = useWorkbenchStore((state) => state.setActiveSection);
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
  const chartConfig = {
    count: {
      color: '#1677ff',
      label: '新增文档',
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setActiveSection('documents')}>
              <UploadCloud />
              上传文档
            </Button>
            <Button onClick={() => setActiveSection('assistant')} variant="outline">
              <Bot />
              发起问答
            </Button>
          </div>
        }
        description="从文档入库、搜索问答到系统健康状态，集中查看企业知识库运行情况。"
        title="首页大盘"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="count" fill="url(#fillCount)" stroke="#1677ff" strokeWidth={2} type="monotone" />
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
                <Pie data={statusData} dataKey="value" innerRadius={58} nameKey="name" outerRadius={92}>
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
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
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
            <Button onClick={() => setActiveSection('documents')} size="sm" variant="outline">
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
                action={<Button onClick={() => setActiveSection('documents')}>去上传文档</Button>}
                description={selectedSpaceId ? '当前知识空间还没有文档。' : '请选择或创建知识空间后再上传文档。'}
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
                      <TableCell className="max-w-[320px] truncate font-medium">{document.title}</TableCell>
                      <TableCell>{typeLabel[document.type]}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[document.status]}>{statusLabel[document.status]}</Badge>
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
            <MetricLine label="解析成功率" value={documents.length ? `${Math.round((readyCount / documents.length) * 100)}%` : '-'} />
            <MetricLine label="失败文档" value={failedCount} />
            <Separator />
            <div className="grid gap-2">
              <p className="text-sm font-medium">推荐下一步</p>
              <Button className="justify-start" onClick={() => setActiveSection('search')} variant="outline">
                <Search />
                试试智能搜索
              </Button>
              <Button className="justify-start" onClick={() => setActiveSection('graph')} variant="outline">
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

function DocumentsPage() {
  const createSpace = useWorkbenchStore((state) => state.createSpace);
  const deleteSelectedDocument = useWorkbenchStore((state) => state.deleteSelectedDocument);
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestSelectedDocument = useWorkbenchStore((state) => state.ingestSelectedDocument);
  const ingestionOptions = useWorkbenchStore((state) => state.ingestionOptions);
  const ingestionState = useWorkbenchStore((state) => state.ingestionState);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const loading = useWorkbenchStore((state) => state.loading);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const selectSpace = useWorkbenchStore((state) => state.selectSpace);
  const setIngestionOptions = useWorkbenchStore((state) => state.setIngestionOptions);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const uploadDocument = useWorkbenchStore((state) => state.uploadDocument);
  const uploadState = useWorkbenchStore((state) => state.uploadState);
  const metadata = useWorkbenchStore((state) => state.documentMetadata);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createSpaceName, setCreateSpaceName] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const matchKeyword = document.title.toLowerCase().includes(keyword.trim().toLowerCase());
        const matchStatus = statusFilter === 'ALL' || document.status === statusFilter;

        return matchKeyword && matchStatus;
      }),
    [documents, keyword, statusFilter],
  );

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    await uploadDocument(file);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createSpace(createSpaceName);
    setCreateSpaceName('');
  };

  return (
    <div className="grid gap-4">
      <PageHeader
        actions={
          <form className="flex flex-wrap gap-2" onSubmit={handleCreateSpace}>
            <Input
              className="w-44"
              onChange={(event) => setCreateSpaceName(event.target.value)}
              placeholder="新建知识空间"
              value={createSpaceName}
            />
            <Button disabled={loading || !createSpaceName.trim()} type="submit" variant="outline">
              <Plus />
              创建
            </Button>
          </form>
        }
        description="上传、解析、筛选和管理企业知识库文档。"
        title="文档管理"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>我的文档</CardTitle>
                <CardDescription>共 {documents.length} 份文档，当前显示 {filteredDocuments.length} 份</CardDescription>
              </div>
              <form className="flex flex-wrap gap-2" onSubmit={handleUpload}>
                <input
                  accept={acceptedDocumentTypes}
                  hidden
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  ref={fileInputRef}
                  type="file"
                />
                <Button
                  disabled={!selectedSpaceId || uploadState.status === 'uploading'}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  <UploadCloud />
                  选择文件
                </Button>
                <Button disabled={!selectedSpaceId || !file || uploadState.status === 'uploading'} type="submit">
                  {uploadState.status === 'uploading' ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  批量上传
                </Button>
              </form>
            </div>
            <div className="grid gap-2 md:grid-cols-[240px_1fr_180px]">
              <Select disabled={loading || spaces.length === 0} onValueChange={(value) => void selectSpace(value)} value={selectedSpaceId ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="选择知识空间" />
                </SelectTrigger>
                <SelectContent>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索文档名称" value={keyword} />
              <Select onValueChange={(value) => setStatusFilter(value as DocumentStatus | 'ALL')} value={statusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部状态</SelectItem>
                  {Object.entries(statusLabel).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {file ? <p className="text-xs text-muted-foreground">已选择：{file.name}</p> : null}
          </CardHeader>
          <CardContent>
            {!selectedSpaceId ? (
              <EmptyState description="创建或选择知识空间后，即可上传文档。" icon={FolderOpen} title="请选择知识空间" />
            ) : loadingDocuments ? (
              <div className="grid gap-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState description="当前筛选条件下没有文档。" icon={FileText} title="暂无文档" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文档名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>解析状态</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow
                      className={cn(document.id === selectedDocumentId && 'bg-muted/60')}
                      key={document.id}
                      onClick={() => void selectDocument(document.id)}
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <DocumentTypeIcon type={document.type} />
                          <span className="truncate font-medium">{document.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{typeLabel[document.type]}</TableCell>
                      <TableCell>{formatSize(document.size)}</TableCell>
                      <TableCell>
                        <div className="grid min-w-32 gap-1">
                          <Badge className="w-fit" variant={statusVariant[document.status]}>
                            {statusLabel[document.status]}
                          </Badge>
                          <Progress className="h-1.5" value={statusProgress[document.status]} />
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(document.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal />
                              <span className="sr-only">打开操作</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                void selectDocument(document.id);
                                setDetailOpen(true);
                              }}
                            >
                              <CircleHelp className="size-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                void selectDocument(document.id).then(() => ingestSelectedDocument());
                              }}
                            >
                              <RefreshCw className="size-4" />
                              重新解析
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                void selectDocument(document.id).then(() => deleteSelectedDocument());
                              }}
                            >
                              <Trash2 className="size-4" />
                              删除文档
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>解析与详情</CardTitle>
            <CardDescription>{selectedDocument ? selectedDocument.title : '选择文档后查看详情'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedDocument ? (
              <>
                <div className="grid gap-3 rounded-md border bg-muted/35 p-3 text-sm">
                  <MetricLine label="文档状态" value={statusLabel[selectedDocument.status]} />
                  <MetricLine label="分块数量" value={ingestionStatus?.chunkCount ?? '-'} />
                  <MetricLine label="向量数量" value={ingestionStatus?.embeddingCount ?? '-'} />
                  <MetricLine label="图谱实体" value={ingestionStatus?.graphEntityCount ?? '-'} />
                </div>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    checked={ingestionOptions.includeGraph}
                    onChange={(event) => setIngestionOptions({ includeGraph: event.target.checked })}
                    type="checkbox"
                  />
                  <span>解析时抽取知识图谱</span>
                </label>
                <Button
                  disabled={ingestionState.status === 'running'}
                  onClick={() => void ingestSelectedDocument()}
                >
                  {ingestionState.status === 'running' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  {ingestionState.status === 'running' ? '解析中' : '开始解析'}
                </Button>
                <Button onClick={() => setDetailOpen(true)} variant="outline">
                  <FileText />
                  查看元数据
                </Button>
                <Separator />
                <div className="text-xs leading-6 text-muted-foreground">
                  默认会执行文本解析、分块、向量化和索引。图谱抽取会调用现有入库参数，不会新增后端接口。
                </div>
              </>
            ) : (
              <EmptyState description="从左侧文档表格选择一份文档。" icon={FileText} title="未选择文档" />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setDetailOpen} open={detailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>文档元数据</DialogTitle>
            <DialogDescription>{selectedDocument?.title ?? '暂无选中文档'}</DialogDescription>
          </DialogHeader>
          {metadata ? (
            <div className="grid max-h-[60vh] gap-3 overflow-auto rounded-md border p-3 text-sm md:grid-cols-2">
              <MetricLine label="文档类型" value={typeLabel[metadata.documentType]} />
              <MetricLine label="语言" value={metadata.language} />
              <MetricLine label="安全级别" value={metadata.securityLevel} />
              <MetricLine label="解析器" value={metadata.parser} />
              <MetricLine label="内容长度" value={metadata.contentLength} />
              <MetricLine label="行数" value={metadata.lineCount} />
              <MetricLine label="处理时间" value={formatDateTime(metadata.processedAt)} />
              <MetricLine label="清洗后字符" value={metadata.cleaner.outputLength} />
            </div>
          ) : (
            <EmptyState description="文档解析完成后会显示元数据。" icon={FileText} title="暂无元数据" />
          )}
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SearchPage() {
  const answer = useSearchStore((state) => state.answer);
  const citations = useSearchStore((state) => state.citations);
  const error = useSearchStore((state) => state.error);
  const history = useSearchStore((state) => state.history);
  const query = useSearchStore((state) => state.query);
  const running = useSearchStore((state) => state.running);
  const search = useSearchStore((state) => state.search);
  const setQuery = useSearchStore((state) => state.setQuery);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const [resultType, setResultType] = useState<'ALL' | 'DOCUMENT' | 'GRAPH'>('ALL');

  const filteredCitations = citations.filter((citation) => {
    if (resultType === 'ALL') {
      return true;
    }

    if (resultType === 'GRAPH') {
      return citation.chunkId.startsWith('graph:') || Boolean(citation.metadata.graphSource);
    }

    return !citation.chunkId.startsWith('graph:');
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void search();
  };

  return (
    <div className="grid gap-4">
      <PageHeader description="用自然语言检索知识库，并查看引用来源。" title="智能搜索" />

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_120px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入关键词、制度名称或业务问题"
                  value={query}
                />
              </div>
              <Button className="h-11" disabled={!query.trim() || running || !selectedSpaceId} type="submit">
                {running ? <Loader2 className="animate-spin" /> : <Search />}
                搜索
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>结果类型</span>
              <Select onValueChange={(value) => setResultType(value as typeof resultType)} value={resultType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部结果</SelectItem>
                  <SelectItem value="DOCUMENT">文档引用</SelectItem>
                  <SelectItem value="GRAPH">图谱关系</SelectItem>
                </SelectContent>
              </Select>
              {!selectedSpaceId ? <Badge variant="warning">请先选择知识空间</Badge> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>搜索摘要</CardTitle>
              <CardDescription>由现有 AI 问答接口生成，结果会基于引用来源呈现。</CardDescription>
            </CardHeader>
            <CardContent>
              {running && !answer ? (
                <div className="grid gap-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : answer ? (
                <div className="prose-text">{renderPlainMarkdown(answer)}</div>
              ) : (
                <EmptyState description="输入问题后，系统会返回摘要和命中文档。" icon={Search} title="等待搜索" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>相关结果</CardTitle>
                <CardDescription>{filteredCitations.length} 条引用来源</CardDescription>
              </div>
              <Badge variant="info">来自 citations</Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {running && filteredCitations.length === 0 ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : filteredCitations.length === 0 ? (
                <EmptyState description="当前没有可展示的引用来源。" icon={FileText} title="暂无结果" />
              ) : (
                filteredCitations.map((citation, index) => (
                  <CitationResultCard citation={citation} index={index + 1} key={`${citation.documentId}-${citation.chunkId}-${index}`} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>搜索历史</CardTitle>
            <CardDescription>最近 10 次搜索记录</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {history.length === 0 ? (
              <EmptyState description="搜索完成后会保存在这里。" icon={History} title="暂无历史" />
            ) : (
              history.map((item) => (
                <button
                  className="rounded-md border p-3 text-left text-sm transition hover:bg-muted"
                  key={item.id}
                  onClick={() => setQuery(item.query)}
                  type="button"
                >
                  <div className="line-clamp-2 font-medium">{item.query}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt)} · {item.citations.length} 条来源
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
        title="AI智能问答"
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
                <div className="line-clamp-1 text-sm font-medium">{conversation.title || '新对话'}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(conversation.updatedAt)}</div>
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
                  <Badge key={attachment.clientId} variant={attachment.status === 'error' ? 'destructive' : 'secondary'}>
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
                      Array.from(event.target.files ?? []).forEach((file) => void uploadAttachment(file));
                      event.target.value = '';
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button disabled={streaming} onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
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
                  <EmptyState description="发送问题后会显示引用来源。" icon={FileText} title="暂无引用" />
                ) : (
                  citations.map((citation, index) => (
                    <CitationResultCard citation={citation} index={index + 1} key={`${citation.documentId}-${citation.chunkId}`} />
                  ))
                )}
              </TabsContent>
              <TabsContent className="grid gap-2" value="trace">
                {trace.length === 0 ? (
                  <EmptyState description="系统处理问题时会显示步骤。" icon={Activity} title="暂无过程" />
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
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const readiness = useObservabilityStore((state) => state.readiness);
  const searchHistory = useSearchStore((state) => state.history);
  const graphCheck = readiness?.checks.find((check) => check.name === 'graph');
  const graphCitations = searchHistory.flatMap((item) =>
    item.citations.filter((citation) => citation.chunkId.startsWith('graph:') || Boolean(citation.metadata.graphSource)),
  );
  const graphRelations = graphCitations.slice(0, 6);

  return (
    <div className="grid gap-4">
      <PageHeader description="第一版展示图谱状态、图谱计数和问答中返回的关系引用。" title="知识图谱" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Network} label="图谱服务" tone={graphCheck?.status === 'ok' ? 'success' : 'warning'} value={graphCheck?.status === 'ok' ? '正常' : '待检查'} />
        <StatCard icon={FileText} label="当前文档" value={selectedDocument ? '已选择' : '未选择'} />
        <StatCard icon={Sparkles} label="图谱实体" value={ingestionStatus?.graphEntityCount ?? 0} />
        <StatCard icon={GitBranch} label="图谱关系" value={ingestionStatus?.graphRelationCount ?? 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>关系图谱预览</CardTitle>
            <CardDescription>
              {selectedDocument ? `当前文档：${selectedDocument.title}` : '选择文档并启用图谱抽取后查看关系'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {graphRelations.length > 0 ? (
              <div className="relative min-h-96 overflow-hidden rounded-md border bg-[#f8fbff] p-8">
                <GraphPreview citations={graphRelations} />
              </div>
            ) : (
              <EmptyState
                action={<Badge variant="info">待接入节点浏览 API</Badge>}
                description="当前后端尚未提供图谱节点浏览接口。启用图谱抽取并发起相关问答后，这里会展示返回的关系引用。"
                icon={Network}
                title="暂无可视化关系"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>图谱洞察统计</CardTitle>
            <CardDescription>基于现有状态与引用来源汇总</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <MetricLine label="当前图谱状态" value={graphCheck?.status === 'ok' ? '可用' : '未就绪'} />
            <MetricLine label="最近图谱引用" value={graphCitations.length} />
            <MetricLine label="文档图谱实体" value={ingestionStatus?.graphEntityCount ?? '-'} />
            <MetricLine label="文档图谱关系" value={ingestionStatus?.graphRelationCount ?? '-'} />
            <Separator />
            <div className="grid gap-2">
              <p className="text-sm font-medium">最近关系引用</p>
              {graphCitations.slice(0, 4).length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无图谱引用。</p>
              ) : (
                graphCitations.slice(0, 4).map((citation, index) => (
                  <div className="rounded-md border p-2 text-xs" key={`${citation.chunkId}-${index}`}>
                    {String(citation.metadata.graphSource ?? '实体')} → {String(citation.metadata.graphTarget ?? '实体')}
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
              <AvatarFallback className="text-2xl">{getUserInitial(authUser?.email)}</AvatarFallback>
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
                {(authUser?.permissions.length ? authUser.permissions : ['knowledge.read']).map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <p className="text-sm font-medium">知识空间</p>
              {spaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可访问知识空间。</p>
              ) : (
                spaces.map((space) => (
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm" key={space.id}>
                    <span>{space.name}</span>
                    <Badge variant={space.visibility === 'PRIVATE' ? 'secondary' : 'info'}>{space.visibility}</Badge>
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

function SystemPage() {
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

  const handleManualToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setAuthToken(manualToken);
  };

  return (
    <div className="grid gap-4">
      <PageHeader
        actions={
          <Button onClick={() => void refresh()} variant="outline">
            <RefreshCw />
            刷新全部
          </Button>
        }
        description="查看系统可用性、执行记录和高级调试工具。"
        title="系统管理"
      />

      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-3 lg:w-[520px]">
          <TabsTrigger value="status">系统状态</TabsTrigger>
          <TabsTrigger value="executions">执行记录</TabsTrigger>
          <TabsTrigger value="debug">高级调试</TabsTrigger>
        </TabsList>

        <TabsContent className="grid gap-4" value="status">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={Gauge} label="总体状态" tone={readiness?.status === 'ok' ? 'success' : 'warning'} value={readiness?.status === 'ok' ? '正常' : '降级'} />
            <StatCard icon={Activity} label="监控指标" value={metricsBreakdown ? '已接入' : '待刷新'} />
            <StatCard icon={Database} label="检查项" value={readiness?.checks.length ?? 0} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>服务健康检查</CardTitle>
              <CardDescription>来自 `/health/readiness` 的检查结果</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReadiness ? (
                <div className="grid gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : !readiness ? (
                <EmptyState description="点击刷新全部获取健康状态。" icon={Gauge} title="暂无状态" />
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {readiness.checks.map((check) => (
                    <div className="rounded-md border p-3" key={check.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{readinessLabel(check.name)}</span>
                        <Badge variant={check.status === 'ok' ? 'success' : check.status === 'failed' ? 'destructive' : 'secondary'}>
                          {check.status === 'ok' ? '正常' : check.status === 'failed' ? '失败' : '跳过'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{check.message ?? `${check.durationMs ?? 0} ms`}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="grid gap-4" value="executions">
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>最近执行</CardTitle>
                <CardDescription>{executionRuns.length} 条记录</CardDescription>
              </CardHeader>
              <CardContent className="grid max-h-[65vh] gap-2 overflow-auto">
                {executionRuns.length === 0 ? (
                  <EmptyState description="问答或搜索后会生成执行记录。" icon={Activity} title="暂无记录" />
                ) : (
                  executionRuns.map((run) => (
                    <button
                      className="rounded-md border p-3 text-left text-sm transition hover:bg-muted"
                      key={run.executionId}
                      onClick={() => void selectExecution(run.executionId)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{run.source}</span>
                        <Badge variant={run.status === 'SUCCEEDED' ? 'success' : run.status === 'FAILED' ? 'destructive' : 'warning'}>
                          {run.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(run.startedAt)}</div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>执行时间线</CardTitle>
                <CardDescription>{selectedRun ? selectedRun.executionId : '选择一条执行记录查看详情'}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {timeline.length === 0 ? (
                  <EmptyState description="选择执行记录后显示节点步骤。" icon={Activity} title="暂无时间线" />
                ) : (
                  timeline.map((event) => (
                    <div className="grid gap-2 rounded-md border p-3 text-sm" key={event.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{event.stage}</span>
                        <Badge variant={event.status === 'SUCCEEDED' ? 'success' : event.status === 'FAILED' ? 'destructive' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{event.type}</span>
                        <span>{formatDateTime(event.timestamp)}</span>
                        <span>{event.durationMs ?? 0} ms</span>
                      </div>
                      {event.errorMessage ? <ErrorBanner message={event.errorMessage} /> : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="grid gap-4" value="debug">
          <Card>
            <CardHeader>
              <CardTitle>访问凭证</CardTitle>
              <CardDescription>仅高级调试场景使用，普通用户无需手动填写。</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={handleManualToken}>
                <Input
                  onChange={(event) => setManualTokenDraft(event.target.value)}
                  placeholder="粘贴 JWT Token"
                  type="password"
                  value={manualToken}
                />
                <Button type="submit" variant="outline">
                  保存凭证
                </Button>
                <Button onClick={clearAuth} type="button" variant="outline">
                  清除
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>高级调试面板</CardTitle>
              <CardDescription>保留原有工程调试能力，便于排查 Agent 执行链路。</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentDebugWorkbench />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            tone === 'success'
              ? 'bg-emerald-50 text-emerald-600'
              : tone === 'warning'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-blue-50 text-primary',
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-normal">{value}</p>
        </div>
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
    <div className="grid place-items-center rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center">
      <Icon className="mb-3 size-8 text-muted-foreground" />
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

function CitationResultCard({ citation, index }: { citation: AgentCitation; index: number }) {
  const isGraph = citation.chunkId.startsWith('graph:') || Boolean(citation.metadata.graphSource);

  return (
    <article className="rounded-md border p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isGraph ? 'info' : 'secondary'}>{isGraph ? '图谱关系' : '文档引用'}</Badge>
        <span className="font-medium">结果 {index}</span>
        <span className="text-xs text-muted-foreground">相关度 {citation.score.toFixed(3)}</span>
      </div>
      <h3 className="mt-3 line-clamp-1 font-semibold">
        {String(citation.metadata.sectionTitle ?? citation.metadata.documentType ?? '知识来源')}
      </h3>
      <p className="mt-2 line-clamp-3 leading-6 text-muted-foreground">{citation.content}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{citation.documentId}</span>
        <span>{citation.chunkId}</span>
      </div>
    </article>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const roleLabel = message.role === 'assistant' ? 'AI 助手' : message.role === 'user' ? '我' : '系统';

  return (
    <article className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[86%] rounded-lg border px-4 py-3 text-sm leading-7',
          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card',
        )}
      >
        <div className={cn('mb-1 text-xs', message.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
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
          item.status === 'success' ? 'bg-emerald-500' : item.status === 'failed' ? 'bg-red-500' : 'bg-amber-500',
        )}
      />
      <div className="min-w-0">
        <p className="font-medium">{labelMap[item.node] ?? item.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.detail ?? item.status}</p>
      </div>
    </div>
  );
}

function GraphPreview({ citations }: { citations: AgentCitation[] }) {
  const relations = citations.map((citation, index) => ({
    source: String(citation.metadata.graphSource ?? `实体${index + 1}`),
    target: String(citation.metadata.graphTarget ?? `关联${index + 1}`),
    type: String(citation.metadata.graphType ?? '关联'),
  }));
  const center = relations[0]?.source ?? '企业知识';

  return (
    <div className="relative mx-auto h-80 max-w-3xl">
      <div className="absolute left-1/2 top-1/2 z-10 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-center text-sm font-medium text-primary-foreground shadow">
        {center}
      </div>
      {relations.map((relation, index) => {
        const angle = (index / Math.max(relations.length, 1)) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 34;
        const y = 50 + Math.sin(angle) * 34;

        return (
          <div key={`${relation.source}-${relation.target}-${index}`}>
            <div
              className="absolute h-px origin-left bg-blue-200"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}rad)`,
                width: '32%',
              }}
            />
            <div
              className="absolute z-20 min-w-28 rounded-lg border bg-white px-3 py-2 text-center text-xs shadow-sm"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="font-medium">{relation.target}</div>
              <div className="mt-1 text-muted-foreground">{relation.type}</div>
            </div>
          </div>
        );
      })}
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

  return entries.some((entry) => entry.value > 0) ? entries : [{ color: '#dbeafe', name: '暂无数据', value: 1 }];
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

function readinessLabel(name: string) {
  const labels: Record<string, string> = {
    asr: '语音识别',
    database: '数据库',
    embedding: '向量模型',
    graph: '图数据库',
    llm: '大模型',
    ocr: 'OCR',
    redis: '缓存',
    reranker: '重排模型',
    search: '搜索引擎',
    storage: '对象存储',
    vector: '向量库',
    video: '视频理解',
  };

  return labels[name] ?? name;
}
