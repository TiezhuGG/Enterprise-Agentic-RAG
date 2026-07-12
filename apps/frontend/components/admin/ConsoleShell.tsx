'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Building2,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  FileArchive,
  FileText,
  Gauge,
  Home,
  KeyRound,
  LogOut,
  Menu,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SpaceCreationDialog } from '@/components/workbench/SpaceCreationDialog';
import {
  buildConsoleHref,
  buildKnowledgeBaseHref,
  consoleNavigationGroups,
  consoleNavigationItems,
  type ConsoleRouteKey,
} from '@/lib/console-routes';
import { cn } from '@/lib/utils';
import { useObservabilityStore } from '@/store/observability.store';
import { useSearchStore } from '@/store/search.store';
import { useWorkbenchStore } from '@/store/workbench.store';

const navigationIcons: Record<ConsoleRouteKey, LucideIcon> = {
  assistant: Bot,
  dashboard: Home,
  'document-access': ShieldCheck,
  'organization-departments': Building2,
  'document-spaces': Database,
  'document-tasks': FileArchive,
  documents: FileText,
  graph: Network,
  'knowledge-base-detail': Database,
  profile: UserRound,
  search: Search,
  'system-debug': BrainCircuit,
  'system-executions': Activity,
  'system-status': Gauge,
  'user-roles': UsersRound,
};

interface ConsoleShellProps {
  children: ReactNode;
  routeKey: ConsoleRouteKey;
}

export function ConsoleShell({ children, routeKey }: ConsoleShellProps) {
  const isWorkbench = routeKey === 'assistant' || routeKey === 'graph';
  const searchParams = useSearchParams();
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectSpace = useWorkbenchStore((state) => state.setSelectedSpaceFromGlobalSwitcher);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const spaceIdFromUrl = searchParams.get('space');

  useEffect(() => {
    if (
      spaceIdFromUrl &&
      spaceIdFromUrl !== selectedSpaceId &&
      spaces.some((space) => space.id === spaceIdFromUrl)
    ) {
      void selectSpace(spaceIdFromUrl);
    }
  }, [selectedSpaceId, selectSpace, spaceIdFromUrl, spaces]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-sidebar md:block">
          <ConsoleSideNav compact routeKey={routeKey} />
        </aside>
        <div className="min-w-0">
          <ConsoleTopBar routeKey={routeKey} />
          <section className={cn('min-w-0 px-4 py-5 md:px-6 md:py-6 xl:px-8', isWorkbench ? 'w-full' : 'mx-auto w-full max-w-[1360px]')}>
            {children}
          </section>
        </div>
      </div>
      <PasswordChangeDialog />
    </main>
  );
}

function PasswordChangeDialog() {
  const authError = useWorkbenchStore((state) => state.authError);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const changePassword = useWorkbenchStore((state) => state.changePassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const required = authUser?.mustChangePassword ?? false;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const changed = await changePassword(currentPassword, newPassword);
    setSubmitting(false);
    if (changed) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };
  return <Dialog open={required}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>请先修改临时密码</DialogTitle><DialogDescription>为保护组织资料，请在继续使用控制台前设置新密码。</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><label className="grid gap-2 text-sm font-medium">当前临时密码<Input autoFocus onChange={(event) => setCurrentPassword(event.target.value)} type="password" value={currentPassword} /></label><label className="grid gap-2 text-sm font-medium">新密码<Input minLength={6} onChange={(event) => setNewPassword(event.target.value)} type="password" value={newPassword} /></label>{authError ? <p className="text-sm text-destructive">{authError}</p> : null}<DialogFooter><Button disabled={submitting || currentPassword.length < 6 || newPassword.length < 6 || currentPassword === newPassword} type="submit">确认修改</Button></DialogFooter></form></DialogContent></Dialog>;
}

function ConsoleTopBar({ routeKey }: { routeKey: ConsoleRouteKey }) {
  const router = useRouter();
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectSpace = useWorkbenchStore((state) => state.setSelectedSpaceFromGlobalSwitcher);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const search = useSearchStore((state) => state.search);
  const setSearchQuery = useSearchStore((state) => state.setQuery);
  const refresh = useObservabilityStore((state) => state.refresh);
  const [globalQuery, setGlobalQuery] = useState('');
  const [spaceCreationOpen, setSpaceCreationOpen] = useState(false);

  const navigate = (key: ConsoleRouteKey) => {
    router.push(buildConsoleHref(key, { space: selectedSpaceId }));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalQuery.trim();
    if (!query) return;
    setSearchQuery(query);
    navigate('search');
    if (selectedSpaceId) void search({ offset: 0 });
  };

  const handleSpaceChange = async (spaceId: string) => {
    await selectSpace(spaceId);
    router.replace(
      routeKey === 'knowledge-base-detail'
        ? buildKnowledgeBaseHref(spaceId)
        : buildConsoleHref(routeKey, { space: spaceId }),
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:grid-cols-[minmax(180px,0.6fr)_minmax(260px,1fr)_minmax(220px,320px)_auto] md:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="md:hidden" size="icon" variant="ghost"><Menu /><span className="sr-only">打开导航</span></Button>
              </SheetTrigger>
              <SheetContent className="w-[292px] p-0" side="left">
                <SheetHeader className="border-b border-border px-4 py-4 text-left"><SheetTitle>企业知识库</SheetTitle></SheetHeader>
                <ConsoleSideNav routeKey={routeKey} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">企业知识库</div>
              <div className="truncate text-xs text-muted-foreground">{sectionLabel(routeKey)}</div>
            </div>
          </div>

          <form className="hidden min-w-0 md:block" onSubmit={handleSearch}>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-8 border-transparent bg-muted pl-9 pr-14 shadow-none focus-visible:border-ring" onChange={(event) => setGlobalQuery(event.target.value)} placeholder="搜索文档、问题或执行记录" value={globalQuery} />
              <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground xl:inline">Enter</span>
            </div>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden min-w-0 justify-between gap-2 px-3 md:flex" size="sm" variant="outline">
                <Database className="size-4 text-muted-foreground" />
                <span className="min-w-0 truncate">{spaces.find((space) => space.id === selectedSpaceId)?.name ?? '选择知识空间'}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>知识空间</DropdownMenuLabel>
              <div className="px-2 pb-2 text-xs leading-5 text-muted-foreground">文档、检索、问答和图谱均按当前空间隔离。</div>
              <DropdownMenuSeparator />
              {spaces.length === 0 ? <div className="px-2 py-3 text-sm text-muted-foreground">暂无知识空间</div> : spaces.map((space) => (
                <DropdownMenuItem className="items-start gap-2" key={space.id} onClick={() => void handleSpaceChange(space.id)}>
                  <Database className="mt-0.5 size-4" />
                  <span className="min-w-0 flex-1"><span className="block truncate">{space.name}</span><span className="block text-xs text-muted-foreground">{space.visibility === 'PRIVATE' ? '私有空间' : space.visibility === 'PUBLIC' ? '公开空间' : '内部空间'}</span></span>
                  {space.id === selectedSpaceId ? <CheckCircle2 className="size-4 text-success" /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSpaceCreationOpen(true)}><Database className="size-4" />创建知识空间</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button onClick={() => void refresh()} size="icon" title="刷新状态" variant="ghost"><RefreshCw /><span className="sr-only">刷新状态</span></Button>
            <Button size="icon" title="帮助中心" variant="ghost"><CircleHelp /><span className="sr-only">帮助中心</span></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 px-2" variant="ghost"><Avatar className="size-7"><AvatarFallback>{getUserInitial(authUser?.email)}</AvatarFallback></Avatar><span className="hidden max-w-32 truncate text-sm lg:block">{authUser?.email ?? '管理员'}</span><ChevronDown className="size-4 text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>当前账号</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('profile')}><UserRound className="size-4" />个人资料</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('system-status')}><KeyRound className="size-4" />系统设置</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAuth}><LogOut className="size-4" />退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <SpaceCreationDialog onOpenChange={setSpaceCreationOpen} open={spaceCreationOpen} />
    </>
  );
}

function ConsoleSideNav({ compact = false, routeKey }: { compact?: boolean; routeKey: ConsoleRouteKey }) {
  const router = useRouter();
  const documents = useWorkbenchStore((state) => state.documents);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const readiness = useObservabilityStore((state) => state.readiness);
  const activeSpace = spaces.find((space) => space.id === selectedSpaceId);
  const navigate = (key: ConsoleRouteKey) => router.push(buildConsoleHref(key, { space: selectedSpaceId }));

  return (
    <div className="flex h-full min-h-screen flex-col bg-sidebar">
      <button aria-label="返回工作概览" className={cn('flex items-center gap-3 border-b border-border px-3 py-3 text-left', compact && 'justify-center xl:justify-start xl:px-4')} onClick={() => navigate('dashboard')} type="button">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><BookOpen className="size-4" /></span>
        <span className={cn('min-w-0', compact && 'hidden xl:block')}><span className="block truncate text-sm font-semibold">企业知识库</span><span className="block truncate text-[11px] text-muted-foreground">Knowledge Operations</span></span>
      </button>
      <nav className={cn('min-h-0 flex-1 overflow-y-auto py-3', compact ? 'px-2 xl:px-3' : 'px-3')}>
        {consoleNavigationGroups.map((group) => {
          const items = consoleNavigationItems.filter((item) =>
            item.group === group.key &&
            (item.group !== 'governance' || item.key === 'document-access' || authUser?.roles.includes('admin')),
          );
          if (items.length === 0) return null;
          return <div className="mb-4" key={group.key}>
            <p className={cn('mb-1 px-2 text-[11px] font-medium text-muted-foreground', compact && 'hidden xl:block')}>{group.label}</p>
            <div className="grid gap-1">{items.map((item) => {
              const Icon = navigationIcons[item.key];
              const active = item.key === routeKey;
              return <button aria-current={active ? 'page' : undefined} className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', compact && 'justify-center px-2 xl:justify-start xl:px-2.5', active && 'bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground')} key={item.key} onClick={() => navigate(item.key)} title={compact ? item.label : undefined} type="button"><Icon className="size-4 shrink-0" /><span className={cn('truncate', compact && 'hidden xl:block')}>{item.label}</span></button>;
            })}</div>
          </div>;
        })}
      </nav>
      <div className={cn('border-t border-border p-3', compact && 'hidden xl:block')}>
        <div className="border border-border bg-muted/40 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between gap-2"><span className="font-medium text-foreground">当前空间</span><Badge variant={readiness?.status === 'ok' ? 'success' : 'secondary'}>{readiness?.status === 'ok' ? '健康' : '待检查'}</Badge></div>
          <p className="truncate text-muted-foreground">{activeSpace?.name ?? '未选择知识空间'}</p>
          <div className="mt-3 grid grid-cols-2 gap-2"><div className="border border-border bg-card px-2 py-1.5"><div className="text-sm font-semibold text-foreground">{spaces.length}</div><div className="text-[11px] text-muted-foreground">空间</div></div><div className="border border-border bg-card px-2 py-1.5"><div className="text-sm font-semibold text-foreground">{documents.length}</div><div className="text-[11px] text-muted-foreground">文档</div></div></div>
        </div>
      </div>
    </div>
  );
}

function sectionLabel(routeKey: ConsoleRouteKey) {
  return consoleNavigationGroups.find((group) => consoleNavigationItems.some((item) => item.key === routeKey && item.group === group.key))?.label ?? '控制台';
}

function getUserInitial(email?: string | null) {
  return email?.slice(0, 1).toUpperCase() ?? '管';
}
