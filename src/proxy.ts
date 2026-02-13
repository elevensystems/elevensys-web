import { NextRequest, NextResponse } from 'next/server';

import {
  getTenantConfig,
  resolveTenantFromHostname,
} from '@/lib/domain-config';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const tenant = resolveTenantFromHostname(hostname);
  const config = getTenantConfig(tenant);
  const { pathname } = request.nextUrl;

  // Block routes that are restricted for this tenant
  const isBlocked = config.blockedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isBlocked) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Forward tenant key to layouts via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant', tenant);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, assets (public files)
     * - api routes (no tenant scoping needed)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|assets|api).*)',
  ],
};
