'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getDisplayUserName } from '@/lib/identity-copy';
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
  EDITOR: '编辑者',
  OWNER: '负责人',
  VIEWER: '查看者',
};

const roleDescriptions: Record<SpaceMemberRole, string> = {
  EDITOR: '可上传、重处理文档，并维护空间资料和文档权限。',
  OWNER: '可管理空间资料、成员、访问范围和空间生命周期。',
  VIEWER: '可查看、检索和引用空间中的已授权知识。',
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
  const currentMember =
    selectedSpace?.members.find((member) => member.userId === authUser?.id) ??
    spaceMembers.find((member) => member.userId === authUser?.id) ??
    null;
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
    <Card className="min-w-0">
      <CardHeader className="space-members-panel__header">
        <div className="min-w-0">
          <CardTitle>空间成员</CardTitle>
          <CardDescription>
            {selectedSpace ? `管理 ${selectedSpace.name} 的成员与角色。` : '请先选择一个知识空间。'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? '空间负责人' : `空间角色：${memberRoleLabels[currentMember?.role ?? 'VIEWER']}`}
        </Badge>
      </CardHeader>
      <CardContent className="space-members-panel">
        {spaceMembersError ? <div className="workbench-error">{spaceMembersError}</div> : null}
        <div className="space-members-panel__summary">
          <div><Users /><span>{spaceMembers.length} 名成员</span></div>
          <div><ShieldCheck /><span>{ownerCount} 名负责人</span></div>
        </div>

        {canManage ? (
          <form className="space-members-panel__form" onSubmit={handleAdd}>
            <Input onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" type="email" value={email} />
            <Select onValueChange={(value) => setRole(value as SpaceMemberRole)} value={role}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['VIEWER', 'EDITOR', 'OWNER'] as SpaceMemberRole[]).map((item) => (
                  <SelectItem key={item} value={item}>{memberRoleLabels[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!selectedSpaceId || !email.trim() || loadingSpaceMembers} type="submit"><UserPlus />添加成员</Button>
          </form>
        ) : (
          <div className="space-members-panel__readonly">
            仅空间负责人可以添加、移除成员或调整成员角色。当前权限不会限制你查看自己已获授权的知识。
          </div>
        )}

        <div className="space-members-panel__list">
          {spaceMembers.length === 0 ? <div className="space-members-panel__empty">暂无成员信息。</div> : null}
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
  const displayName = getDisplayUserName(member.user.name, member.user.email);

  return (
    <article className="space-members-panel__member">
      <div aria-hidden="true" className="space-members-panel__avatar">{toInitial(displayName)}</div>
      <div className="space-members-panel__identity">
        <strong title={displayName}>{displayName}{isSelf ? <Badge variant="secondary">我</Badge> : null}</strong>
        <span title={member.user.email}>{member.user.email}</span>
        <small>{roleDescriptions[member.role]}</small>
      </div>
      {canManage ? (
        <Select disabled={loading || isLastOwner} onValueChange={(value) => void onUpdateRole(member.userId, value as SpaceMemberRole)} value={member.role}>
          <SelectTrigger className="space-members-panel__role"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(['VIEWER', 'EDITOR', 'OWNER'] as SpaceMemberRole[]).map((role) => (
              <SelectItem key={role} value={role}>{memberRoleLabels[role]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge className="w-fit" variant="secondary">{memberRoleLabels[member.role]}</Badge>
      )}
      {canManage ? (
        <Button disabled={loading || isLastOwner} onClick={() => void onRemove(member.userId)} size="icon" title={isLastOwner ? '不能移除最后一位空间负责人。' : '移除成员'} type="button" variant="ghost"><Trash2 /></Button>
      ) : null}
    </article>
  );
}

const toInitial = (value: string): string => value.trim().slice(0, 1).toUpperCase() || '?';
