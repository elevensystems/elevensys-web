import { type NextRequest, NextResponse } from 'next/server';

/**
 * Injects the resolved pathname as a request header so server components
 * (e.g. the shared tools layout) can access it without client-side hooks.
 */
export function proxy(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  // Delete before setting to prevent callers from spoofing this header.
  requestHeaders.delete('x-pathname');
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/tools/:path*'],
};
