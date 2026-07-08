export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  spaceIds?: string[];
  tenantId?: string;
  organizationId?: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  tenantId?: string;
  organizationId?: string;
  departmentId?: string;
  metadata: Record<string, unknown>;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthenticatedUser;
}
