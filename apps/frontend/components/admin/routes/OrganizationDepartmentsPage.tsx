'use client';

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, FolderTree, Pencil, Plus, Power, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConsoleEmptyState, ConsoleErrorBanner, ConsolePageHeader, ConsoleStatusBadge } from '@/components/admin/ConsolePagePrimitives';
import { enterpriseService } from '@/services/enterprise.service';
import { useEnterpriseStore } from '@/store/enterprise.store';
import { buildConsoleHref } from '@/lib/console-routes';
import type { EnterpriseDepartment, EnterpriseDisableCheck, EnterpriseOrganization } from '@/types/enterprise';

type DepartmentDialogState = { department?: EnterpriseDepartment; organization: EnterpriseOrganization } | null;
type DisableTarget =
  | { item: EnterpriseDepartment; kind: 'department' }
  | { item: EnterpriseOrganization; kind: 'organization' }
  | null;

export function OrganizationDepartmentsPage() {
  const router = useRouter();
  const createDepartment = useEnterpriseStore((state) => state.createDepartment);
  const createOrganization = useEnterpriseStore((state) => state.createOrganization);
  const error = useEnterpriseStore((state) => state.error);
  const loadStructure = useEnterpriseStore((state) => state.loadStructure);
  const loading = useEnterpriseStore((state) => state.loading);
  const structure = useEnterpriseStore((state) => state.structure);
  const updateDepartment = useEnterpriseStore((state) => state.updateDepartment);
  const updateOrganization = useEnterpriseStore((state) => state.updateOrganization);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  const [organizationEdit, setOrganizationEdit] = useState<EnterpriseOrganization | null>(null);
  const [departmentDialog, setDepartmentDialog] = useState<DepartmentDialogState>(null);
  const [disableCheck, setDisableCheck] = useState<EnterpriseDisableCheck | null>(null);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableTarget, setDisableTarget] = useState<DisableTarget>(null);

  useEffect(() => { void loadStructure(); }, [loadStructure]);
  useEffect(() => {
    if (!selectedOrganizationId && structure?.organizations[0]) setSelectedOrganizationId(structure.organizations[0].id);
  }, [selectedOrganizationId, structure]);
  useEffect(() => {
    if (!disableTarget) {
      setDisableCheck(null);
      setDisableError(null);
      return;
    }

    let active = true;
    setDisableLoading(true);
    setDisableError(null);
    const request = disableTarget.kind === 'department'
      ? enterpriseService.getDepartmentDisableCheck(disableTarget.item.id)
      : enterpriseService.getOrganizationDisableCheck(disableTarget.item.id);
    void request.then((result) => {
      if (active) setDisableCheck(result);
    }).catch((requestError) => {
      if (active) setDisableError(requestError instanceof Error ? requestError.message : '无法检查停用依赖。');
    }).finally(() => {
      if (active) setDisableLoading(false);
    });
    return () => { active = false; };
  }, [disableTarget]);

  const organization = structure?.organizations.find((item) => item.id === selectedOrganizationId) ?? null;
  const activeDepartments = organization?.departments.filter((item) => item.status === 'ACTIVE').length ?? 0;

  return <div className="grid min-w-0 gap-4">
    <ConsolePageHeader
      actions={<Button onClick={() => setOrganizationDialogOpen(true)}><Plus />创建组织</Button>}
      description="组织和部门用于定义人员归属、知识库业务归属与文档附加限制。它们不会自动授予知识库访问权限。"
      title="组织与部门"
    />
    {error ? <ConsoleErrorBanner message={error} /> : null}
    <section className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>当前租户</CardTitle>
          <CardDescription>{structure?.tenant ? `${structure.tenant.name} · ${structure.tenant.code}` : '正在加载租户信息'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {loading && !structure ? <p className="text-sm text-muted-foreground">正在加载组织结构…</p> : structure?.organizations.length ? structure.organizations.map((item) => <button className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border p-3 text-left text-sm ${item.id === organization?.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`} key={item.id} onClick={() => setSelectedOrganizationId(item.id)} type="button"><span className="min-w-0"><span className="block truncate font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{item.departments.length} 个部门</span></span><ConsoleStatusBadge tone={item.status === 'ACTIVE' ? 'success' : 'default'}>{item.status === 'ACTIVE' ? '启用' : '已停用'}</ConsoleStatusBadge></button>) : <ConsoleEmptyState description="先创建组织，再建立部门和用户归属。" icon={Building2} title="暂无组织" />}
        </CardContent>
      </Card>
      <Card className="min-w-0">
        {!organization ? <CardContent className="py-16"><ConsoleEmptyState description="选择或创建一个组织以管理其部门层级。" icon={FolderTree} title="尚未选择组织" /></CardContent> : <>
          <CardHeader className="gap-3 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><CardTitle className="truncate">{organization.name}</CardTitle><CardDescription>共 {organization.departments.length} 个部门，其中 {activeDepartments} 个启用。部门最多四层，停用前需先重新分配关联用户与知识库。</CardDescription></div><div className="flex shrink-0 gap-2"><Button onClick={() => setOrganizationEdit(organization)} size="icon" title="编辑组织" variant="outline"><Pencil /></Button><Button disabled={organization.status === 'DISABLED'} onClick={() => setDisableTarget({ item: organization, kind: 'organization' })} size="icon" title="停用组织" variant="outline"><Power /></Button><Button disabled={organization.status === 'DISABLED'} onClick={() => setDepartmentDialog({ organization })}><Plus />创建部门</Button></div></div>
          </CardHeader>
          <CardContent className="p-0"><DepartmentTree departments={organization.departments} onEdit={(department) => setDepartmentDialog({ department, organization })} onDisable={(department) => setDisableTarget({ item: department, kind: 'department' })} /></CardContent>
        </>}
      </Card>
    </section>
    <OrganizationDialog onOpenChange={setOrganizationDialogOpen} onSubmit={createOrganization} open={organizationDialogOpen} />
    <OrganizationDialog editing={organizationEdit} onOpenChange={(open) => { if (!open) setOrganizationEdit(null); }} onSubmit={async (name) => organizationEdit ? updateOrganization(organizationEdit.id, { name }) : false} open={Boolean(organizationEdit)} />
    <DepartmentDialog onOpenChange={(open) => { if (!open) setDepartmentDialog(null); }} onSubmit={async (input) => {
      if (!departmentDialog) return false;
      if (departmentDialog.department) return updateDepartment(departmentDialog.department.id, input);
      return createDepartment({
        name: input.name,
        organizationId: departmentDialog.organization.id,
        ...(input.parentId ? { parentId: input.parentId } : {}),
      });
    }} open={Boolean(departmentDialog)} organization={departmentDialog?.organization ?? null} editing={departmentDialog?.department} />
    <Dialog onOpenChange={(open) => { if (!open) setDisableTarget(null); }} open={Boolean(disableTarget)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>停用{disableTarget?.kind === 'department' ? '部门' : '组织'}</DialogTitle>
          <DialogDescription>“{disableTarget?.item.name}”停用后不能再分配新用户或知识库。</DialogDescription>
        </DialogHeader>
        {disableLoading ? <p className="text-sm text-muted-foreground">正在检查关联数据...</p> : disableError ? <ConsoleErrorBanner message={disableError} /> : disableCheck ? <div className="grid gap-3 text-sm"><p className={disableCheck.canDisable ? 'text-muted-foreground' : 'font-medium text-destructive'}>{disableCheck.canDisable ? '未发现阻塞依赖，可以停用。' : '请先处理以下依赖后再停用。'}</p>{disableCheck.activeDepartmentCount > 0 ? <p>{disableCheck.activeDepartmentCount} 个启用部门仍归属此组织。</p> : null}{disableCheck.activeChildDepartmentCount > 0 ? <p>{disableCheck.activeChildDepartmentCount} 个启用下级部门仍归属此部门。</p> : null}{disableCheck.userCount > 0 ? <p>{disableCheck.userCount} 名用户仍归属此部门。</p> : null}{disableCheck.knowledgeBaseCount > 0 ? <p>{disableCheck.knowledgeBaseCount} 个知识库仍绑定此部门。</p> : null}</div> : null}
        <DialogFooter className="flex-wrap"><Button onClick={() => setDisableTarget(null)} variant="outline">取消</Button>{disableCheck?.userCount ? <Button onClick={() => router.push(buildConsoleHref('user-roles'))} variant="outline">查看关联用户</Button> : null}{(disableCheck?.knowledgeBaseCount || disableCheck?.activeDepartmentCount) ? <Button onClick={() => router.push(buildConsoleHref('document-spaces'))} variant="outline">查看关联知识库</Button> : null}<Button disabled={disableLoading || !disableCheck?.canDisable || !disableTarget} onClick={() => { if (!disableTarget) return; const update = disableTarget.kind === 'department' ? updateDepartment(disableTarget.item.id, { status: 'DISABLED' }) : updateOrganization(disableTarget.item.id, { status: 'DISABLED' }); void update.then((success) => { if (success) setDisableTarget(null); }); }} variant="destructive"><Power />确认停用</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function DepartmentTree({ departments, onDisable, onEdit }: { departments: EnterpriseDepartment[]; onDisable: (department: EnterpriseDepartment) => void; onEdit: (department: EnterpriseDepartment) => void }) {
  const byParent = useMemo(() => departments.reduce<Record<string, EnterpriseDepartment[]>>((groups, department) => {
    const key = department.parentId ?? 'root';
    (groups[key] ??= []).push(department);
    return groups;
  }, {}), [departments]);
  const renderNode = (department: EnterpriseDepartment, depth: number): ReactNode => <li key={department.id}><div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3" style={{ paddingLeft: `${Math.min(depth, 3) * 24 + 16}px` }}><ChevronRight className="size-4 text-muted-foreground" /><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><span className="truncate font-medium">{department.name}</span><ConsoleStatusBadge tone={department.status === 'ACTIVE' ? 'success' : 'default'}>{department.status === 'ACTIVE' ? '启用' : '已停用'}</ConsoleStatusBadge></div><p className="mt-1 text-xs text-muted-foreground">{department.userCount} 名用户 · {department.knowledgeBaseCount} 个知识库</p></div><div className="flex gap-1"><Button onClick={() => onEdit(department)} size="icon" title="编辑部门" variant="ghost"><Pencil /></Button><Button disabled={department.status === 'DISABLED'} onClick={() => onDisable(department)} size="icon" title="停用部门" variant="ghost"><Power /></Button></div></div>{(byParent[department.id] ?? []).map((child) => renderNode(child, depth + 1))}</li>;
  return <ul>{(byParent.root ?? []).map((department) => renderNode(department, 0))}{departments.length === 0 ? <li className="p-8"><ConsoleEmptyState description="为该组织创建部门后，即可分配用户和建立部门知识库。" icon={UsersRound} title="暂无部门" /></li> : null}</ul>;
}

function OrganizationDialog({ editing, onOpenChange, onSubmit, open }: { editing?: EnterpriseOrganization | null; onOpenChange: (open: boolean) => void; onSubmit: (name: string) => Promise<boolean>; open: boolean }) {
  const [name, setName] = useState(editing?.name ?? '');
  useEffect(() => setName(editing?.name ?? ''), [editing, open]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if ((await onSubmit(name)) === true) onOpenChange(false); };
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><DialogHeader><DialogTitle>{editing ? '编辑组织' : '创建组织'}</DialogTitle><DialogDescription>系统会生成稳定编码，管理员无需输入技术标识。</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><label className="grid gap-2 text-sm font-medium">组织名称<Input autoFocus maxLength={120} onChange={(event) => setName(event.target.value)} value={name} /></label><DialogFooter><Button onClick={() => onOpenChange(false)} type="button" variant="outline">取消</Button><Button disabled={!name.trim()} type="submit">保存</Button></DialogFooter></form></DialogContent></Dialog>;
}

function DepartmentDialog({ editing, onOpenChange, onSubmit, open, organization }: { editing?: EnterpriseDepartment; onOpenChange: (open: boolean) => void; onSubmit: (input: { name: string; parentId?: string | null }) => Promise<boolean>; open: boolean; organization: EnterpriseOrganization | null }) {
  const [name, setName] = useState(editing?.name ?? '');
  const [parentId, setParentId] = useState(editing?.parentId ?? 'root');
  useEffect(() => { setName(editing?.name ?? ''); setParentId(editing?.parentId ?? 'root'); }, [editing, open]);
  const options = (organization?.departments ?? []).filter((department) => department.id !== editing?.id && department.status === 'ACTIVE');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if ((await onSubmit({ name: name.trim(), parentId: parentId === 'root' ? null : parentId })) === true) onOpenChange(false); };
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><DialogHeader><DialogTitle>{editing ? '编辑部门' : '创建部门'}</DialogTitle><DialogDescription>部门可选择上级部门，最多四层；系统将自动生成稳定编码。</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><label className="grid gap-2 text-sm font-medium">部门名称<Input autoFocus maxLength={120} onChange={(event) => setName(event.target.value)} value={name} /></label><label className="grid gap-2 text-sm font-medium">上级部门<Select onValueChange={setParentId} value={parentId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="root">无上级部门</SelectItem>{options.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}</SelectContent></Select></label><DialogFooter><Button onClick={() => onOpenChange(false)} type="button" variant="outline">取消</Button><Button disabled={!name.trim()} type="submit">保存</Button></DialogFooter></form></DialogContent></Dialog>;
}
