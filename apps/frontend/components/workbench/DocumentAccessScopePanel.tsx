'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Save, ShieldCheck } from 'lucide-react';
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
import type { DocumentAccessScope, DocumentSecurityLevel, SpaceMemberRole } from '@/types/workbench';

const securityLevelLabels: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: '机密资料',
  INTERNAL: '内部可见',
  PUBLIC: '空间内公开',
};

const securityLevelDescriptions: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: '仅负责人或具备机密资料权限的成员可访问。',
  INTERNAL: '空间成员可访问，并可继续按部门限制。',
  PUBLIC: '当前空间成员均可访问，不额外限制部门。',
};

const roleLabels: Record<SpaceMemberRole, string> = {
  EDITOR: '编辑者',
  OWNER: '负责人',
  VIEWER: '查看者',
};

const defaultScope: DocumentAccessScope = { securityLevel: 'INTERNAL' };

const toDepartmentText = (scope: DocumentAccessScope | null): string =>
  scope?.allowedDepartmentIds?.join(', ') ?? '';

const parseDepartmentIds = (value: string): string[] | undefined => {
  const ids = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  return ids.length > 0 ? ids : undefined;
};

export function DocumentAccessScopePanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const documentAccessScope = useWorkbenchStore((state) => state.documentAccessScope);
  const documentAccessScopeError = useWorkbenchStore((state) => state.documentAccessScopeError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const updateDocumentAccessScope = useWorkbenchStore((state) => state.updateDocumentAccessScope);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const owner = spaceMembers.find((member) => member.role === 'OWNER') ?? null;
  const role = currentMember?.role ?? 'VIEWER';
  const canManage = role === 'OWNER' || role === 'EDITOR';
  const effectiveScope = documentAccessScope ?? selectedDocument?.accessScope ?? defaultScope;
  const [securityLevel, setSecurityLevel] = useState<DocumentSecurityLevel>(effectiveScope.securityLevel);
  const [departmentId, setDepartmentId] = useState(effectiveScope.departmentId ?? '');
  const [allowedDepartmentIds, setAllowedDepartmentIds] = useState(toDepartmentText(effectiveScope));
  const isDirty = useMemo(
    () => securityLevel !== effectiveScope.securityLevel || departmentId.trim() !== (effectiveScope.departmentId ?? '') || allowedDepartmentIds.trim() !== toDepartmentText(effectiveScope),
    [allowedDepartmentIds, departmentId, effectiveScope, securityLevel],
  );

  useEffect(() => {
    setSecurityLevel(effectiveScope.securityLevel);
    setDepartmentId(effectiveScope.departmentId ?? '');
    setAllowedDepartmentIds(toDepartmentText(effectiveScope));
  }, [effectiveScope]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateDocumentAccessScope({
      allowedDepartmentIds: parseDepartmentIds(allowedDepartmentIds),
      departmentId: departmentId.trim() || undefined,
      securityLevel,
    });
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="document-access-scope__header">
        <div className="min-w-0">
          <CardTitle>访问范围</CardTitle>
          <CardDescription>{selectedDocument ? '控制谁可以查看、检索、预览和引用当前文档。' : '请先选择一份文档。'}</CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>你的角色：{roleLabels[role]}</Badge>
      </CardHeader>
      <CardContent>
        {documentAccessScopeError ? <div className="workbench-error">{documentAccessScopeError}</div> : null}
        {!selectedDocument ? (
          <div className="document-access-scope__empty">尚未选择文档。</div>
        ) : canManage ? (
          <form className="document-access-scope" onSubmit={handleSubmit}>
            <ScopeSummary scope={effectiveScope} />
            <label className="document-access-scope__field">
              <span>安全级别</span>
              <Select disabled={loadingDocuments} onValueChange={(value) => setSecurityLevel(value as DocumentSecurityLevel)} value={securityLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as DocumentSecurityLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>{securityLevelLabels[level]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <small>{securityLevelDescriptions[securityLevel]}</small>
            </label>
            <label className="document-access-scope__field"><span>所属部门标识</span><Input onChange={(event) => setDepartmentId(event.target.value)} placeholder="dept-finance" value={departmentId} /></label>
            <label className="document-access-scope__field">
              <span>允许访问的部门标识</span>
              <Input onChange={(event) => setAllowedDepartmentIds(event.target.value)} placeholder="dept-finance, dept-legal" value={allowedDepartmentIds} />
              <small>多个部门使用逗号分隔；留空时仅使用所属部门。</small>
            </label>
            <Button disabled={!isDirty || loadingDocuments} type="submit"><Save />保存访问范围</Button>
            <p className="document-access-scope__hint">保存后，权限过滤会在下一次检索和问答时生效。</p>
          </form>
        ) : (
          <div className="document-access-scope__readonly">
            <ScopeSummary scope={effectiveScope} />
            <p>当前为只读成员。请联系空间负责人 {owner?.user.email ?? '申请调整权限'} 修改访问范围。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScopeSummary({ scope }: { scope: DocumentAccessScope }) {
  return (
    <div className="document-access-scope__summary">
      <div><ShieldCheck /><span>{securityLevelLabels[scope.securityLevel]}</span></div>
      <div><LockKeyhole /><span>{scope.allowedDepartmentIds?.length ? `${scope.allowedDepartmentIds.length} 个允许部门` : '未设置允许部门'}</span></div>
    </div>
  );
}
