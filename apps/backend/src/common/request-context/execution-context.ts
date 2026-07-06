export interface ExecutionContext {
  userId: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  tenantId?: string;
  departmentId?: string;
  metadata: Record<string, unknown>;
}
