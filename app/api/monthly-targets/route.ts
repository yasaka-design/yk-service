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
  const year = Number(searchParams.get('year'));
  if (!year) {
    return NextResponse.json({ error: 'year is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('monthly_targets')
    .select('*')
    .gte('target_month', `${year}-01`)
    .lte('target_month', `${year}-12`)
    .order('target_month', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ targets: data || [] });
}

export async function POST(request: Request) {
  if (!(await requireWriter())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'array of target rows is required' }, { status: 400 });
  }

  const writer = await getWriterClient();
  const { data, error } = await writer
    .from('monthly_targets')
    .upsert(body, { onConflict: 'target_month' })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ targets: data });
}
