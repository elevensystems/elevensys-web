import { NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIES } from '@/lib/auth';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export const GET = async (request: NextRequest) => {
  const cognitoDomain = requireEnv('COGNITO_DOMAIN');
  const clientId = requireEnv('COGNITO_CLIENT_ID');
  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get(AUTH_COOKIES.oauthState)?.value;
  const codeVerifier = request.cookies.get(AUTH_COOKIES.pkceVerifier)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
  }

  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing PKCE verifier' },
      { status: 400 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/callback`;

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return NextResponse.json(
      { error: 'Token exchange failed', details: errorText },
      { status: 400 }
    );
  }

  const tokenJson = (await tokenResponse.json()) as TokenResponse;

  if (!tokenJson.id_token || !tokenJson.refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
  }

  const response = NextResponse.redirect(new URL('/', request.url));

  response.cookies.set(AUTH_COOKIES.idToken, tokenJson.id_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: tokenJson.expires_in,
  });

  response.cookies.set(AUTH_COOKIES.refreshToken, tokenJson.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Clear transient OAuth cookies.
  response.cookies.set(AUTH_COOKIES.oauthState, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(AUTH_COOKIES.pkceVerifier, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
};
