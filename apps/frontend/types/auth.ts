export interface AuthenticatedUser {
  email: string;
  id: string;
  metadata: Record<string, unknown>;
  permissions: string[];
  roles: string[];
  spaceIds: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}
