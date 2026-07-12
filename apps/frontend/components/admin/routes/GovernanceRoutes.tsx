'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, KeyRound, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { DocumentAccessScopePanel } from '@/components/workbench/DocumentAccessScopePanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsoleEmptyState, ConsoleErrorBanner, ConsolePageHeader, ConsoleStatusBadge } from '@/components/admin/ConsolePagePrimitives';
import { getDisplayPermission, getDisplaySystemRole, getDisplayUserName } from '@/lib/identity-copy';
import { useGovernanceStore } from '@/store/governance.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { AuthorizationAuditUser } from '@/types/governance';
import type { ConsoleRouteKey } from '@/lib/console-routes';

const spaceRoleLabels = {
  EDITOR: '编辑者',
  OWNER: '负责人',
  VIEWER: '查看者',
} as const;

const spaceRoleCapabilities = {
  EDITOR: '可维护资料与访问范围',
  OWNER: '可管理成员、资料、访问范围和生命周期',
  VIEWER: '仅可访问被授权资料',
} as const;

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('zh-CN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));

export function GovernanceRoutes({ routeKey }: { routeKey: ConsoleRouteKey }) {
  if (routeKey === 'document-access') {
    return <DocumentAccessPage />;
  }

  return <UserRolesPage />;
}

function DocumentAccessPage() {
  const documents = useWorkbenchStore((state) => state.documents);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;

  return (
    <div className="grid min-w-0 gap-4">
      <ConsolePageHeader
        description="为当前知识库中的文档配置访问范围。空间成员角色决定谁可以维护策略，文档策略决定资料可被谁检索。"
        title="访问权限"
      />
      <div className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>选择文档</CardTitle>
            <CardDescription>先选择需要配置策略的文档。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {documents.length === 0 ? <ConsoleEmptyState description="当前知识库还没有可配置权限的文档。" icon={Database} title="暂无文档" /> : documents.map((document) => (
              <button className={`flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${document.id === selectedDocumentId ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'}`} key={document.id} onClick={() => void selectDocument(document.id)} type="button">
                <Database className="size-4 shrink-0" />
                <span className="truncate" title={document.title}>{document.title}</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <div className="min-w-0">
          {selectedDocument ? <DocumentAccessScopePanel /> : <ConsoleEmptyState description="从左侧列表选择文档后查看和维护其访问策略。" icon={ShieldCheck} title="尚未选择文档" />}
        </div>
      </div>
    </div>
  );
}

function UserRolesPage() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const canReadUsers = authUser?.permissions.includes('user.read') ?? false;
  const error = useGovernanceStore((state) => state.error);
  const [keyword, setKeyword] = useState('');
  const loading = useGovernanceStore((state) => state.loading);
  const loadAuthorizationAudit = useGovernanceStore((state) => state.loadAuthorizationAudit);
  const roles = useGovernanceStore((state) => state.roles);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const users = useGovernanceStore((state) => state.users);

  useEffect(() => {
    if (!canReadUsers) return;

    void loadAuthorizationAudit();
  }, [canReadUsers, loadAuthorizationAudit]);

  useEffect(() => {
    if (!selectedUserId && users[0]) setSelectedUserId(users[0].id);
  }, [selectedUserId, users]);

  const filteredUsers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => `${user.name ?? ''} ${user.email} ${user.department?.name ?? ''}`.toLowerCase().includes(normalized));
  }, [keyword, users]);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null;

  if (!canReadUsers) {
    return (
      <div className="grid min-w-0 gap-4">
        <ConsolePageHeader description="仅拥有系统用户读取权限的管理员可以查看组织用户、系统角色和知识库成员身份。" title="用户与角色" />
        <ConsoleEmptyState description="当前账号没有查看组织用户和系统授权信息的权限。请联系系统管理员。" icon={ShieldCheck} title="无权查看用户治理信息" />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <ConsolePageHeader
        description="系统角色控制平台级能力；知识库成员身份仅控制单个知识库内的资料与协作权限。两者独立叠加。"
        title="用户与角色"
      />
      <section className="grid min-w-0 gap-3 border border-border bg-card p-4 md:grid-cols-3">
        <AuthorizationPrinciple icon={KeyRound} title="系统角色" description="admin、user 决定平台级接口和治理能力。" />
        <AuthorizationPrinciple icon={Database} title="知识库成员身份" description="负责人、编辑者、查看者仅在加入的知识库中生效。" />
        <AuthorizationPrinciple icon={ShieldCheck} title="有效权限" description="系统管理员不会自动成为任何知识库的负责人。" />
      </section>
      {error ? <ConsoleErrorBanner message={error} /> : null}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>组织用户</CardTitle>
                <CardDescription>{users.length} 名用户，按系统角色和知识库成员身份审计。</CardDescription>
              </div>
              <Input className="md:w-64" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索姓名、邮箱或部门" value={keyword} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="grid gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : filteredUsers.length === 0 ? <ConsoleEmptyState description="调整搜索条件，或确认当前租户已创建用户。" icon={UsersRound} title="没有匹配的用户" /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">用户</th><th className="px-3 py-2 font-medium">系统角色</th><th className="px-3 py-2 font-medium">组织归属</th><th className="px-3 py-2 font-medium">知识库身份</th><th className="px-3 py-2 font-medium">状态</th></tr></thead><tbody>{filteredUsers.map((user) => <tr className={`cursor-pointer border-b last:border-0 ${user.id === selectedUser?.id ? 'bg-muted/60' : 'hover:bg-muted/40'}`} key={user.id} onClick={() => setSelectedUserId(user.id)}><td className="px-3 py-3"><div className="min-w-0"><p className="truncate font-medium">{getDisplayUserName(user.name, user.email)}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{user.roles.map((role) => <Badge key={role.code} variant="secondary">{getDisplaySystemRole(role).name}</Badge>)}</div></td><td className="max-w-48 px-3 py-3"><span className="block truncate" title={user.department?.name ?? user.organization?.name ?? undefined}>{user.department?.name ?? user.organization?.name ?? '未分配'}</span></td><td className="px-3 py-3">{user.spaceMemberships.length} 个知识库</td><td className="px-3 py-3"><ConsoleStatusBadge tone={user.isActive ? 'success' : 'default'}>{user.isActive ? '启用' : '已停用'}</ConsoleStatusBadge></td></tr>)}</tbody></table></div>}
          </CardContent>
        </Card>
        <UserAuthorizationDetail user={selectedUser} />
      </div>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>系统角色与权限</CardTitle>
          <CardDescription>以下为平台级角色定义；知识库成员角色不在此处配置。</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 md:grid-cols-2">
          {roles.map((role) => { const copy = getDisplaySystemRole(role); return <article className="min-w-0 border p-3" key={role.code}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{copy.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.description}</p></div><ConsoleStatusBadge tone={role.isSystem ? 'info' : 'default'}>{role.isSystem ? '系统角色' : '自定义角色'}</ConsoleStatusBadge></div><div className="mt-3 flex flex-wrap gap-1">{role.permissions.map((permission) => <PermissionBadge key={permission} permission={permission} variant="secondary" />)}</div></article>; })}
        </CardContent>
      </Card>
    </div>
  );
}

function AuthorizationPrinciple({ description, icon: Icon, title }: { description: string; icon: typeof Database; title: string }) {
  return <div className="min-w-0 border bg-slate-50 p-3"><Icon className="mb-2 size-4 text-primary" /><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>;
}

function UserAuthorizationDetail({ user }: { user: AuthorizationAuditUser | null }) {
  if (!user) {
    return <ConsoleEmptyState description="从用户列表选择一个账号，查看其系统角色、知识库成员身份和有效能力。" icon={UserRound} title="尚未选择用户" />;
  }

  const permissions = [...new Set(user.roles.flatMap((role) => role.permissions))];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="truncate">{getDisplayUserName(user.name, user.email)}</CardTitle>
        <CardDescription className="truncate">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 text-sm">
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">系统角色与权限</p>
          <div className="flex flex-wrap gap-1">{user.roles.map((role) => <Badge key={role.code} variant="secondary">{getDisplaySystemRole(role).name}</Badge>)}</div>
          <div className="mt-2 flex flex-wrap gap-1">{permissions.length === 0 ? <span className="text-xs text-muted-foreground">未分配系统权限</span> : permissions.map((permission) => <PermissionBadge key={permission} permission={permission} variant="outline" />)}</div>
        </section>
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">知识库成员身份</p>
          {user.spaceMemberships.length === 0 ? <p className="text-xs leading-5 text-muted-foreground">未加入任何知识库。系统角色不会自动授予知识库访问权限。</p> : <div className="grid gap-2">{user.spaceMemberships.map((membership) => <div className="min-w-0 border p-2.5" key={membership.space.id}><div className="flex min-w-0 items-start gap-2"><span className="min-w-0 flex-1 truncate font-medium" title={membership.space.name}>{membership.space.name}</span><ConsoleStatusBadge className="shrink-0 whitespace-nowrap" tone={membership.role === 'OWNER' ? 'success' : membership.role === 'EDITOR' ? 'info' : 'default'}>{spaceRoleLabels[membership.role]}</ConsoleStatusBadge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{spaceRoleCapabilities[membership.role]}</p></div>)}</div>}
        </section>
        <section className="border-t pt-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">有效能力说明</p>
          <p className="text-xs leading-5 text-muted-foreground">平台级能力由系统角色决定；对知识库的资料、成员和生命周期操作仅在对应成员身份范围内有效。</p>
          <p className="mt-2 text-xs text-muted-foreground">创建于 {formatDate(user.createdAt)}</p>
        </section>
      </CardContent>
    </Card>
  );
}

function PermissionBadge({ permission, variant }: { permission: string; variant: 'outline' | 'secondary' }) {
  const copy = getDisplayPermission(permission);
  return <Badge className="max-w-full gap-1.5" title={copy.description} variant={variant}><span>{copy.name}</span><code className="shrink-0 text-[10px] text-muted-foreground">{permission}</code></Badge>;
}
