export default function NoAccessPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-sm text-center space-y-3">
        <h1 className="text-lg font-bold text-white">アクセスできません</h1>
        <p className="text-sm text-slate-400">
          このページを見るには、共有された閲覧用リンクを開くか、スタッフとしてログインしてください。
        </p>
        <a href="/login" className="inline-block mt-2 text-sky-400 text-sm font-semibold hover:underline">
          スタッフログインへ
        </a>
      </div>
    </div>
  );
}
