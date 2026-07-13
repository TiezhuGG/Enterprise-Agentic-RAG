'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, FolderKanban, Plus, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { enterpriseService } from '@/services/enterprise.service';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { EnterpriseDepartmentOption } from '@/types/enterprise';
import type { KnowledgeSpaceType } from '@/types/workbench';

const templates: Array<{
  description: string;
  icon: typeof Building2;
  label: string;
  type: KnowledgeSpaceType;
}> = [
  {
    description: '为一个部门隔离内部制度、流程和操作知识。',
    icon: Building2,
    label: '部门知识库',
    type: 'DEPARTMENT',
  },
  {
    description: '为一个项目集中资料，并限定参与成员的检索范围。',
    icon: FolderKanban,
    label: '项目知识库',
    type: 'PROJECT',
  },
  {
    description: '为客户交付资料创建独立、可控的知识边界。',
    icon: UsersRound,
    label: '客户知识库',
    type: 'CUSTOMER',
  },
  {
    description: '用于企业共享且不归属于特定部门或项目的资料。',
    icon: Plus,
    label: '通用知识库',
    type: 'GENERAL',
  },
];

interface SpaceCreationDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function SpaceCreationDialog({ onOpenChange, open }: SpaceCreationDialogProps) {
  const createSpace = useWorkbenchStore((state) => state.createSpace);
  const loading = useWorkbenchStore((state) => state.loading);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<EnterpriseDepartmentOption[]>([]);
  const [type, setType] = useState<KnowledgeSpaceType>('GENERAL');

  useEffect(() => {
    if (!open) return;
    void enterpriseService
      .listDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setName('');
      setDescription('');
      setDepartmentId('');
      setType('GENERAL');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName || (type === 'DEPARTMENT' && !departmentId)) {
      return;
    }

    await createSpace(trimmedName, {
      description: description.trim() || undefined,
      departmentId: departmentId || undefined,
      type,
      visibility: 'PRIVATE',
    });

    if (!useWorkbenchStore.getState().error) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建知识空间</DialogTitle>
          <DialogDescription>
            知识空间用于隔离成员、资料和 AI 检索范围。仅在需要独立的访问边界或业务语境时创建。
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((template) => {
              const Icon = template.icon;
              const selected = template.type === type;

              return (
                <button
                  className={cn(
                    'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border p-3 text-left transition-colors hover:bg-muted',
                    selected && 'border-primary bg-accent/40',
                  )}
                  key={template.type}
                  onClick={() => setType(template.type)}
                  type="button"
                >
                  <Icon className="row-span-2 mt-0.5 size-4 text-primary" />
                  <span className="font-medium">{template.label}</span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {template.description}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="grid gap-2 text-sm font-medium">
            空间名称
            <Input
              autoFocus
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：产品交付知识库"
              value={name}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            归属部门{type === 'DEPARTMENT' ? '（必填）' : '（可选）'}
            <Select
              onValueChange={(value) => setDepartmentId(value === 'none' ? '' : value)}
              value={departmentId || 'none'}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择业务归属部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不绑定部门</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <small className="text-xs font-normal leading-5 text-muted-foreground">
              部门用于归属、筛选和文档附加限制；访问知识库仍需由负责人显式添加成员。
            </small>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            说明（可选）
            <Textarea
              className="min-h-20 resize-y"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="说明这个空间包含什么资料、服务哪些成员。"
              value={description}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 border-y py-3 text-xs text-muted-foreground">
            <span>创建者将成为空间负责人，可在创建后配置成员和资料范围。</span>
            <Badge variant="secondary">默认私有</Badge>
          </div>
          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
              取消
            </Button>
            <Button
              disabled={loading || !name.trim() || (type === 'DEPARTMENT' && !departmentId)}
              type="submit"
            >
              <Plus />
              创建空间
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
