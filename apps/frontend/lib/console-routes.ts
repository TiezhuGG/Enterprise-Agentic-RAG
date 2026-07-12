import type { AppSection } from '@/types/workbench';

export type ConsoleRouteKey =
  | 'dashboard'
  | 'documents'
  | 'document-spaces'
  | 'knowledge-base-detail'
  | 'document-tasks'
  | 'document-access'
  | 'user-roles'
  | 'search'
  | 'assistant'
  | 'graph'
  | 'profile'
  | 'system-status'
  | 'system-executions'
  | 'system-debug';

export interface ConsoleRouteDefinition {
  key: ConsoleRouteKey;
  path: string;
  section: AppSection;
  title: string;
}

export type ConsoleNavigationGroup = 'overview' | 'knowledge' | 'applications' | 'governance' | 'operations';

export interface ConsoleNavigationItem {
  group: ConsoleNavigationGroup;
  key: ConsoleRouteKey;
  label: string;
}

export interface ConsoleNavigationGroupDefinition {
  key: ConsoleNavigationGroup;
  label: string;
}

export const consoleRoutes: Record<ConsoleRouteKey, ConsoleRouteDefinition> = {
  dashboard: { key: 'dashboard', path: '/console', section: 'dashboard', title: '仪表盘' },
  documents: { key: 'documents', path: '/console/documents', section: 'documents', title: '文档列表' },
  'document-spaces': { key: 'document-spaces', path: '/console/knowledge-bases', section: 'documents', title: '知识库管理' },
  'knowledge-base-detail': { key: 'knowledge-base-detail', path: '/console/knowledge-bases/[spaceId]', section: 'documents', title: '知识库详情' },
  'document-tasks': { key: 'document-tasks', path: '/console/documents/tasks', section: 'documents', title: '入库任务' },
  'document-access': { key: 'document-access', path: '/console/documents/access', section: 'governance', title: '访问权限' },
  'user-roles': { key: 'user-roles', path: '/console/governance/users', section: 'governance', title: '用户与角色' },
  search: { key: 'search', path: '/console/search', section: 'search', title: '智能搜索' },
  assistant: { key: 'assistant', path: '/console/assistant', section: 'assistant', title: 'AI 智能问答' },
  graph: { key: 'graph', path: '/console/graph', section: 'graph', title: '知识图谱' },
  profile: { key: 'profile', path: '/console/profile', section: 'profile', title: '个人中心' },
  'system-status': { key: 'system-status', path: '/console/system', section: 'system', title: '系统状态' },
  'system-executions': { key: 'system-executions', path: '/console/system/executions', section: 'system', title: '执行记录' },
  'system-debug': { key: 'system-debug', path: '/console/system/debug', section: 'system', title: '高级调试' },
};

export const consoleNavigationGroups: ConsoleNavigationGroupDefinition[] = [
  { key: 'overview', label: '概览' },
  { key: 'knowledge', label: '知识管理' },
  { key: 'applications', label: '知识应用' },
  { key: 'governance', label: '治理' },
  { key: 'operations', label: '运维' },
];

export const consoleNavigationItems: ConsoleNavigationItem[] = [
  { group: 'overview', key: 'dashboard', label: '工作概览' },
  { group: 'knowledge', key: 'document-spaces', label: '知识库' },
  { group: 'knowledge', key: 'documents', label: '文档' },
  { group: 'applications', key: 'search', label: '智能搜索' },
  { group: 'applications', key: 'assistant', label: 'AI 问答' },
  { group: 'applications', key: 'graph', label: '知识图谱' },
  { group: 'governance', key: 'document-access', label: '访问权限' },
  { group: 'governance', key: 'user-roles', label: '用户与角色' },
  { group: 'operations', key: 'system-status', label: '系统健康' },
  { group: 'operations', key: 'system-executions', label: '执行记录' },
  { group: 'operations', key: 'system-debug', label: '高级调试' },
];

const pathToRoute = new Map(
  Object.values(consoleRoutes)
    .filter((route) => route.key !== 'knowledge-base-detail')
    .map((route) => [route.path.replace('/console/', '').replace('/console', ''), route]),
);

export const getConsoleRouteFromSegments = (segments: string[] | undefined): ConsoleRouteDefinition | null => {
  const path = segments?.join('/') ?? '';

  if (segments?.[0] === 'knowledge-bases') {
    if (segments.length === 1) return consoleRoutes['document-spaces'];
    if (segments.length === 2 && segments[1]) return consoleRoutes['knowledge-base-detail'];
    return null;
  }

  if (path === 'documents/spaces') return consoleRoutes['document-spaces'];
  return pathToRoute.get(path) ?? null;
};

export const buildKnowledgeBaseHref = (spaceId: string): string => `/console/knowledge-bases/${spaceId}`;

export const getConsoleRouteForSection = (section: AppSection): ConsoleRouteDefinition => {
  const key: Record<AppSection, ConsoleRouteKey> = {
    assistant: 'assistant',
    dashboard: 'dashboard',
    documents: 'documents',
    governance: 'user-roles',
    graph: 'graph',
    profile: 'profile',
    search: 'search',
    system: 'system-status',
  };
  return consoleRoutes[key[section]];
};

export const buildConsoleHref = (
  key: ConsoleRouteKey,
  query: Record<string, string | null | undefined> = {},
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([name, value]) => {
    if (value) searchParams.set(name, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `${consoleRoutes[key].path}?${queryString}` : consoleRoutes[key].path;
};
