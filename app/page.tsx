'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MonthlyTarget = {
  target_month: string
  volvo_new_orders: number
  volvo_used_orders: number
  japan_new_orders: number
  japan_used_orders: number
  volvo_shaken_count: number
  volvo_tenken_count: number
  volvo_general_count: number
  other_shaken_count: number
  other_tenken_count: number
  other_general_count: number
  volvo_profit: number
  volvo_tenken_profit: number
  volvo_general_profit: number
  volvo_labor_sales: number
  other_profit: number
  other_tenken_profit: number
  other_general_profit: number
  other_labor_sales: number
  volvo_parts_sales: number
  other_parts_sales: number
  coating_count: number
  film_count: number
  insurance_count: number
}

type InspectionProgress = {
  target_month: string
  current_month_shaken_target: number
  current_month_shaken_done: number
  current_month_tenken_target: number
  current_month_tenken_done: number
  next_month_shaken_target: number
  next_month_shaken_done: number
  next_month_tenken_target: number
  next_month_tenken_done: number
  after_next_month_shaken_target: number
  after_next_month_shaken_done: number
  after_next_month_tenken_target: number
  after_next_month_tenken_done: number
}

const TARGET_ITEMS: { key: keyof MonthlyTarget; label: string; category: string; isAmount?: boolean }[] = [
  { key: 'volvo_new_orders', label: 'ボルボ 新車販売台数', category: '1. 営業台数' },
  { key: 'volvo_used_orders', label: 'ボルボ 中古車販売台数', category: '1. 営業台数' },
  { key: 'japan_new_orders', label: '国産 新車販売台数', category: '1. 営業台数' },
  { key: 'japan_used_orders', label: '国産 中古車販売台数', category: '1. 営業台数' },
  { key: 'volvo_shaken_count', label: 'ボルボ 車検台数', category: '2. サービス台数' },
  { key: 'volvo_tenken_count', label: 'ボルボ 点検台数', category: '2. サービス台数' },
  { key: 'volvo_general_count', label: 'ボルボ 一般整備台数', category: '2. サービス台数' },
  { key: 'other_shaken_count', label: '国産 車検台数', category: '2. サービス台数' },
  { key: 'other_tenken_count', label: '国産 点検台数', category: '2. サービス台数' },
  { key: 'other_general_count', label: '国産 一般整備台数', category: '2. サービス台数' },
  { key: 'volvo_profit', label: 'ボルボ 車検工賃目標', category: '3. ボルボ金額', isAmount: true },
  { key: 'volvo_tenken_profit', label: 'ボルボ 点検工賃目標', category: '3. ボルボ金額', isAmount: true },
  { key: 'volvo_general_profit', label: 'ボルボ 一般工賃目標', category: '3. ボルボ金額', isAmount: true },
  { key: 'volvo_labor_sales', label: 'ボルボ 粗利目標', category: '3. ボルボ金額', isAmount: true },
  { key: 'other_profit', label: '国産 車検工賃目標', category: '4. 国産金額', isAmount: true },
  { key: 'other_tenken_profit', label: '国産 点検工賃目標', category: '4. 国産金額', isAmount: true },
  { key: 'other_general_profit', label: '国産 一般工賃目標', category: '4. 国産金額', isAmount: true },
  { key: 'other_labor_sales', label: '国産 粗利目標', category: '4. 国産金額', isAmount: true },
  { key: 'volvo_parts_sales', label: '部品 (VOLVO)', category: '5. 部品・附帯', isAmount: true },
  { key: 'other_parts_sales', label: '部品 (国産)', category: '5. 部品・附帯', isAmount: true },
  { key: 'coating_count', label: 'コーティング (件数/金額)', category: '5. 部品・附帯' },
  { key: 'film_count', label: 'フィルム (件数/金額)', category: '5. 部品・附帯' },
  { key: 'insurance_count', label: '自動車保険 (件数/金額)', category: '5. 部品・附帯' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<'report' | 'target' | 'progress'>('report')

  const [reportData, setReportData] = useState({
    date: new Date().toISOString().split('T')[0],
    sr_visitors: 0,
    sr_new_visitors: 0,
    negotiations: 0,
    test_drives: 0,
    estimates: 0,
    volvo_new_orders: 0,
    volvo_used_orders: 0,
    volvo_new_registrations: 0,
    volvo_new_demo_cars: 0,
    volvo_used_registrations: 0,
    volvo_used_demo_cars: 0,
    japan_new_orders: 0,
    japan_used_orders: 0,
    japan_new_registrations: 0,
    japan_new_demo_cars: 0,
    japan_used_registrations: 0,
    japan_used_demo_cars: 0,
    volvo_shaken_count: 0,
    volvo_tenken_count: 0,
    volvo_general_count: 0,
    volvo_bankin_count: 0,
    other_shaken_count: 0,
    other_tenken_count: 0,
    other_general_count: 0,
    other_bankin_count: 0,
    volvo_profit_no_bankin: 0,
    volvo_bankin_profit: 0,
    other_profit_no_bankin: 0,
    other_bankin_profit: 0,
    volvo_labor_sales: 0,
    other_labor_sales: 0,
    parts_purchase: 0,
    insurance_count: 0,
    loan_lease_count: 0,
    trade_in_count: 0,
  })

  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear())
  const [selectedItemKey, setSelectedItemKey] = useState<keyof MonthlyTarget>('volvo_shaken_count')
  const [yearlyTargets, setYearlyTargets] = useState<MonthlyTarget[]>([])

  const [progressMonth, setProgressMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [progressData, setProgressData] = useState<InspectionProgress>({
    target_month: new Date().toISOString().slice(0, 7),
    current_month_shaken_target: 0,
    current_month_shaken_done: 0,
    current_month_tenken_target: 0,
    current_month_tenken_done: 0,
    next_month_shaken_target: 0,
    next_month_shaken_done: 0,
    next_month_tenken_target: 0,
    next_month_tenken_done: 0,
    after_next_month_shaken_target: 0,
    after_next_month_shaken_done: 0,
    after_next_month_tenken_target: 0,
    after_next_month_tenken_done: 0,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const [viewerLink, setViewerLink] = useState<{ issuedDate: string; url: string; mailto: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const fetchViewerLink = async () => {
    const res = await fetch('/api/auth/viewer-link')
    if (res.ok) {
      setViewerLink(await res.json())
    }
  }

  const handleCopyLink = async () => {
    if (!viewerLink) return
    await navigator.clipboard.writeText(viewerLink.url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const createEmptyYearlyTargets = (year: number): MonthlyTarget[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      target_month: `${year}-${String(i + 1).padStart(2, '0')}`,
      volvo_new_orders: 0,
      volvo_used_orders: 0,
      japan_new_orders: 0,
      japan_used_orders: 0,
      volvo_shaken_count: 0,
      volvo_tenken_count: 0,
      volvo_general_count: 0,
      other_shaken_count: 0,
      other_tenken_count: 0,
      other_general_count: 0,
      volvo_profit: 0,
      volvo_tenken_profit: 0,
      volvo_general_profit: 0,
      volvo_labor_sales: 0,
      other_profit: 0,
      other_tenken_profit: 0,
      other_general_profit: 0,
      other_labor_sales: 0,
      volvo_parts_sales: 0,
      other_parts_sales: 0,
      coating_count: 0,
      film_count: 0,
      insurance_count: 0,
    }))
  }

  // 目標データの読み込み
  const fetchYearlyTargets = async (year: number) => {
    setLoading(true)
    const res = await fetch(`/api/monthly-targets?year=${year}`)
    const json = res.ok ? await res.json() : { targets: [] }
    const data = json.targets || []

    const emptyTargets = createEmptyYearlyTargets(year)
    if (data.length > 0) {
      const merged = emptyTargets.map((empty) => {
        const found = data.find((d: MonthlyTarget) => d.target_month === empty.target_month)
        return found ? { ...empty, ...found } : empty
      })
      setYearlyTargets(merged)
    } else {
      setYearlyTargets(emptyTargets)
    }
    setLoading(false)
  }

  // 車検・点検進捗データの読み込み（日報からの自動累計合算つき）
  const fetchInspectionProgress = async (month: string) => {
    setLoading(true)

    // 1. 日報から当月の車検・点検台数（累計）を集計
    const [y, m] = month.split('-')
    const dailyRes = await fetch(`/api/daily-reports?year=${y}&month=${Number(m)}`)
    const dailyJson = dailyRes.ok ? await dailyRes.json() : { reports: [] }
    const dailyData = dailyJson.reports || []

    let autoShakenDone = 0
    let autoTenkenDone = 0

    dailyData.forEach((row: any) => {
      autoShakenDone += (row.volvo_shaken_count || 0) + (row.other_shaken_count || 0)
      autoTenkenDone += (row.volvo_tenken_count || 0) + (row.other_tenken_count || 0)
    })

    // 2. 進捗設定テーブルから対象台数などの設定を取得
    const progressRes = await fetch(`/api/inspection-progress?month=${month}`)
    const progressJson = progressRes.ok ? await progressRes.json() : { progress: null }
    const progressDataRes = progressJson.progress

    if (progressDataRes) {
      setProgressData({
        ...progressDataRes,
        // 日報の累計があれば自動セット（手入力も可能）
        current_month_shaken_done: progressDataRes.current_month_shaken_done || autoShakenDone,
        current_month_tenken_done: progressDataRes.current_month_tenken_done || autoTenkenDone,
      })
    } else {
      setProgressData({
        target_month: month,
        current_month_shaken_target: 0,
        current_month_shaken_done: autoShakenDone,
        current_month_tenken_target: 0,
        current_month_tenken_done: autoTenkenDone,
        next_month_shaken_target: 0,
        next_month_shaken_done: 0,
        next_month_tenken_target: 0,
        next_month_tenken_done: 0,
        after_next_month_shaken_target: 0,
        after_next_month_shaken_done: 0,
        after_next_month_tenken_target: 0,
        after_next_month_tenken_done: 0,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'target') {
      fetchYearlyTargets(targetYear)
    } else if (activeTab === 'progress') {
      fetchInspectionProgress(progressMonth)
    }
  }, [activeTab, targetYear, progressMonth])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select()

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setReportData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }))
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProgressData((prev) => ({
      ...prev,
      [name]: value === '' ? 0 : Number(value),
    }))
  }

  const handleMonthValueChange = (monthIndex: number, value: string) => {
    const numVal = value === '' ? 0 : Number(value)
    setYearlyTargets((prev) => {
      const updated = [...prev]
      updated[monthIndex] = {
        ...updated[monthIndex],
        [selectedItemKey]: numVal,
      }
      return updated
    })
  }

  const volvoEntryTotal = reportData.volvo_shaken_count + reportData.volvo_tenken_count + reportData.volvo_general_count + reportData.volvo_bankin_count
  const otherEntryTotal = reportData.other_shaken_count + reportData.other_tenken_count + reportData.other_general_count + reportData.other_bankin_count
  const totalEntries = volvoEntryTotal + otherEntryTotal

  const volvoProfitTotal = reportData.volvo_profit_no_bankin + reportData.volvo_bankin_profit
  const otherProfitTotal = reportData.other_profit_no_bankin + reportData.other_bankin_profit
  const grandTotalProfit = volvoProfitTotal + otherProfitTotal

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const submitData = {
      ...reportData,
      volvo_profit_with_bankin: volvoProfitTotal,
      other_profit_with_bankin: otherProfitTotal,
    }

    const res = await fetch('/api/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMessage(`エラー: ${json.error || '保存に失敗しました'}`)
    } else {
      setMessage('日報を保存しました！')
    }
  }

  const handleYearlyTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/monthly-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yearlyTargets),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMessage(`エラー: ${json.error || '保存に失敗しました'}`)
    } else {
      setMessage(`${targetYear}年の目標設定をすべて上書き保存しました！`)
    }
  }

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/inspection-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMessage(`エラー: ${json.error || '保存に失敗しました'}`)
    } else {
      setMessage(`${progressMonth} の車検・点検進捗データを更新保存しました！`)
    }
  }

  const calcRate = (done: number, target: number) => {
    if (!target || target === 0) return '0.0'
    return ((done / target) * 100).toFixed(1)
  }

  const activeItemInfo = TARGET_ITEMS.find((item) => item.key === selectedItemKey)
  const currentTotal = yearlyTargets.reduce((sum, item) => sum + (Number(item[selectedItemKey]) || 0), 0)

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 text-slate-800">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6">
        
        {/* タブ切替 & アカウント操作 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('report'); setMessage(''); }}
              className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'report' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              日報入力
            </button>
            <button
              onClick={() => { setActiveTab('target'); setMessage(''); }}
              className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'target' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              項目別・年間目標入力
            </button>
            <button
              onClick={() => { setActiveTab('progress'); setMessage(''); }}
              className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'progress' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              車検・点検進捗管理
            </button>
          </div>
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
            >
              ダッシュボード
            </Link>
            <Link
              href="/daily-reports"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
            >
              日報確認・修正
            </Link>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={fetchViewerLink}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              今日の閲覧リンクを発行
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              ログアウト
            </button>
          </div>
        </div>

        {viewerLink && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">{viewerLink.issuedDate} 時点の閲覧リンク(発行から3日間有効)</span>
              <button type="button" onClick={() => setViewerLink(null)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>
            <input
              readOnly
              value={viewerLink.url}
              onFocus={(e) => e.target.select()}
              className="w-full text-xs font-mono bg-white border border-blue-200 rounded p-2"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
              >
                {linkCopied ? 'コピーしました' : 'リンクをコピー'}
              </button>
              <a
                href={viewerLink.mailto}
                className="text-xs font-semibold bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded"
              >
                メール下書きを作成
              </a>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-3 mb-6 rounded text-sm font-bold ${message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* ---------------- タブ1: 日報入力画面 ---------------- */}
        {activeTab === 'report' && (
          <form onSubmit={handleReportSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 gap-4 border-b">
              <div>
                <h1 className="text-xl font-bold text-slate-900">デイリーレポート入力</h1>
                <p className="text-xs text-slate-500">Tabキーで連続移動して数字を入力できます</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-semibold text-sm">対象日付:</label>
                <input
                  type="date"
                  name="date"
                  value={reportData.date}
                  onChange={handleReportChange}
                  className="border border-slate-300 rounded px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 1. 来場・商談・見積 */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-sm font-bold text-blue-800 mb-3 border-b border-slate-200 pb-1">1. 来場・商談・見積</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SR来場(組)</label>
                  <input type="number" name="sr_visitors" value={reportData.sr_visitors} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">(内 新規来場)</label>
                  <input type="number" name="sr_new_visitors" value={reportData.sr_new_visitors} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">商談件数</label>
                  <input type="number" name="negotiations" value={reportData.negotiations} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">試乗件数</label>
                  <input type="number" name="test_drives" value={reportData.test_drives} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">見積件数</label>
                  <input type="number" name="estimates" value={reportData.estimates} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
              </div>
            </div>

            {/* 2. 車両受注・登録 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h2 className="text-sm font-bold text-blue-800 mb-3 border-b border-slate-200 pb-1">2-A. ボルボ 車両動向</h2>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">新車受注</label>
                    <input type="number" name="volvo_new_orders" value={reportData.volvo_new_orders} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">新車登録</label>
                    <input type="number" name="volvo_new_registrations" value={reportData.volvo_new_registrations} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">(内 デモ・代車)</label>
                    <input type="number" name="volvo_new_demo_cars" value={reportData.volvo_new_demo_cars} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">中古受注</label>
                    <input type="number" name="volvo_used_orders" value={reportData.volvo_used_orders} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">中古登録</label>
                    <input type="number" name="volvo_used_registrations" value={reportData.volvo_used_registrations} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">(内 デモ・代車)</label>
                    <input type="number" name="volvo_used_demo_cars" value={reportData.volvo_used_demo_cars} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h2 className="text-sm font-bold text-blue-800 mb-3 border-b border-slate-200 pb-1">2-B. 国産・その他 車両動向</h2>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">新車受注</label>
                    <input type="number" name="japan_new_orders" value={reportData.japan_new_orders} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">新車登録</label>
                    <input type="number" name="japan_new_registrations" value={reportData.japan_new_registrations} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">(内 デモ・代車)</label>
                    <input type="number" name="japan_new_demo_cars" value={reportData.japan_new_demo_cars} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">中古受注</label>
                    <input type="number" name="japan_used_orders" value={reportData.japan_used_orders} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">中古登録</label>
                    <input type="number" name="japan_used_registrations" value={reportData.japan_used_registrations} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">(内 デモ・代車)</label>
                    <input type="number" name="japan_used_demo_cars" value={reportData.japan_used_demo_cars} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. サービス入庫台数 */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-1">
                <h2 className="text-sm font-bold text-blue-800">3. サービス入庫台数</h2>
                <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">入庫総台数: {totalEntries} 台</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">【ボルボ】 小計: {volvoEntryTotal}台</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">車検</label>
                      <input type="number" name="volvo_shaken_count" value={reportData.volvo_shaken_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">点検</label>
                      <input type="number" name="volvo_tenken_count" value={reportData.volvo_tenken_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">一般整備</label>
                      <input type="number" name="volvo_general_count" value={reportData.volvo_general_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">鈑金</label>
                      <input type="number" name="volvo_bankin_count" value={reportData.volvo_bankin_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">【国産・その他】 小計: {otherEntryTotal}台</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">車検</label>
                      <input type="number" name="other_shaken_count" value={reportData.other_shaken_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">点検</label>
                      <input type="number" name="other_tenken_count" value={reportData.other_tenken_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">一般整備</label>
                      <input type="number" name="other_general_count" value={reportData.other_general_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">鈑金</label>
                      <input type="number" name="other_bankin_count" value={reportData.other_bankin_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 売上・粗利・工賃 */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-1">
                <h2 className="text-sm font-bold text-blue-800">4. 売上・粗利・工賃（円）</h2>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">サービス粗利総合計: ¥{grandTotalProfit.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="font-bold text-slate-700">【ボルボ 金額】</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">粗利(鈑金除く)</label>
                      <input type="number" name="volvo_profit_no_bankin" value={reportData.volvo_profit_no_bankin} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">鈑金粗利</label>
                      <input type="number" name="volvo_bankin_profit" value={reportData.volvo_bankin_profit} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">工賃売上</label>
                      <input type="number" name="volvo_labor_sales" value={reportData.volvo_labor_sales} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-700">【国産・その他 金額】</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">粗利(鈑金除く)</label>
                      <input type="number" name="other_profit_no_bankin" value={reportData.other_profit_no_bankin} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">鈑金粗利</label>
                      <input type="number" name="other_bankin_profit" value={reportData.other_bankin_profit} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">工賃売上</label>
                      <input type="number" name="other_labor_sales" value={reportData.other_labor_sales} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 保険・ローン・仕入れ */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-sm font-bold text-blue-800 mb-3 border-b border-slate-200 pb-1">5. 保険・ローン・仕入れ・下取り</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">部品仕入額(円)</label>
                  <input type="number" name="parts_purchase" value={reportData.parts_purchase} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">保険獲得(件)</label>
                  <input type="number" name="insurance_count" value={reportData.insurance_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ローン・リース(件)</label>
                  <input type="number" name="loan_lease_count" value={reportData.loan_lease_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">下取・買取(台)</label>
                  <input type="number" name="trade_in_count" value={reportData.trade_in_count} onChange={handleReportChange} onFocus={handleFocus} className="w-full border rounded p-1.5 text-right font-semibold bg-white" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-base shadow">
              {loading ? '保存中...' : 'デイリーレポートを保存する'}
            </button>
          </form>
        )}

        {/* ---------------- タブ2: 項目別・年間目標入力画面 ---------------- */}
        {activeTab === 'target' && (
          <form onSubmit={handleYearlyTargetSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b">
              <div>
                <h1 className="text-xl font-bold text-slate-900">項目別・1〜12月目標入力</h1>
                <p className="text-xs text-slate-500">DBに保存済みの目標値を表示しています。数値を書き換えて上書き保存が可能です。</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-semibold text-sm">対象年:</label>
                <select value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value))} className="border rounded px-3 py-1.5 font-bold">
                  <option value={2025}>2025年</option>
                  <option value={2026}>2026年</option>
                  <option value={2027}>2027年</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">入力する項目を選択</h2>
                {['1. 営業台数', '2. サービス台数', '3. ボルボ金額', '4. 国産金額', '5. 部品・附帯'].map((cat) => (
                  <div key={cat} className="space-y-1">
                    <p className="text-xs font-bold text-blue-900 border-b pb-1">{cat}</p>
                    <div className="grid grid-cols-1 gap-1">
                      {TARGET_ITEMS.filter((item) => item.category === cat).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSelectedItemKey(item.key)}
                          className={`text-left text-xs px-3 py-2 rounded font-semibold transition-all flex justify-between items-center ${
                            selectedItemKey === item.key
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {selectedItemKey === item.key && <span>▶</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="md:col-span-7 bg-white p-4 rounded-lg border border-slate-300 space-y-4 shadow-sm">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-blue-600 block">{targetYear}年 目標入力・編集</span>
                    <h2 className="text-lg font-bold text-blue-900">{activeItemInfo?.label}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">年間合計</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {activeItemInfo?.isAmount ? `¥${currentTotal.toLocaleString()}` : `${currentTotal.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                  {yearlyTargets.map((row, idx) => {
                    const monthNum = idx + 1
                    const val = row[selectedItemKey] || 0
                    return (
                      <div key={row.target_month} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200 hover:border-blue-400">
                        <span className="w-12 text-sm font-bold text-slate-700 text-center">{monthNum}月</span>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handleMonthValueChange(idx, e.target.value)}
                          onFocus={handleFocus}
                          placeholder="0"
                          className="flex-1 text-right text-base font-bold p-2 border rounded border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="w-10 text-xs font-semibold text-slate-500">{activeItemInfo?.isAmount ? '円' : '台/件'}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow text-sm"
                  >
                    {loading ? '保存中...' : `${targetYear}年の目標設定を上書き保存`}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ---------------- タブ3: 車検・点検進捗管理画面 ---------------- */}
        {activeTab === 'progress' && (
          <form onSubmit={handleProgressSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b">
              <div>
                <h1 className="text-xl font-bold text-slate-900">車検・点検 進捗管理</h1>
                <p className="text-xs text-slate-500">当月の「実施数」は日報の累計データから自動で計算・反映されます。</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-semibold text-sm">基準月:</label>
                <input
                  type="month"
                  value={progressMonth}
                  onChange={(e) => setProgressMonth(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-1.5 font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 当月 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 className="text-base font-bold text-blue-900 border-b pb-2">【当月】進捗 ({progressMonth})</h2>
                
                {/* 車検 */}
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">当月 車検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="current_month_shaken_target" value={progressData.current_month_shaken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>実施・入庫数 (日報自動反映)</span>
                    <input type="number" name="current_month_shaken_done" value={progressData.current_month_shaken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold bg-blue-50" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-blue-600">{calcRate(progressData.current_month_shaken_done, progressData.current_month_shaken_target)} %</span>
                  </div>
                </div>

                {/* 点検 */}
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">当月 点検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="current_month_tenken_target" value={progressData.current_month_tenken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>実施・入庫数 (日報自動反映)</span>
                    <input type="number" name="current_month_tenken_done" value={progressData.current_month_tenken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold bg-blue-50" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-blue-600">{calcRate(progressData.current_month_tenken_done, progressData.current_month_tenken_target)} %</span>
                  </div>
                </div>
              </div>

              {/* 翌月 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 className="text-base font-bold text-emerald-900 border-b pb-2">【翌月】進捗</h2>
                
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">翌月 車検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="next_month_shaken_target" value={progressData.next_month_shaken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>事前予約数</span>
                    <input type="number" name="next_month_shaken_done" value={progressData.next_month_shaken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-emerald-600">{calcRate(progressData.next_month_shaken_done, progressData.next_month_shaken_target)} %</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">翌月 点検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="next_month_tenken_target" value={progressData.next_month_tenken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>事前予約数</span>
                    <input type="number" name="next_month_tenken_done" value={progressData.next_month_tenken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-emerald-600">{calcRate(progressData.next_month_tenken_done, progressData.next_month_tenken_target)} %</span>
                  </div>
                </div>
              </div>

              {/* 翌々月 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h2 className="text-base font-bold text-purple-900 border-b pb-2">【翌々月】進捗</h2>
                
                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">翌々月 車検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="after_next_month_shaken_target" value={progressData.after_next_month_shaken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>事前予約数</span>
                    <input type="number" name="after_next_month_shaken_done" value={progressData.after_next_month_shaken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-purple-600">{calcRate(progressData.after_next_month_shaken_done, progressData.after_next_month_shaken_target)} %</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border space-y-2">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">翌々月 点検</span>
                  <div className="flex justify-between items-center text-xs">
                    <span>対象台数</span>
                    <input type="number" name="after_next_month_tenken_target" value={progressData.after_next_month_tenken_target} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>事前予約数</span>
                    <input type="number" name="after_next_month_tenken_done" value={progressData.after_next_month_tenken_done} onChange={handleProgressChange} onFocus={handleFocus} className="w-24 text-right border rounded p-1 font-bold" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs font-bold text-slate-600">進捗率</span>
                    <span className="text-lg font-extrabold text-purple-600">{calcRate(progressData.after_next_month_tenken_done, progressData.after_next_month_tenken_target)} %</span>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-base shadow">
              {loading ? '保存中...' : `${progressMonth} の車検・点検進捗を保存・更新`}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}