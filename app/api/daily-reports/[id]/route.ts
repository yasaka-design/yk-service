import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWriterClient } from '@/lib/supabase';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { normalizeRow, sanitizeReport } from '../mapping';

export async function PUT(
  request: Request,
  { params }: RouteContext<'/api/daily-reports/[id]'>
) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (session?.role !== 'writer') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = sanitizeReport(body);
  if (body.date) updates.date = body.date;

  const writer = await getWriterClient();
  const { data, error } = await writer
    .from('daily_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(normalizeRow(data));
}
