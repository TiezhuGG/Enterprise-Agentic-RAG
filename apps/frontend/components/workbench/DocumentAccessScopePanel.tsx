'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { enterpriseService } from '@/services/enterprise.service';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { EnterpriseDepartmentOption } from '@/types/enterprise';
import type { DocumentAccessScope, SpaceMemberRole } from '@/types/workbench';

type AccessMode = 'MEMBERS' | 'DEPARTMENTS' | 'CONFIDENTIAL';

const roleLabels: Record<SpaceMemberRole, string> = {
  EDITOR: '编辑者',
  OWNER: '负责人',
  VIEWER: '查看者',
};

const defaultScope: DocumentAccessScope = { securityLevel: 'INTERNAL' };

const getMode = (scope: DocumentAccessScope): AccessMode => {
  if (scope.securityLevel === 'CONFIDENTIAL') return 'CONFIDENTIAL';
  return scope.allowedDepartmentIds?.length ? 'DEPARTMENTS' : 'MEMBERS';
};

const toScope = (mode: AccessMode, departmentIds: string[]): DocumentAccessScope => ({
  allowedDepartmentIds: mode === 'DEPARTMENTS' && departmentIds.length ? departmentIds : undefined,
  securityLevel: mode === 'CONFIDENTIAL' ? 'CONFIDENTIAL' : 'INTERNAL',
});

export function DocumentAccessScopePanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const documentAccessScope = useWorkbenchStore((state) => state.documentAccessScope);
  const documentAccessScopeError = useWorkbenchStore((state) => state.documentAccessScopeError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const updateDocumentAccessScope = useWorkbenchStore((state) => state.updateDocumentAccessScope);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const currentMember =
    selectedSpace?.members.find((member) => member.userId === authUser?.id) ??
    spaceMembers.find((member) => member.userId === authUser?.id) ??
    null;
  const owner = spaceMembers.find((member) => member.role === 'OWNER') ?? null;
  const role = currentMember?.role ?? 'VIEWER';
  const canManage = role === 'OWNER' || role === 'EDITOR';
  const effectiveScope = documentAccessScope ?? selectedDocument?.accessScope ?? defaultScope;
  const [departments, setDepartments] = useState<EnterpriseDepartmentOption[]>([]);
  const [mode, setMode] = useState<AccessMode>(getMode(effectiveScope));
  const [departmentIds, setDepartmentIds] = useState<string[]>(
    effectiveScope.allowedDepartmentIds ?? [],
  );
  const nextScope = useMemo(() => toScope(mode, departmentIds), [departmentIds, mode]);
  const isDirty =
    JSON.stringify(nextScope) !==
    JSON.stringify(toScope(getMode(effectiveScope), effectiveScope.allowedDepartmentIds ?? []));

  useEffect(() => {
    setMode(getMode(effectiveScope));
    setDepartmentIds(effectiveScope.allowedDepartmentIds ?? []);
  }, [effectiveScope]);

  useEffect(() => {
    if (!selectedDocument) return;
    void enterpriseService
      .listDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [selectedDocument]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'DEPARTMENTS' && departmentIds.length === 0) return;
    await updateDocumentAccessScope(nextScope);
  };

  const toggleDepartment = (departmentId: string) => {
    setDepartmentIds((current) =>
      current.includes(departmentId)
        ? current.filter((id) => id !== departmentId)
        : [...current, departmentId],
    );
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="document-access-scope__header">
        <div className="min-w-0">
          <CardTitle>访问范围</CardTitle>
          <CardDescription>
            {selectedDocument
              ? '成员身份始终是第一道边界；文档策略只会进一步收紧可访问范围。'
              : '请先选择一份文档。'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>知识库角色：{roleLabels[role]}</Badge>
      </CardHeader>
      <CardContent>
        {documentAccessScopeError ? (
          <div className="workbench-error">{documentAccessScopeError}</div>
        ) : null}
        {!selectedDocument ? (
          <div className="document-access-scope__empty">尚未选择文档。</div>
        ) : canManage ? (
          <form className="document-access-scope" onSubmit={handleSubmit}>
            <ScopeSummary mode={mode} departmentCount={departmentIds.length} />
            <label className="document-access-scope__field">
              <span>访问策略</span>
              <Select onValueChange={(value) => setMode(value as AccessMode)} value={mode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBERS">知识库成员可见</SelectItem>
                  <SelectItem value="DEPARTMENTS">指定部门可见</SelectItem>
                  <SelectItem value="CONFIDENTIAL">机密资料</SelectItem>
                </SelectContent>
              </Select>
              <small>
                {mode === 'MEMBERS'
                  ? '所有已加入本知识库的成员均可访问。'
                  : mode === 'DEPARTMENTS'
                    ? '成员身份与部门归属必须同时满足。'
                    : '成员身份仍是前提，负责人或拥有机密资料权限的成员可访问。'}
              </small>
            </label>
            {mode === 'DEPARTMENTS' ? (
              <fieldset className="document-access-scope__field">
                <legend>允许访问的部门</legend>
                <div className="grid max-h-52 gap-2 overflow-y-auto border p-3 sm:grid-cols-2">
                  {departments.map((department) => (
                    <label className="flex min-w-0 items-center gap-2 text-sm" key={department.id}>
                      <input
                        checked={departmentIds.includes(department.id)}
                        className="size-4 shrink-0"
                        onChange={() => toggleDepartment(department.id)}
                        type="checkbox"
                      />
                      <span className="truncate" title={department.name}>
                        {department.name}
                      </span>
                    </label>
                  ))}
                </div>
                <small>选择一个或多个部门，不输入技术标识。</small>
              </fieldset>
            ) : null}
            <Button
              disabled={
                !isDirty ||
                loadingDocuments ||
                (mode === 'DEPARTMENTS' && departmentIds.length === 0)
              }
              type="submit"
            >
              <Save />
              保存访问范围
            </Button>
          </form>
        ) : (
          <div className="document-access-scope__readonly">
            <ScopeSummary
              mode={getMode(effectiveScope)}
              departmentCount={effectiveScope.allowedDepartmentIds?.length ?? 0}
            />
            <p>
              当前为只读成员。请联系知识库负责人 {owner?.user.email ?? '申请调整权限'}{' '}
              修改文档访问范围。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScopeSummary({ departmentCount, mode }: { departmentCount: number; mode: AccessMode }) {
  const label =
    mode === 'MEMBERS'
      ? '知识库成员可见'
      : mode === 'DEPARTMENTS'
        ? `指定 ${departmentCount} 个部门可见`
        : '机密资料';
  return (
    <div className="document-access-scope__summary">
      <div>
        <ShieldCheck />
        <span>{label}</span>
      </div>
      <div>
        <LockKeyhole />
        <span>成员身份始终必需</span>
      </div>
    </div>
  );
}
