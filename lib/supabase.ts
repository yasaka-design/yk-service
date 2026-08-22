import { createClient } from '@supabase/supabase-js'

// サーバー専用(ブラウザに公開しない)。クライアント側からは
// 必ず /api/* 経由でアクセスし、このファイルは route.ts からのみ import すること。
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// 読み取り専用(anon)クライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 書き込み専用クライアント: サーバーだけが知っている専用Supabaseアカウントでログインする。
// RLS側は「authenticated」ロールのみ書き込み(INSERT/UPDATE)を許可しているため、
// 書き込みを行うAPIルートは必ずこちらを使うこと(supabase(anon)では書き込みが拒否される)。
export async function getWriterClient() {
  const client = createClient(supabaseUrl, supabaseAnonKey)
  const { error } = await client.auth.signInWithPassword({
    email: process.env.SUPABASE_WRITER_EMAIL!,
    password: process.env.SUPABASE_WRITER_PASSWORD!,
  })
  if (error) throw error
  return client
}