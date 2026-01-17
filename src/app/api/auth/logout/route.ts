import { NextResponse } from 'next/server';

import { AUTH_COOKIES } from '@/lib/auth';
import { requireEnv } from '@/lib/utils';

export const GET = async () => {
  const cognitoDomain = requireEnv('COGNITO_DOMAIN');
  const clientId = requireEnv('COGNITO_CLIENT_ID');
  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');

  const logoutUrl = new URL(`${cognitoDomain}/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('logout_uri', appUrl);

  const response = NextResponse.redirect(logoutUrl.toString());

  response.cookies.set(AUTH_COOKIES.idToken, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(AUTH_COOKIES.refreshToken, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
};
