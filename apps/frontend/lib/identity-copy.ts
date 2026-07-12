export interface DisplayCopy {
  description: string;
  name: string;
}

const systemRoleCopy: Record<string, DisplayCopy> = {
  admin: {
    description: '拥有平台级完整管理权限，可查看组织用户、系统角色与授权信息。',
    name: '系统管理员',
  },
  user: {
    description: '拥有默认的已认证用户权限，可访问被授权的知识库与检索能力。',
    name: '标准用户',
  },
};

const permissionCopy: Record<string, DisplayCopy> = {
  'knowledge.confidential.read': {
    description: '在策略允许时查看机密知识资源。',
    name: '查看机密知识',
  },
  'knowledge.read': {
    description: '查看知识库、文档、切片和检索候选内容。',
    name: '查看知识库',
  },
  'knowledge.retrieve': {
    description: '在已获授权的知识库中执行检索。',
    name: '检索知识库',
  },
  'role.manage': {
    description: '查看系统角色与权限定义。',
    name: '管理角色',
  },
  'user.read': {
    description: '查看用户记录和已分配角色。',
    name: '查看用户',
  },
  'user.write': {
    description: '创建和更新用户记录。',
    name: '管理用户',
  },
};

export const getDisplayPermission = (code: string): DisplayCopy =>
  permissionCopy[code] ?? { description: '系统权限代码。', name: code };

export const getDisplaySystemRole = (role: {
  code: string;
  description?: string | null;
  name?: string | null;
}): DisplayCopy =>
  systemRoleCopy[role.code] ?? {
    description: role.description ?? '未填写说明。',
    name: role.name ?? role.code,
  };

export const getDisplayUserName = (name?: string | null, email?: string | null): string => {
  if (email?.toLowerCase() === 'admin@example.com' || name === 'System Administrator') {
    return '系统管理员';
  }

  if (email?.toLowerCase() === 'space-owner@example.com' || name === 'Space Owner') {
    return '知识库负责人';
  }

  if (email?.toLowerCase() === 'space-editor@example.com' || name === 'Space Editor') {
    return '知识库编辑者';
  }

  if (email?.toLowerCase() === 'space-viewer@example.com' || name === 'Space Viewer') {
    return '知识库查看者';
  }

  return name ?? email ?? '未命名用户';
};
