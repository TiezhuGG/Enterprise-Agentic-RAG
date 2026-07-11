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
  CUSTOMER: 'Customer',
  DEPARTMENT: 'Department',
  GENERAL: 'General',
  PROJECT: 'Project',
};

const spaceTypeDescriptions: Record<KnowledgeSpaceType, string> = {
  CUSTOMER: 'Customer-facing knowledge scope.',
  DEPARTMENT: 'Department-owned knowledge scope.',
  GENERAL: 'Shared enterprise knowledge scope.',
  PROJECT: 'Project-specific knowledge scope.',
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
          <CardTitle>Space Profile</CardTitle>
          <CardDescription>
            {selectedSpace
              ? 'Describe the business scope for this knowledge space.'
              : 'Select a knowledge space first.'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? 'Editable' : 'Read only'}
        </Badge>
      </CardHeader>
      <CardContent>
        {!selectedSpace ? (
          <div className="space-profile-panel__empty">No space selected.</div>
        ) : (
          <form className="space-profile-panel" onSubmit={handleSubmit}>
            <div className="space-profile-panel__summary">
              <div>
                <BriefcaseBusiness />
                <span>{spaceTypeLabels[selectedSpace.type]}</span>
              </div>
              <div>
                <Users />
                <span>{spaceMembers.length} members</span>
              </div>
            </div>

            <label className="space-profile-panel__field">
              <span>Space type</span>
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
              <span>Department ID</span>
              <Input
                disabled={!canManage || loading}
                onChange={(event) => setDepartmentId(event.target.value)}
                placeholder="dept-finance"
                value={departmentId}
              />
            </label>

            <div className="space-profile-panel__split">
              <label className="space-profile-panel__field">
                <span>Project code</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setProjectCode(event.target.value)}
                  placeholder="proj-erp-2026"
                  value={projectCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>Project name</span>
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
                <span>Customer code</span>
                <Input
                  disabled={!canManage || loading}
                  onChange={(event) => setCustomerCode(event.target.value)}
                  placeholder="cust-acme"
                  value={customerCode}
                />
              </label>
              <label className="space-profile-panel__field">
                <span>Customer name</span>
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
              Save profile
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
