import { cookies } from 'next/headers';

export const AUTH_COOKIES = {
  idToken: 'cognito_id_token',
  refreshToken: 'cognito_refresh_token',
  oauthState: 'cognito_oauth_state',
  pkceVerifier: 'cognito_pkce_verifier',
} as const;

export type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

export type AuthUser = {
  name: string;
  email: string;
  avatar?: string;
};

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '='
  );
  return Buffer.from(padded, 'base64').toString('utf-8');
};

export const decodeJwt = (token: string): JwtPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

// Server-only helpers for reading the current session from HttpOnly cookies.
export const getIdToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.idToken)?.value ?? null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.refreshToken)?.value ?? null;
};

export const getSession = async () => {
  const idToken = await getIdToken();
  const refreshToken = await getRefreshToken();
  const payload = idToken ? decodeJwt(idToken) : null;
  return { idToken, refreshToken, payload };
};

export const getUserFromSession = async (): Promise<AuthUser | null> => {
  const { payload } = await getSession();
  if (!payload) return null;

  const email = typeof payload.email === 'string' ? payload.email : '';
  const nameFromToken = typeof payload.name === 'string' ? payload.name : '';
  const givenName =
    typeof payload.given_name === 'string' ? payload.given_name : '';
  const familyName =
    typeof payload.family_name === 'string' ? payload.family_name : '';
  const preferredUsername =
    typeof payload.preferred_username === 'string'
      ? payload.preferred_username
      : '';

  const displayName =
    nameFromToken ||
    [givenName, familyName].filter(Boolean).join(' ') ||
    preferredUsername ||
    email ||
    'User';

  const avatar = typeof payload.picture === 'string' ? payload.picture : '';
  const result = {
    name: displayName,
    email: email || displayName,
    avatar: avatar || undefined,
  };
  return result;
};
