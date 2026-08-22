'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        router.push('/');
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'ログインに失敗しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-lg font-bold text-white text-center">スタッフログイン</h1>
        <div>
          <label className="block text-xs text-slate-400 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Authenticatorの6桁コード</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white text-center text-2xl tracking-[0.5em] font-mono"
          />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded disabled:opacity-50"
        >
          {loading ? '確認中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}
