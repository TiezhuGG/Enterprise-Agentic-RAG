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
import { useWorkbenchStore } from '@/store/workbench.store';
import type { KnowledgeSpaceMetadata, KnowledgeSpaceType } from '@/types/workbench';

const spaceTypeLabels: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: '客户空间',
  DEPARTMENT: '部门空间',
  GENERAL: '通用空间',
  PROJECT: '项目空间',
};

const spaceTypeDescriptions: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: '管理面向客户的专属知识。',
  DEPARTMENT: '管理部门内部的业务知识。',
  GENERAL: '管理企业共享知识。',
  PROJECT: '管理特定项目的知识资产。',
};

export function SpaceProfilePanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const loading = useWorkbenchStore((state) => state.loading);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const updateSelectedSpaceProfile = useWorkbenchStore((state) => state.updateSelectedSpaceProfile);
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'EDITOR';
  const [spaceType, setSpaceType] = useState<KnowledgeSpaceType>(selectedSpace?.type ?? 'GENERAL');
  const [departmentId, setDepartmentId] = useState(selectedSpace?.metadata.departmentId ?? '');
  const [projectCode, setProjectCode] = useState(selectedSpace?.metadata.projectCode ?? '');
  const [projectName, setProjectName] = useState(selectedSpace?.metadata.projectName ?? '');
  const [customerCode, setCustomerCode] = useState(selectedSpace?.metadata.customerCode ?? '');
  const [customerName, setCustomerName] = useState(selectedSpace?.metadata.customerName ?? '');
  const metadata = useMemo(
    () =>
      createMetadata({
        customerCode,
        customerName,
        departmentId,
        projectCode,
        projectName,
      }),
    [customerCode, customerName, departmentId, projectCode, projectName],
  );
  const isDirty =
    Boolean(selectedSpace) &&
    (spaceType !== selectedSpace?.type ||
      departmentId.trim() !== (selectedSpace.metadata.departmentId ?? '') ||
      projectCode.trim() !== (selectedSpace.metadata.projectCode ?? '') ||
      projectName.trim() !== (selectedSpace.metadata.projectName ?? '') ||
      customerCode.trim() !== (selectedSpace.metadata.customerCode ?? '') ||
      customerName.trim() !== (selectedSpace.metadata.customerName ?? ''));

  useEffect(() => {
    setSpaceType(selectedSpace?.type ?? 'GENERAL');
    setDepartmentId(selectedSpace?.metadata.departmentId ?? '');
    setProjectCode(selectedSpace?.metadata.projectCode ?? '');
    setProjectName(selectedSpace?.metadata.projectName ?? '');
    setCustomerCode(selectedSpace?.metadata.customerCode ?? '');
    setCustomerName(selectedSpace?.metadata.customerName ?? '');
  }, [selectedSpace]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await updateSelectedSpaceProfile({
      metadata,
      type: spaceType,
    });
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="space-profile-panel__header">
        <div>
          <CardTitle>知识空间资料</CardTitle>
          <CardDescription>
            {selectedSpace
              ? '描述当前知识空间服务的业务范围。'
              : '请先选择一个知识空间。'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? '可编辑' : '只读'}
        </Badge>
      </CardHeader>
      <CardContent>
        {!selectedSpace ? (
          <div className="space-profile-panel__empty">尚未选择知识空间。</div>
        ) : (
          <form className="space-profile-panel" onSubmit={handleSubmit}>
            <div className="space-profile-panel__summary">
              <div>
                <BriefcaseBusiness />
                <span>{spaceTypeLabels[selectedSpace.type]}</span>
              </div>
              <div>
                <Users />
                <span>{spaceMembers.length} 名成员</span>
              </div>
            </div>

            <label className="space-profile-panel__field">
              <span>空间类型</span>
              <Select
                disabled={!canManage || loading}
                onValueChange={(value) => setSpaceType(value as KnowledgeSpaceType)}
                value={spaceType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['GENERAL', 'DEPARTMENT', 'PROJECT', 'CUSTOMER'] as KnowledgeSpaceType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {spaceTypeLabels[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <small>{spaceTypeDescriptions[spaceType]}</small>
            </label>

            <label className="space-profile-panel__field">
              <span>部门标识</span>
              <Input
                disabled={!canManage || loading}
                onChange={(event) => setDepartmentId(event.target.value)}
                placeholder="dept-finance"
                value={departmentId}
              />
            </label>

            <div className="space-profile-panel__split">
              <label className="space-profile-panel__field">
                <span>项目编码</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setProjectCode(event.target.value)}
                  placeholder="proj-erp-2026"
                  value={projectCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>项目名称</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="ERP rollout"
                  value={projectName}
                />
              </label>
            </div>

            <div className="space-profile-panel__split">
              <label className="space-profile-panel__field">
                <span>客户编码</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setCustomerCode(event.target.value)}
                  placeholder="cust-acme"
                  value={customerCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>客户名称</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="ACME Corp"
                  value={customerName}
                />
              </label>
            </div>

            <Button disabled={!canManage || !isDirty || loading} type="submit">
              <Save />
              保存资料
            </Button>

            <p className="space-profile-panel__hint">
              空间类型用于说明业务范围；实际访问仍由租户、成员角色和文档访问范围共同控制。
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

const createMetadata = (input: {
  customerCode: string;
  customerName: string;
  departmentId: string;
  projectCode: string;
  projectName: string;
}): KnowledgeSpaceMetadata => ({
  ...(input.customerCode.trim() ? { customerCode: input.customerCode.trim() } : {}),
  ...(input.customerName.trim() ? { customerName: input.customerName.trim() } : {}),
  ...(input.departmentId.trim()
    ? {
        departmentId: input.departmentId.trim(),
        ownerDepartmentId: input.departmentId.trim(),
      }
    : {}),
  ...(input.projectCode.trim() ? { projectCode: input.projectCode.trim() } : {}),
  ...(input.projectName.trim() ? { projectName: input.projectName.trim() } : {}),
});
