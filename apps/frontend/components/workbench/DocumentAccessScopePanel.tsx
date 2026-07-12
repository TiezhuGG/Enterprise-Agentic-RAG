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
import type { DocumentAccessScope, DocumentSecurityLevel } from '@/types/workbench';

const securityLevelLabels: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: '\u673a\u5bc6\u8d44\u6599',
  INTERNAL: '\u5185\u90e8\u53ef\u89c1',
  PUBLIC: '\u7a7a\u95f4\u5185\u516c\u5f00',
};

const securityLevelDescriptions: Record<DocumentSecurityLevel, string> = {
  CONFIDENTIAL: '\u4ec5\u7a7a\u95f4\u8d1f\u8d23\u4eba\u6216\u5177\u5907\u673a\u5bc6\u8d44\u6599\u6743\u9650\u7684\u6210\u5458\u53ef\u8bbf\u95ee\u3002',
  INTERNAL: '\u7a7a\u95f4\u6210\u5458\u53ef\u8bbf\u95ee\uff0c\u53ef\u6309\u90e8\u95e8\u8fdb\u4e00\u6b65\u9650\u5236\u3002',
  PUBLIC: '\u5f53\u524d\u7a7a\u95f4\u5185\u6210\u5458\u5747\u53ef\u8bbf\u95ee\uff0c\u4e0d\u9650\u5236\u90e8\u95e8\u3002',
};

const defaultScope: DocumentAccessScope = {
  securityLevel: 'INTERNAL',
};

const toDepartmentText = (scope: DocumentAccessScope | null): string =>
  scope?.allowedDepartmentIds?.join(', ') ?? '';

const parseDepartmentIds = (value: string): string[] | undefined => {
  const ids = [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

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
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'EDITOR';
  const effectiveScope = documentAccessScope ?? selectedDocument?.accessScope ?? defaultScope;
  const [securityLevel, setSecurityLevel] = useState<DocumentSecurityLevel>(
    effectiveScope.securityLevel,
  );
  const [departmentId, setDepartmentId] = useState(effectiveScope.departmentId ?? '');
  const [allowedDepartmentIds, setAllowedDepartmentIds] = useState(
    toDepartmentText(effectiveScope),
  );
  const isDirty = useMemo(
    () =>
      securityLevel !== effectiveScope.securityLevel ||
      departmentId.trim() !== (effectiveScope.departmentId ?? '') ||
      allowedDepartmentIds.trim() !== toDepartmentText(effectiveScope),
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
    <Card>
      <CardHeader className="document-access-scope__header">
        <div>
          <CardTitle>{'\u8bbf\u95ee\u8303\u56f4'}</CardTitle>
          <CardDescription>
            {selectedDocument
              ? '\u63a7\u5236\u54ea\u4e9b\u6210\u5458\u53ef\u4ee5\u67e5\u770b\u3001\u68c0\u7d22\u3001\u9884\u89c8\u548c\u5f15\u7528\u6b64\u6587\u6863\u3002'
              : '\u8bf7\u5148\u9009\u62e9\u4e00\u4efd\u6587\u6863\u3002'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? '\u53ef\u7f16\u8f91' : '\u53ea\u8bfb'}
        </Badge>
      </CardHeader>
      <CardContent>
        {documentAccessScopeError ? (
          <div className="workbench-error">{documentAccessScopeError}</div>
        ) : null}

        {!selectedDocument ? (
          <div className="document-access-scope__empty">{'\u5c1a\u672a\u9009\u62e9\u6587\u6863\u3002'}</div>
        ) : (
          <form className="document-access-scope" onSubmit={handleSubmit}>
            <div className="document-access-scope__summary">
              <div>
                <ShieldCheck />
                <span>{securityLevelLabels[effectiveScope.securityLevel]}</span>
              </div>
              <div>
                <LockKeyhole />
                <span>
                  {effectiveScope.allowedDepartmentIds?.length
                    ? `${effectiveScope.allowedDepartmentIds.length} \u4e2a\u5141\u8bb8\u90e8\u95e8`
                    : '\u672a\u8bbe\u7f6e\u5141\u8bb8\u90e8\u95e8'}
                </span>
              </div>
            </div>

            <label className="document-access-scope__field">
              <span>{'\u5b89\u5168\u7ea7\u522b'}</span>
              <Select
                disabled={!canManage || loadingDocuments}
                onValueChange={(value) => setSecurityLevel(value as DocumentSecurityLevel)}
                value={securityLevel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as DocumentSecurityLevel[]).map(
                    (level) => (
                      <SelectItem key={level} value={level}>
                        {securityLevelLabels[level]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <small>{securityLevelDescriptions[securityLevel]}</small>
            </label>

            <label className="document-access-scope__field">
              <span>{'\u6240\u5c5e\u90e8\u95e8\u6807\u8bc6'}</span>
              <Input
                disabled={!canManage || loadingDocuments}
                onChange={(event) => setDepartmentId(event.target.value)}
                placeholder="dept-finance"
                value={departmentId}
              />
            </label>

            <label className="document-access-scope__field">
              <span>{'\u5141\u8bb8\u8bbf\u95ee\u7684\u90e8\u95e8\u6807\u8bc6'}</span>
              <Input
                disabled={!canManage || loadingDocuments}
                onChange={(event) => setAllowedDepartmentIds(event.target.value)}
                placeholder="dept-finance, dept-legal"
                value={allowedDepartmentIds}
              />
              <small>\u591a\u4e2a\u90e8\u95e8\u8bf7\u7528\u9017\u53f7\u5206\u9694\uff1b\u7559\u7a7a\u65f6\u4ec5\u4f7f\u7528\u6240\u5c5e\u90e8\u95e8\u3002</small>
            </label>

            <Button disabled={!canManage || !isDirty || loadingDocuments} type="submit">
              <Save />
              {'\u4fdd\u5b58\u8bbf\u95ee\u8303\u56f4'}
            </Button>

            <p className="document-access-scope__hint">
              \u8c03\u6574\u8303\u56f4\u540e\u8bf7\u91cd\u65b0\u89e3\u6790\u6587\u6863\uff0c\u4ee5\u66f4\u65b0\u68c0\u7d22\u6743\u9650\u3002
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
