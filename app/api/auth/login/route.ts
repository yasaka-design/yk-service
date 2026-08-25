import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  checkLoginLock,
  clearLoginAttempts,
  recordLoginFailure,
  signSession,
  verifyTotpLogin,
} from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email : '';
  const code = typeof body.code === 'string' ? body.code : '';

  if (!email) {
    return NextResponse.json({ error: 'メールアドレスまたはコードが違います' }, { status: 401 });
  }

  const lock = await checkLoginLock(email);
  if (lock.locked) {
    return NextResponse.json(
      { error: `試行回数の上限に達しました。${lock.remainingMinutes}分後にもう一度お試しください` },
      { status: 429 }
    );
  }

  if (!verifyTotpLogin(email, code)) {
    const result = await recordLoginFailure(email);
    if (result.locked) {
      return NextResponse.json(
        { error: '試行回数の上限に達しました。15分後にもう一度お試しください' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `メールアドレスまたはコードが違います(あと${result.remainingAttempts}回)` },
      { status: 401 }
    );
  }

  await clearLoginAttempts(email);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession({ role: 'writer' }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
