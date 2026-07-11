'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
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
import type { SpaceMemberDetail, SpaceMemberRole } from '@/types/workbench';

const memberRoleLabels: Record<SpaceMemberRole, string> = {
  EDITOR: 'Editor',
  OWNER: 'Owner',
  VIEWER: 'Viewer',
};

const roleDescriptions: Record<SpaceMemberRole, string> = {
  EDITOR: 'Can upload, ingest, and update knowledge documents.',
  OWNER: 'Can manage members, documents, and space settings.',
  VIEWER: 'Can read and retrieve knowledge.',
};

export function SpaceMembersPanel() {
  const addSpaceMember = useWorkbenchStore((state) => state.addSpaceMember);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const loadingSpaceMembers = useWorkbenchStore((state) => state.loadingSpaceMembers);
  const removeSpaceMember = useWorkbenchStore((state) => state.removeSpaceMember);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaceMembersError = useWorkbenchStore((state) => state.spaceMembersError);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const updateSpaceMemberRole = useWorkbenchStore((state) => state.updateSpaceMemberRole);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SpaceMemberRole>('VIEWER');
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const canManage = currentMember?.role === 'OWNER';
  const ownerCount = useMemo(
    () => spaceMembers.filter((member) => member.role === 'OWNER').length,
    [spaceMembers],
  );

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addSpaceMember(email, role);
    setEmail('');
    setRole('VIEWER');
  };

  return (
    <Card>
      <CardHeader className="space-members-panel__header">
        <div>
          <CardTitle>Space Members</CardTitle>
          <CardDescription>
            {selectedSpace
              ? `Manage access for ${selectedSpace.name}.`
              : 'Select a knowledge space first.'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? 'Owner controls' : 'Read only'}
        </Badge>
      </CardHeader>
      <CardContent className="space-members-panel">
        {spaceMembersError ? <div className="workbench-error">{spaceMembersError}</div> : null}

        <div className="space-members-panel__summary">
          <div>
            <Users />
            <span>{spaceMembers.length} members</span>
          </div>
          <div>
            <ShieldCheck />
            <span>{ownerCount} owners</span>
          </div>
        </div>

        {canManage ? (
          <form className="space-members-panel__form" onSubmit={handleAdd}>
            <Input
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              type="email"
              value={email}
            />
            <Select onValueChange={(value) => setRole(value as SpaceMemberRole)} value={role}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['VIEWER', 'EDITOR', 'OWNER'] as SpaceMemberRole[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {memberRoleLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!selectedSpaceId || !email.trim() || loadingSpaceMembers}
              type="submit"
            >
              <UserPlus />
              Add
            </Button>
          </form>
        ) : (
          <div className="space-members-panel__readonly">
            Only space owners can add, remove, or change member roles.
          </div>
        )}

        <div className="space-members-panel__list">
          {spaceMembers.length === 0 ? (
            <div className="space-members-panel__empty">No members loaded.</div>
          ) : null}
          {spaceMembers.map((member) => (
            <SpaceMemberRow
              canManage={canManage}
              currentUserId={authUser?.id ?? null}
              key={member.userId}
              loading={loadingSpaceMembers}
              member={member}
              onRemove={removeSpaceMember}
              onUpdateRole={updateSpaceMemberRole}
              ownerCount={ownerCount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SpaceMemberRow({
  canManage,
  currentUserId,
  loading,
  member,
  onRemove,
  onUpdateRole,
  ownerCount,
}: {
  canManage: boolean;
  currentUserId: string | null;
  loading: boolean;
  member: SpaceMemberDetail;
  onRemove: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: SpaceMemberRole) => Promise<void>;
  ownerCount: number;
}) {
  const isLastOwner = member.role === 'OWNER' && ownerCount <= 1;
  const isSelf = member.userId === currentUserId;
  const disabled = loading || !canManage;
  const canRemove = canManage && !isLastOwner;

  return (
    <article className="space-members-panel__member">
      <div className="space-members-panel__avatar" aria-hidden="true">
        {toInitial(member.user.name ?? member.user.email)}
      </div>
      <div className="space-members-panel__identity">
        <strong>
          {member.user.name ?? member.user.email}
          {isSelf ? <Badge variant="secondary">You</Badge> : null}
        </strong>
        <span>{member.user.email}</span>
        <small>{roleDescriptions[member.role]}</small>
      </div>
      <Select
        disabled={disabled || isLastOwner}
        onValueChange={(value) => void onUpdateRole(member.userId, value as SpaceMemberRole)}
        value={member.role}
      >
        <SelectTrigger className="space-members-panel__role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['VIEWER', 'EDITOR', 'OWNER'] as SpaceMemberRole[]).map((role) => (
            <SelectItem key={role} value={role}>
              {memberRoleLabels[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        disabled={disabled || !canRemove}
        onClick={() => void onRemove(member.userId)}
        size="icon"
        title={isLastOwner ? 'The last owner cannot be removed.' : 'Remove member'}
        type="button"
        variant="ghost"
      >
        <Trash2 />
      </Button>
    </article>
  );
}

const toInitial = (value: string): string => value.trim().slice(0, 1).toUpperCase() || '?';
