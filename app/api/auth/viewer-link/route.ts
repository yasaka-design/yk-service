import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, createViewerToken, todayJST, verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (session?.role !== 'writer') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const issuedDate = todayJST();
  const token = createViewerToken(issuedDate);
  const origin = new URL(request.url).origin;
  const url = `${origin}/dashboard?key=${token}`;

  const subject = encodeURIComponent(`【YKサービス】${issuedDate} 時点の実績データ`);
  const body = encodeURIComponent(
    `${issuedDate}時点のデータをご覧いただけます。\n\n${url}\n\n※このリンクは発行から3日間のみ有効です。`
  );
  const mailto = `mailto:?subject=${subject}&body=${body}`;

  return NextResponse.json({ issuedDate, url, mailto });
}
