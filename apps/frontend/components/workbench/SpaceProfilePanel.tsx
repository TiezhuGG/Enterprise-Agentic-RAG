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
  CUSTOMER: '\u5ba2\u6237\u7a7a\u95f4',
  DEPARTMENT: '\u90e8\u95e8\u7a7a\u95f4',
  GENERAL: '\u901a\u7528\u7a7a\u95f4',
  PROJECT: '\u9879\u76ee\u7a7a\u95f4',
};

const spaceTypeDescriptions: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: '\u7ba1\u7406\u9762\u5411\u5ba2\u6237\u7684\u4e13\u5c5e\u77e5\u8bc6\u3002',
  DEPARTMENT: '\u7ba1\u7406\u90e8\u95e8\u5185\u90e8\u7684\u4e1a\u52a1\u77e5\u8bc6\u3002',
  GENERAL: '\u7ba1\u7406\u4f01\u4e1a\u5171\u4eab\u77e5\u8bc6\u3002',
  PROJECT: '\u7ba1\u7406\u7279\u5b9a\u9879\u76ee\u7684\u77e5\u8bc6\u8d44\u4ea7\u3002',
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
    <Card>
      <CardHeader className="space-profile-panel__header">
        <div>
          <CardTitle>{'\u77e5\u8bc6\u7a7a\u95f4\u8d44\u6599'}</CardTitle>
          <CardDescription>
            {selectedSpace
              ? '\u63cf\u8ff0\u5f53\u524d\u77e5\u8bc6\u7a7a\u95f4\u670d\u52a1\u7684\u4e1a\u52a1\u8303\u56f4\u3002'
              : '\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u77e5\u8bc6\u7a7a\u95f4\u3002'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? '\u53ef\u7f16\u8f91' : '\u53ea\u8bfb'}
        </Badge>
      </CardHeader>
      <CardContent>
        {!selectedSpace ? (
          <div className="space-profile-panel__empty">{'\u5c1a\u672a\u9009\u62e9\u77e5\u8bc6\u7a7a\u95f4\u3002'}</div>
        ) : (
          <form className="space-profile-panel" onSubmit={handleSubmit}>
            <div className="space-profile-panel__summary">
              <div>
                <BriefcaseBusiness />
                <span>{spaceTypeLabels[selectedSpace.type]}</span>
              </div>
              <div>
                <Users />
                <span>{spaceMembers.length}{' \u540d\u6210\u5458'}</span>
              </div>
            </div>

            <label className="space-profile-panel__field">
              <span>{'\u7a7a\u95f4\u7c7b\u578b'}</span>
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
              <span>{'\u90e8\u95e8\u6807\u8bc6'}</span>
              <Input
                disabled={!canManage || loading}
                onChange={(event) => setDepartmentId(event.target.value)}
                placeholder="dept-finance"
                value={departmentId}
              />
            </label>

            <div className="space-profile-panel__split">
              <label className="space-profile-panel__field">
                <span>{'\u9879\u76ee\u7f16\u7801'}</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setProjectCode(event.target.value)}
                  placeholder="proj-erp-2026"
                  value={projectCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>{'\u9879\u76ee\u540d\u79f0'}</span>
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
                <span>{'\u5ba2\u6237\u7f16\u7801'}</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setCustomerCode(event.target.value)}
                  placeholder="cust-acme"
                  value={customerCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>{'\u5ba2\u6237\u540d\u79f0'}</span>
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
              {'\u4fdd\u5b58\u8d44\u6599'}
            </Button>

            <p className="space-profile-panel__hint">
              Space type helps users understand the business scope. Access is still controlled by
              tenant, member role, and document access scope.
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
