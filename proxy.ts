import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, signSession, verifySession, verifyViewerToken } from '@/lib/auth';

const PUBLIC_PREFIXES = ['/login', '/no-access', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function isViewerAllowedPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/api/dashboard';
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api/');
  const deny = () =>
    isApi
      ? NextResponse.json({ error: 'unauthorized' }, { status: 403 })
      : NextResponse.redirect(new URL('/no-access', request.url));

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySession(sessionToken);

  if (session?.role === 'writer') {
    return NextResponse.next();
  }

  if (session?.role === 'viewer') {
    return isViewerAllowedPath(pathname) && request.method === 'GET' ? NextResponse.next() : deny();
  }

  // セッションがない場合、閲覧リンクのトークン(?key=)を確認する
  const key = searchParams.get('key');
  if (key) {
    const verified = verifyViewerToken(key);
    if (verified) {
      const res = NextResponse.redirect(new URL('/dashboard', request.url));
      res.cookies.set(SESSION_COOKIE, signSession({ role: 'viewer', asOf: verified.issuedDate }), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 3,
      });
      return res;
    }
  }

  return deny();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
