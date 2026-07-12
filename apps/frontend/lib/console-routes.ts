import type { AppSection } from '@/types/workbench';

export type ConsoleRouteKey =
  | 'dashboard'
  | 'documents'
  | 'document-spaces'
  | 'document-tasks'
  | 'document-access'
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
  dashboard: { key: 'dashboard', path: '/console', section: 'dashboard', title: '\u4eea\u8868\u76d8' },
  documents: { key: 'documents', path: '/console/documents', section: 'documents', title: '\u6587\u6863\u5217\u8868' },
  'document-spaces': { key: 'document-spaces', path: '/console/documents/spaces', section: 'documents', title: '\u77e5\u8bc6\u7a7a\u95f4' },
  'document-tasks': { key: 'document-tasks', path: '/console/documents/tasks', section: 'documents', title: '\u89e3\u6790\u4efb\u52a1' },
  'document-access': { key: 'document-access', path: '/console/documents/access', section: 'documents', title: '\u6743\u9650\u8303\u56f4' },
  search: { key: 'search', path: '/console/search', section: 'search', title: '\u667a\u80fd\u641c\u7d22' },
  assistant: { key: 'assistant', path: '/console/assistant', section: 'assistant', title: 'AI \u667a\u80fd\u95ee\u7b54' },
  graph: { key: 'graph', path: '/console/graph', section: 'graph', title: '\u77e5\u8bc6\u56fe\u8c31' },
  profile: { key: 'profile', path: '/console/profile', section: 'profile', title: '\u4e2a\u4eba\u4e2d\u5fc3' },
  'system-status': { key: 'system-status', path: '/console/system', section: 'system', title: '\u7cfb\u7edf\u72b6\u6001' },
  'system-executions': { key: 'system-executions', path: '/console/system/executions', section: 'system', title: '\u6267\u884c\u8bb0\u5f55' },
  'system-debug': { key: 'system-debug', path: '/console/system/debug', section: 'system', title: '\u9ad8\u7ea7\u8c03\u8bd5' },
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
  { group: 'knowledge', key: 'document-spaces', label: '知识空间' },
  { group: 'knowledge', key: 'documents', label: '文档' },
  { group: 'knowledge', key: 'document-tasks', label: '入库任务' },
  { group: 'applications', key: 'search', label: '智能搜索' },
  { group: 'applications', key: 'assistant', label: 'AI 问答' },
  { group: 'applications', key: 'graph', label: '知识图谱' },
  { group: 'governance', key: 'document-access', label: '访问权限' },
  { group: 'operations', key: 'system-status', label: '系统健康' },
  { group: 'operations', key: 'system-executions', label: '执行记录' },
  { group: 'operations', key: 'system-debug', label: '高级调试' },
];

const pathToRoute = new Map(
  Object.values(consoleRoutes).map((route) => [route.path.replace('/console/', '').replace('/console', ''), route]),
);

export const getConsoleRouteFromSegments = (segments: string[] | undefined): ConsoleRouteDefinition | null => {
  const path = segments?.join('/') ?? '';
  return pathToRoute.get(path) ?? null;
};

export const getConsoleRouteForSection = (section: AppSection): ConsoleRouteDefinition => {
  const key: Record<AppSection, ConsoleRouteKey> = {
    assistant: 'assistant', dashboard: 'dashboard', documents: 'documents', graph: 'graph', profile: 'profile', search: 'search', system: 'system-status',
  };
  return consoleRoutes[key[section]];
};

export const buildConsoleHref = (key: ConsoleRouteKey, query: Record<string, string | null | undefined> = {}): string => {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([name, value]) => { if (value) searchParams.set(name, value); });
  const queryString = searchParams.toString();
  return queryString ? `${consoleRoutes[key].path}?${queryString}` : consoleRoutes[key].path;
};
