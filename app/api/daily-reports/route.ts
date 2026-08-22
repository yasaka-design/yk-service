import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWriterClient, supabase } from '@/lib/supabase';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { normalizeRow, sanitizeReport } from './mapping';

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
  const now = new Date();
  const year = Number(searchParams.get('year')) || now.getFullYear();
  const month = Number(searchParams.get('month')) || now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: (data || []).map(normalizeRow) });
}

export async function POST(request: Request) {
  if (!(await requireWriter())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const body = await request.json();

  if (!body.date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const writer = await getWriterClient();
  const { data, error } = await writer
    .from('daily_reports')
    .upsert([{ date: body.date, ...sanitizeReport(body) }], { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(normalizeRow(data));
}
