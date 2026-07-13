'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDisplayUserName } from '@/lib/identity-copy';
import { knowledgeSpaceService } from '@/services/knowledge-space.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { SpaceMemberCandidate, SpaceMemberDetail, SpaceMemberRole } from '@/types/workbench';

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
  const addSpaceMembers = useWorkbenchStore((state) => state.addSpaceMembers);
  const authUser = useWorkbenchStore((state) => state.authUser);
  const loadingSpaceMembers = useWorkbenchStore((state) => state.loadingSpaceMembers);
  const removeSpaceMember = useWorkbenchStore((state) => state.removeSpaceMember);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const spaceMembersError = useWorkbenchStore((state) => state.spaceMembersError);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const updateSpaceMemberRole = useWorkbenchStore((state) => state.updateSpaceMemberRole);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
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
          {canManage
            ? '空间负责人'
            : `空间角色：${memberRoleLabels[currentMember?.role ?? 'VIEWER']}`}
        </Badge>
      </CardHeader>
      <CardContent className="space-members-panel">
        {spaceMembersError ? <div className="workbench-error">{spaceMembersError}</div> : null}
        <div className="space-members-panel__summary">
          <div>
            <Users />
            <span>{spaceMembers.length} 名成员</span>
          </div>
          <div>
            <ShieldCheck />
            <span>{ownerCount} 名负责人</span>
          </div>
        </div>

        {canManage ? (
          <div className="flex justify-end">
            <Button
              disabled={!selectedSpaceId || loadingSpaceMembers}
              onClick={() => setMemberPickerOpen(true)}
              type="button"
            >
              <UserPlus />
              添加成员
            </Button>
          </div>
        ) : (
          <div className="space-members-panel__readonly">
            仅空间负责人可以添加、移除成员或调整成员角色。当前权限不会限制你查看自己已获授权的知识。
          </div>
        )}

        <div className="space-members-panel__list">
          {spaceMembers.length === 0 ? (
            <div className="space-members-panel__empty">暂无成员信息。</div>
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
      <MemberPickerDialog
        onAdd={addSpaceMembers}
        onOpenChange={setMemberPickerOpen}
        open={memberPickerOpen}
        spaceId={selectedSpaceId}
      />
    </Card>
  );
}

function MemberPickerDialog({
  onAdd,
  onOpenChange,
  open,
  spaceId,
}: {
  onAdd: (members: Array<{ role: SpaceMemberRole; userId: string }>) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  spaceId: string | null;
}) {
  const [candidates, setCandidates] = useState<SpaceMemberCandidate[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, SpaceMemberRole>>({});

  useEffect(() => {
    if (!open || !spaceId) return;
    setLoading(true);
    void knowledgeSpaceService
      .listMemberCandidates(spaceId, keyword)
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [keyword, open, spaceId]);

  const selectedCount = Object.keys(selected).length;
  const toggleCandidate = (candidate: SpaceMemberCandidate) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[candidate.id]) delete next[candidate.id];
      else next[candidate.id] = 'VIEWER';
      return next;
    });
  };

  const handleAdd = async () => {
    const added = await onAdd(Object.entries(selected).map(([userId, role]) => ({ role, userId })));
    if (added) {
      setSelected({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加知识库成员</DialogTitle>
          <DialogDescription>
            从当前租户的活跃用户中选择成员。部门仅显示组织归属，不会自动决定知识库访问权限。
          </DialogDescription>
        </DialogHeader>
        <Input
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索姓名、邮箱或部门"
          value={keyword}
        />
        <div className="max-h-[50vh] overflow-y-auto border">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">正在加载可添加成员…</p>
          ) : candidates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">没有可添加的活跃用户。</p>
          ) : (
            candidates.map((candidate) => {
              const active = Boolean(selected[candidate.id]);
              return (
                <label
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_120px] items-center gap-3 border-b p-3 last:border-0"
                  key={candidate.id}
                >
                  <input
                    checked={active}
                    className="size-4"
                    onChange={() => toggleCandidate(candidate)}
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate">
                      {getDisplayUserName(candidate.name, candidate.email)}
                    </strong>
                    <span className="block truncate text-xs text-muted-foreground">
                      {candidate.email} · {candidate.department?.name ?? '未分配部门'}
                    </span>
                  </span>
                  <Select
                    disabled={!active}
                    onValueChange={(value) =>
                      setSelected((current) => ({
                        ...current,
                        [candidate.id]: value as SpaceMemberRole,
                      }))
                    }
                    value={selected[candidate.id] ?? 'VIEWER'}
                  >
                    <SelectTrigger>
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
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button
            disabled={selectedCount === 0 || loading}
            onClick={() => void handleAdd()}
            type="button"
          >
            <UserPlus />
            添加 {selectedCount || ''} 名成员
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <div aria-hidden="true" className="space-members-panel__avatar">
        {toInitial(displayName)}
      </div>
      <div className="space-members-panel__identity">
        <strong title={displayName}>
          {displayName}
          {isSelf ? <Badge variant="secondary">我</Badge> : null}
        </strong>
        <span title={member.user.email}>{member.user.email}</span>
        <small>{roleDescriptions[member.role]}</small>
      </div>
      {canManage ? (
        <Select
          disabled={loading || isLastOwner}
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
      ) : (
        <Badge className="w-fit" variant="secondary">
          {memberRoleLabels[member.role]}
        </Badge>
      )}
      {canManage ? (
        <Button
          disabled={loading || isLastOwner}
          onClick={() => void onRemove(member.userId)}
          size="icon"
          title={isLastOwner ? '不能移除最后一位空间负责人。' : '移除成员'}
          type="button"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      ) : null}
    </article>
  );
}

const toInitial = (value: string): string => value.trim().slice(0, 1).toUpperCase() || '?';
