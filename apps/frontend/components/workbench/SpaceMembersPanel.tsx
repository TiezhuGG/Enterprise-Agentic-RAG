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
  EDITOR: '\u53ef\u7f16\u8f91\u6210\u5458',
  OWNER: '\u7a7a\u95f4\u8d1f\u8d23\u4eba',
  VIEWER: '\u53ea\u8bfb\u6210\u5458',
};

const roleDescriptions: Record<SpaceMemberRole, string> = {
  EDITOR: '\u53ef\u4e0a\u4f20\u3001\u89e3\u6790\u548c\u66f4\u65b0\u7a7a\u95f4\u5185\u7684\u77e5\u8bc6\u6587\u6863\u3002',
  OWNER: '\u53ef\u7ba1\u7406\u6210\u5458\u3001\u6587\u6863\u548c\u77e5\u8bc6\u7a7a\u95f4\u8d44\u6599\u3002',
  VIEWER: '\u53ef\u67e5\u770b\u548c\u68c0\u7d22\u7a7a\u95f4\u5185\u77e5\u8bc6\u3002',
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
          <CardTitle>{'\u7a7a\u95f4\u6210\u5458'}</CardTitle>
          <CardDescription>
            {selectedSpace
              ? `Manage access for ${selectedSpace.name}.`
              : '\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u77e5\u8bc6\u7a7a\u95f4\u3002'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? '\u8d1f\u8d23\u4eba\u7ba1\u7406' : '\u53ea\u8bfb'}
        </Badge>
      </CardHeader>
      <CardContent className="space-members-panel">
        {spaceMembersError ? <div className="workbench-error">{spaceMembersError}</div> : null}

        <div className="space-members-panel__summary">
          <div>
            <Users />
            <span>{spaceMembers.length}{' \u540d\u6210\u5458'}</span>
          </div>
          <div>
            <ShieldCheck />
            <span>{ownerCount}{' \u540d\u8d1f\u8d23\u4eba'}</span>
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
            \u4ec5\u7a7a\u95f4\u8d1f\u8d23\u4eba\u53ef\u4ee5\u6dfb\u52a0\u3001\u79fb\u9664\u6210\u5458\u6216\u8c03\u6574\u6210\u5458\u89d2\u8272\u3002
          </div>
        )}

        <div className="space-members-panel__list">
          {spaceMembers.length === 0 ? (
            <div className="space-members-panel__empty">\u6682\u65e0\u6210\u5458\u4fe1\u606f\u3002</div>
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
        title={isLastOwner ? '\u4e0d\u80fd\u79fb\u9664\u6700\u540e\u4e00\u4f4d\u7a7a\u95f4\u8d1f\u8d23\u4eba\u3002' : '\u79fb\u9664\u6210\u5458'}
        type="button"
        variant="ghost"
      >
        <Trash2 />
      </Button>
    </article>
  );
}

const toInitial = (value: string): string => value.trim().slice(0, 1).toUpperCase() || '?';
