import crypto from 'crypto';
import * as otplib from 'otplib';
import { supabase } from './supabase';

export const SESSION_COOKIE = 'yk_session';

const SESSION_SECRET = process.env.AUTH_SESSION_SECRET!;
const VIEW_LINK_SECRET = process.env.AUTH_VIEW_LINK_SECRET!;
const VIEW_LINK_VALID_DAYS = 3;

export type Session = { role: 'writer' } | { role: 'viewer'; asOf: string };

function hmac(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// 今日の日付(JST基準)を YYYY-MM-DD で返す
export function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// 閲覧リンク用トークン: "<発行日>.<署名>"
export function createViewerToken(issuedDate: string): string {
  return `${issuedDate}.${hmac(VIEW_LINK_SECRET, issuedDate)}`;
}

export function verifyViewerToken(token: string): { issuedDate: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [issuedDate, sig] = parts;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedDate)) return null;
  if (!timingSafeEqualStr(sig, hmac(VIEW_LINK_SECRET, issuedDate))) return null;

  const issued = new Date(issuedDate + 'T00:00:00+09:00').getTime();
  const now = new Date(todayJST() + 'T00:00:00+09:00').getTime();
  const diffDays = (now - issued) / 86400000;
  if (diffDays < 0 || diffDays > VIEW_LINK_VALID_DAYS) return null;

  return { issuedDate };
}

// セッションCookie: JSONペイロードに署名を付けたもの
export function signSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${hmac(SESSION_SECRET, payload)}`;
}

export function verifySession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!timingSafeEqualStr(sig, hmac(SESSION_SECRET, payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed?.role === 'writer') return { role: 'writer' };
    if (parsed?.role === 'viewer' && typeof parsed.asOf === 'string') {
      return { role: 'viewer', asOf: parsed.asOf };
    }
    return null;
  } catch {
    return null;
  }
}

// AUTH_TOTP_SECRETS="email1:secret1,email2:secret2" の形式で、
// Authenticatorアプリに登録した秘密鍵をメールアドレスごとに保持する
function getTotpSecrets(): Record<string, string> {
  const raw = process.env.AUTH_TOTP_SECRETS || '';
  const map: Record<string, string> = {};
  raw.split(',').forEach((pair) => {
    const [email, secret] = pair.split(':');
    if (email && secret) map[email.trim().toLowerCase()] = secret.trim();
  });
  return map;
}

// メールアドレス + Authenticatorの6桁コードを検証する(パスワードなし)
export function verifyTotpLogin(email: string, token: string): boolean {
  const secrets = getTotpSecrets();
  const secret = secrets[email.trim().toLowerCase()];
  if (!secret || !/^\d{6}$/.test(token)) return false;

  const result = otplib.verifySync({ secret, token, epochTolerance: 30 });
  return result.valid;
}

// ログイン試行制限(メールアドレスごと、Supabaseのlogin_attemptsテーブルで共有管理)
// Vercelはリクエストごとに別インスタンスで動くサーバーレス構成なので、
// プロセス内メモリでは複数インスタンス間でカウントが共有されない。DBに持たせて解決する。
const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15分

function loginKey(email: string): string {
  return email.trim().toLowerCase();
}

export async function checkLoginLock(email: string): Promise<{ locked: boolean; remainingMinutes: number }> {
  const { data } = await supabase
    .from('login_attempts')
    .select('locked_until')
    .eq('email', loginKey(email))
    .maybeSingle();

  if (data?.locked_until) {
    const lockedUntil = new Date(data.locked_until).getTime();
    if (lockedUntil > Date.now()) {
      return { locked: true, remainingMinutes: Math.ceil((lockedUntil - Date.now()) / 60000) };
    }
  }
  return { locked: false, remainingMinutes: 0 };
}

export async function recordLoginFailure(email: string): Promise<{ locked: boolean; remainingAttempts: number }> {
  const key = loginKey(email);
  const { data: existing } = await supabase
    .from('login_attempts')
    .select('fail_count')
    .eq('email', key)
    .maybeSingle();

  const nextFailCount = (existing?.fail_count || 0) + 1;

  if (nextFailCount >= LOGIN_MAX_ATTEMPTS) {
    await supabase.from('login_attempts').upsert(
      { email: key, fail_count: 0, locked_until: new Date(Date.now() + LOGIN_LOCKOUT_MS).toISOString() },
      { onConflict: 'email' }
    );
    return { locked: true, remainingAttempts: 0 };
  }

  await supabase.from('login_attempts').upsert(
    { email: key, fail_count: nextFailCount, locked_until: null },
    { onConflict: 'email' }
  );
  return { locked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS - nextFailCount };
}

export async function clearLoginAttempts(email: string): Promise<void> {
  await supabase.from('login_attempts').delete().eq('email', loginKey(email));
}
