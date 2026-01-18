export type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  'cognito:groups'?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

export type UserRole = 'admin' | 'free' | 'pro';

export type AuthUser = {
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  groups: string[];
};
