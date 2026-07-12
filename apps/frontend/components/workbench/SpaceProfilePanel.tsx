'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Save, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { enterpriseService } from '@/services/enterprise.service';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { EnterpriseDepartmentOption } from '@/types/enterprise';
import type { KnowledgeSpaceMetadata, KnowledgeSpaceType, SpaceMemberRole } from '@/types/workbench';

const spaceTypeLabels: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: '客户知识库',
  DEPARTMENT: '部门知识库',
  GENERAL: '通用知识库',
  PROJECT: '项目知识库',
};

const roleLabels: Record<SpaceMemberRole, string> = {
  EDITOR: '编辑者',
  OWNER: '负责人',
  VIEWER: '查看者',
};

const spaceTypeDescriptions: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: '面向客户的独立交付资料与检索范围。',
  DEPARTMENT: '部门内部制度、流程和业务知识。',
  GENERAL: '企业共享且不归属于特定项目的知识。',
  PROJECT: '围绕项目成员与项目资料建立的知识范围。',
};

export function SpaceProfilePanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const loading = useWorkbenchStore((state) => state.loading);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const updateSelectedSpaceProfile = useWorkbenchStore((state) => state.updateSelectedSpaceProfile);
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const currentMember =
    selectedSpace?.members.find((member) => member.userId === authUser?.id) ??
    spaceMembers.find((member) => member.userId === authUser?.id) ??
    null;
  const owner = spaceMembers.find((member) => member.role === 'OWNER') ?? null;
  const role = currentMember?.role ?? 'VIEWER';
  const canManage = role === 'OWNER' || role === 'EDITOR';
  const canManageDepartment = role === 'OWNER';
  const [name, setName] = useState(selectedSpace?.name ?? '');
  const [description, setDescription] = useState(selectedSpace?.description ?? '');
  const [spaceType, setSpaceType] = useState<KnowledgeSpaceType>(selectedSpace?.type ?? 'GENERAL');
  const [departmentId, setDepartmentId] = useState(selectedSpace?.departmentId ?? '');
  const [departments, setDepartments] = useState<EnterpriseDepartmentOption[]>([]);
  const [projectCode, setProjectCode] = useState(selectedSpace?.metadata.projectCode ?? '');
  const [projectName, setProjectName] = useState(selectedSpace?.metadata.projectName ?? '');
  const [customerCode, setCustomerCode] = useState(selectedSpace?.metadata.customerCode ?? '');
  const [customerName, setCustomerName] = useState(selectedSpace?.metadata.customerName ?? '');
  const metadata = useMemo(
    () =>
      createMetadata({
        ...selectedSpace?.metadata,
        customerCode,
        customerName,
        projectCode,
        projectName,
        type: spaceType,
      }),
    [customerCode, customerName, projectCode, projectName, selectedSpace?.metadata, spaceType],
  );
  const isDirty =
    Boolean(selectedSpace) &&
    (name.trim() !== selectedSpace?.name ||
      description.trim() !== (selectedSpace.description ?? '') ||
      (canManageDepartment && spaceType !== selectedSpace.type) ||
      (canManageDepartment && departmentId !== (selectedSpace.departmentId ?? '')) ||
      (spaceType === 'PROJECT' && (projectCode.trim() !== (selectedSpace.metadata.projectCode ?? '') || projectName.trim() !== (selectedSpace.metadata.projectName ?? ''))) ||
      (spaceType === 'CUSTOMER' && (customerCode.trim() !== (selectedSpace.metadata.customerCode ?? '') || customerName.trim() !== (selectedSpace.metadata.customerName ?? ''))));

  useEffect(() => {
    setName(selectedSpace?.name ?? '');
    setDescription(selectedSpace?.description ?? '');
    setSpaceType(selectedSpace?.type ?? 'GENERAL');
    setDepartmentId(selectedSpace?.departmentId ?? '');
    setProjectCode(selectedSpace?.metadata.projectCode ?? '');
    setProjectName(selectedSpace?.metadata.projectName ?? '');
    setCustomerCode(selectedSpace?.metadata.customerCode ?? '');
    setCustomerName(selectedSpace?.metadata.customerName ?? '');
  }, [selectedSpace]);

  useEffect(() => {
    if (!selectedSpace) return;
    void enterpriseService.listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, [selectedSpace]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateSelectedSpaceProfile({
      description: description.trim() || undefined,
      departmentId: canManageDepartment ? departmentId || null : undefined,
      metadata,
      name: name.trim(),
      type: canManageDepartment ? spaceType : undefined,
    });
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="space-profile-panel__header">
        <div className="min-w-0">
          <CardTitle>知识库资料</CardTitle>
          <CardDescription>
            {selectedSpace ? '定义空间的业务语境；成员和检索资料以此空间为边界。' : '请先选择一个知识空间。'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>空间角色：{roleLabels[role]}</Badge>
      </CardHeader>
      <CardContent>
        {!selectedSpace ? (
          <div className="space-profile-panel__empty">尚未选择知识空间。</div>
        ) : canManage ? (
          <form className="space-profile-panel" onSubmit={handleSubmit}>
            <div className="space-profile-panel__summary">
              <div><BriefcaseBusiness /><span>{spaceTypeLabels[selectedSpace.type]}</span></div>
              <div><Users /><span>{spaceMembers.length} 名成员</span></div>
            </div>
            <label className="space-profile-panel__field">
              <span>空间名称</span>
              <Input maxLength={120} onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label className="space-profile-panel__field">
              <span>空间说明</span>
              <Textarea className="min-h-20 resize-y" maxLength={500} onChange={(event) => setDescription(event.target.value)} value={description} />
            </label>
            <label className="space-profile-panel__field">
              <span>空间类型</span>
              <Select disabled={!canManageDepartment || loading} onValueChange={(value) => setSpaceType(value as KnowledgeSpaceType)} value={spaceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['GENERAL', 'DEPARTMENT', 'PROJECT', 'CUSTOMER'] as KnowledgeSpaceType[]).map((type) => (
                    <SelectItem key={type} value={type}>{spaceTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <small>{spaceTypeDescriptions[spaceType]}</small>
            </label>
            <label className="space-profile-panel__field">
              <span>归属部门{spaceType === 'DEPARTMENT' ? '（必填）' : '（可选）'}</span>
              <Select disabled={!canManageDepartment || loading} onValueChange={(value) => setDepartmentId(value === 'none' ? '' : value)} value={departmentId || 'none'}>
                <SelectTrigger><SelectValue placeholder="选择部门" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不绑定部门</SelectItem>
                  {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <small>{canManageDepartment ? '负责人可调整业务归属；成员权限不会因此自动变化。' : '仅知识库负责人可调整业务归属。'}</small>
            </label>
            {spaceType === 'PROJECT' ? <div className="space-profile-panel__split">
              <label className="space-profile-panel__field"><span>项目编码</span><Input onChange={(event) => setProjectCode(event.target.value)} placeholder="proj-erp-2026" value={projectCode} /></label>
              <label className="space-profile-panel__field"><span>项目名称</span><Input onChange={(event) => setProjectName(event.target.value)} placeholder="ERP rollout" value={projectName} /></label>
            </div> : null}
            {spaceType === 'CUSTOMER' ? <div className="space-profile-panel__split">
              <label className="space-profile-panel__field"><span>客户编码</span><Input onChange={(event) => setCustomerCode(event.target.value)} placeholder="cust-acme" value={customerCode} /></label>
              <label className="space-profile-panel__field"><span>客户名称</span><Input onChange={(event) => setCustomerName(event.target.value)} placeholder="ACME Corp" value={customerName} /></label>
            </div> : null}
            {(spaceType === 'PROJECT' || spaceType === 'CUSTOMER') ? <p className="text-xs leading-5 text-muted-foreground">项目和客户资料仅用于标识、筛选和后续外部系统映射，不改变知识库成员或文档访问权限。</p> : null}
            <Button disabled={!isDirty || loading || !name.trim() || (spaceType === 'DEPARTMENT' && !departmentId)} type="submit"><Save />保存资料</Button>
          </form>
        ) : (
          <div className="space-profile-panel__readonly">
            <div className="space-profile-panel__summary">
              <div><BriefcaseBusiness /><span>{spaceTypeLabels[selectedSpace.type]}</span></div>
              <div><Users /><span>{spaceMembers.length} 名成员</span></div>
            </div>
            <dl className="space-profile-panel__details">
              <div><dt>空间名称</dt><dd>{selectedSpace.name}</dd></div>
              <div><dt>空间说明</dt><dd>{selectedSpace.description || '未填写'}</dd></div>
              <div><dt>归属部门</dt><dd>{selectedSpace.department?.name || '未设置'}</dd></div>
              {selectedSpace.type === 'PROJECT' ? <div><dt>项目编码</dt><dd>{selectedSpace.metadata.projectCode || '未设置'}</dd></div> : null}
              {selectedSpace.type === 'PROJECT' ? <div><dt>项目名称</dt><dd>{selectedSpace.metadata.projectName || '未设置'}</dd></div> : null}
              {selectedSpace.type === 'CUSTOMER' ? <div><dt>客户编码</dt><dd>{selectedSpace.metadata.customerCode || '未设置'}</dd></div> : null}
              {selectedSpace.type === 'CUSTOMER' ? <div><dt>客户名称</dt><dd>{selectedSpace.metadata.customerName || '未设置'}</dd></div> : null}
            </dl>
            <p>当前为空间查看者。系统管理员身份不替代空间成员权限；请联系空间负责人 {owner?.user.email ?? '申请编辑权限'} 修改空间资料。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const createMetadata = (input: KnowledgeSpaceMetadata & {
  customerCode: string;
  customerName: string;
  projectCode: string;
  projectName: string;
  type: KnowledgeSpaceType;
}): KnowledgeSpaceMetadata => ({
  ...(input.type === 'CUSTOMER' && input.customerCode.trim() ? { customerCode: input.customerCode.trim() } : {}),
  ...(input.type === 'CUSTOMER' && input.customerName.trim() ? { customerName: input.customerName.trim() } : {}),
  ...(input.type === 'PROJECT' && input.projectCode.trim() ? { projectCode: input.projectCode.trim() } : {}),
  ...(input.type === 'PROJECT' && input.projectName.trim() ? { projectName: input.projectName.trim() } : {}),
});
