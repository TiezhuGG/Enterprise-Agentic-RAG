export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthenticatedUser;
}
