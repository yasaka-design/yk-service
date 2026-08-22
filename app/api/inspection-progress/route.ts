import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWriterClient, supabase } from '@/lib/supabase';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

async function requireWriter() {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  return session?.role === 'writer';
}

export async function GET(request: Request) {
  if (!(await requireWriter())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('inspection_progress')
    .select('*')
    .eq('target_month', month)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

export async function POST(request: Request) {
  if (!(await requireWriter())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.target_month) {
    return NextResponse.json({ error: 'target_month is required' }, { status: 400 });
  }

  const writer = await getWriterClient();
  const { data, error } = await writer
    .from('inspection_progress')
    .upsert([body], { onConflict: 'target_month' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}
