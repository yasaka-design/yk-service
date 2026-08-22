import crypto from 'crypto';
import * as otplib from 'otplib';

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

// ログイン試行制限(メールアドレスごと、プロセス内メモリで管理)
// 複数インスタンス/サーバーレスにスケールする場合はこのままでは効かないため、
// その場合は共有ストア(Redis等)への置き換えが必要
const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15分

type LoginAttemptState = { failCount: number; lockedUntil: number | null };
const loginAttempts = new Map<string, LoginAttemptState>();

function loginKey(email: string): string {
  return email.trim().toLowerCase();
}

export function checkLoginLock(email: string): { locked: boolean; remainingMinutes: number } {
  const state = loginAttempts.get(loginKey(email));
  if (state?.lockedUntil && state.lockedUntil > Date.now()) {
    return { locked: true, remainingMinutes: Math.ceil((state.lockedUntil - Date.now()) / 60000) };
  }
  return { locked: false, remainingMinutes: 0 };
}

export function recordLoginFailure(email: string): { locked: boolean; remainingAttempts: number } {
  const key = loginKey(email);
  const state = loginAttempts.get(key) || { failCount: 0, lockedUntil: null };
  state.failCount += 1;

  if (state.failCount >= LOGIN_MAX_ATTEMPTS) {
    loginAttempts.set(key, { failCount: 0, lockedUntil: Date.now() + LOGIN_LOCKOUT_MS });
    return { locked: true, remainingAttempts: 0 };
  }

  loginAttempts.set(key, state);
  return { locked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS - state.failCount };
}

export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(loginKey(email));
}
