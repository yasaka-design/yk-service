'use client';

import React, { useState, useEffect } from 'react';

interface DailyReport {
  id?: string;
  date: string; // YYYY-MM-DD
  sr_visitors: number;
  sr_new_visitors: number;
  negotiations: number;
  test_drives: number;
  estimates: number;
  volvo_new_orders: number;
  volvo_new_registrations: number;
  volvo_new_demo_cars: number;
  volvo_used_orders: number;
  volvo_used_registrations: number;
  volvo_used_demo_cars: number;
  japan_new_orders: number;
  japan_new_registrations: number;
  japan_new_demo_cars: number;
  japan_used_orders: number;
  japan_used_registrations: number;
  japan_used_demo_cars: number;
  volvo_shaken_count: number;
  volvo_tenken_count: number;
  volvo_general_count: number;
  volvo_bankin_count: number;
  other_shaken_count: number;
  other_tenken_count: number;
  other_general_count: number;
  other_bankin_count: number;
  volvo_profit_no_bankin: number;
  volvo_bankin_profit: number;
  volvo_labor_sales: number;
  other_profit_no_bankin: number;
  other_bankin_profit: number;
  other_labor_sales: number;
  parts_purchase: number;
  insurance_count: number;
  loan_lease_count: number;
  trade_in_count: number;
}

type ReportField = Exclude<keyof DailyReport, 'id' | 'date'>;

// app/page.tsx (日報入力画面) と同一の項目構成・カテゴリ分け
const FIELD_GROUPS: { category: string; color: string; fields: { key: ReportField; label: string; unit?: string }[] }[] = [
  {
    category: '1. 来場・商談・見積',
    color: 'text-blue-400',
    fields: [
      { key: 'sr_visitors', label: 'SR来場(組)' },
      { key: 'sr_new_visitors', label: '内 新規来場' },
      { key: 'negotiations', label: '商談件数' },
      { key: 'test_drives', label: '試乗件数' },
      { key: 'estimates', label: '見積件数' },
    ],
  },
  {
    category: '2-A. ボルボ 車両動向',
    color: 'text-sky-400',
    fields: [
      { key: 'volvo_new_orders', label: '新車受注' },
      { key: 'volvo_new_registrations', label: '新車登録' },
      { key: 'volvo_new_demo_cars', label: '新車デモ・代車' },
      { key: 'volvo_used_orders', label: '中古受注' },
      { key: 'volvo_used_registrations', label: '中古登録' },
      { key: 'volvo_used_demo_cars', label: '中古デモ・代車' },
    ],
  },
  {
    category: '2-B. 国産・その他 車両動向',
    color: 'text-slate-300',
    fields: [
      { key: 'japan_new_orders', label: '新車受注' },
      { key: 'japan_new_registrations', label: '新車登録' },
      { key: 'japan_new_demo_cars', label: '新車デモ・代車' },
      { key: 'japan_used_orders', label: '中古受注' },
      { key: 'japan_used_registrations', label: '中古登録' },
      { key: 'japan_used_demo_cars', label: '中古デモ・代車' },
    ],
  },
  {
    category: '3-A. ボルボ サービス入庫',
    color: 'text-amber-400',
    fields: [
      { key: 'volvo_shaken_count', label: '車検' },
      { key: 'volvo_tenken_count', label: '点検' },
      { key: 'volvo_general_count', label: '一般整備' },
      { key: 'volvo_bankin_count', label: '鈑金' },
    ],
  },
  {
    category: '3-B. 国産・その他 サービス入庫',
    color: 'text-amber-300',
    fields: [
      { key: 'other_shaken_count', label: '車検' },
      { key: 'other_tenken_count', label: '点検' },
      { key: 'other_general_count', label: '一般整備' },
      { key: 'other_bankin_count', label: '鈑金' },
    ],
  },
  {
    category: '4-A. ボルボ 金額',
    color: 'text-emerald-400',
    fields: [
      { key: 'volvo_profit_no_bankin', label: '粗利(鈑金除く)', unit: '円' },
      { key: 'volvo_bankin_profit', label: '鈑金粗利', unit: '円' },
      { key: 'volvo_labor_sales', label: '工賃売上', unit: '円' },
    ],
  },
  {
    category: '4-B. 国産・その他 金額',
    color: 'text-emerald-300',
    fields: [
      { key: 'other_profit_no_bankin', label: '粗利(鈑金除く)', unit: '円' },
      { key: 'other_bankin_profit', label: '鈑金粗利', unit: '円' },
      { key: 'other_labor_sales', label: '工賃売上', unit: '円' },
    ],
  },
  {
    category: '5. 保険・ローン・仕入れ・下取り',
    color: 'text-slate-300',
    fields: [
      { key: 'parts_purchase', label: '部品仕入額', unit: '円' },
      { key: 'insurance_count', label: '保険獲得(件)' },
      { key: 'loan_lease_count', label: 'ローン・リース(件)' },
      { key: 'trade_in_count', label: '下取・買取(台)' },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);
const TABLE_COLUMN_COUNT = 1 + ALL_FIELDS.length + 1; // 日付 + 項目 + 操作
const GROUP_START_KEYS = new Set(FIELD_GROUPS.map((g) => g.fields[0].key));

const createEmptyReport = (date: string): DailyReport => ({
  date,
  sr_visitors: 0,
  sr_new_visitors: 0,
  negotiations: 0,
  test_drives: 0,
  estimates: 0,
  volvo_new_orders: 0,
  volvo_new_registrations: 0,
  volvo_new_demo_cars: 0,
  volvo_used_orders: 0,
  volvo_used_registrations: 0,
  volvo_used_demo_cars: 0,
  japan_new_orders: 0,
  japan_new_registrations: 0,
  japan_new_demo_cars: 0,
  japan_used_orders: 0,
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
  volvo_labor_sales: 0,
  other_profit_no_bankin: 0,
  other_bankin_profit: 0,
  other_labor_sales: 0,
  parts_purchase: 0,
  insurance_count: 0,
  loan_lease_count: 0,
  trade_in_count: 0,
});

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function DailyReportsPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayDateStr = todayStr();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 日付文字列を YYYY-MM-DD に統一・標準化する関数
  const normalizeDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const cleanStr = dateStr.replace(/\//g, '-').split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length < 3) return dateStr;
    const y = parts[0];
    const m = String(parts[1]).padStart(2, '0');
    const d = String(parts[2]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 該当月の日数を取得し、未登録の日付のみ補完する処理
  const fillMissingDays = (fetchedReports: DailyReport[], year: number, month: number): DailyReport[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const reportMap = new Map<string, DailyReport>();

    // レポート側の日付表記を統一してMapに格納
    fetchedReports.forEach((r) => {
      const normalized = normalizeDateStr(r.date);
      reportMap.set(normalized, { ...r, date: normalized });
    });

    const fullList: DailyReport[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (reportMap.has(dateStr)) {
        // 既存データが存在する場合はそのデータを採用
        fullList.push(reportMap.get(dateStr)!);
      } else {
        // 未入力の日付のみデフォルト値(0)で生成
        fullList.push(createEmptyReport(dateStr));
      }
    }
    return fullList;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-reports?year=${selectedYear}&month=${selectedMonth}`);
      let fetchedData: DailyReport[] = [];
      if (res.ok) {
        const json = await res.json();
        // 配列が reports や data など別キーで返ってきた場合に対応
        fetchedData = Array.isArray(json) ? json : (json.reports || json.data || []);
      }
      setReports(fillMissingDays(fetchedData, selectedYear, selectedMonth));
    } catch (e) {
      console.error(e);
      setReports(fillMissingDays([], selectedYear, selectedMonth));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedYear, selectedMonth]);

  const handleInputChange = (field: ReportField, value: string) => {
    if (!editingReport) return;
    setEditingReport({
      ...editingReport,
      [field]: Number(value) || 0,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...editingReport,
        volvo_profit_with_bankin: editingReport.volvo_profit_no_bankin + editingReport.volvo_bankin_profit,
        other_profit_with_bankin: editingReport.other_profit_no_bankin + editingReport.other_bankin_profit,
      };

      const url = editingReport.id
        ? `/api/daily-reports/${editingReport.id}`
        : `/api/daily-reports`;
      const method = editingReport.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${editingReport.date} の日報を保存しました。` });
        setEditingReport(null);
        fetchReports();
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setSaving(false);
    }
  };

  const volvoProfitTotal = editingReport ? editingReport.volvo_profit_no_bankin + editingReport.volvo_bankin_profit : 0;
  const otherProfitTotal = editingReport ? editingReport.other_profit_no_bankin + editingReport.other_bankin_profit : 0;

  // 月合計(サマリー表示用)
  const monthTotals = reports.reduce(
    (acc, r) => {
      acc.volvoEntries += r.volvo_shaken_count + r.volvo_tenken_count + r.volvo_general_count + r.volvo_bankin_count;
      acc.otherEntries += r.other_shaken_count + r.other_tenken_count + r.other_general_count + r.other_bankin_count;
      acc.volvoProfit += r.volvo_profit_no_bankin + r.volvo_bankin_profit;
      acc.otherProfit += r.other_profit_no_bankin + r.other_bankin_profit;
      acc.volvoLabor += r.volvo_labor_sales;
      acc.otherLabor += r.other_labor_sales;
      return acc;
    },
    { volvoEntries: 0, otherEntries: 0, volvoProfit: 0, otherProfit: 0, volvoLabor: 0, otherLabor: 0 }
  );

  // 月合計(全項目表示用)
  const fieldTotals = ALL_FIELDS.reduce((acc, f) => {
    acc[f.key] = reports.reduce((sum, r) => sum + (r[f.key] || 0), 0);
    return acc;
  }, {} as Record<ReportField, number>);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">日報データ確認・修正</h1>
          <p className="text-xs text-slate-400 mt-1">既存データは引き継ぎ、未入力の日付もそのまま入力できます。項目はトップページの日報入力画面と同じです。</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'summary' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              サマリー
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'full' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全項目
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-900 text-white text-xs px-2 py-1 rounded border border-slate-700 font-mono"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-900 text-white text-xs px-2 py-1 rounded border border-slate-700 font-mono"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border border-rose-500 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {viewMode === 'summary' ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-950 z-10">日付</th>
                  <th className="p-3 text-center border-l border-slate-800 text-sky-400" colSpan={2}>入庫台数</th>
                  <th className="p-3 text-center border-l border-slate-800 text-emerald-400" colSpan={2}>サービス粗利</th>
                  <th className="p-3 text-center border-l border-slate-800 text-amber-400" colSpan={2}>工賃売上</th>
                  <th className="p-3 text-center sticky right-0 bg-slate-950 z-10">操作</th>
                </tr>
                <tr className="text-[11px] font-normal">
                  <th className="sticky left-0 bg-slate-950"></th>
                  <th className="px-3 pb-2 border-l border-slate-800/50 text-center font-normal">ボルボ</th>
                  <th className="px-3 pb-2 text-center font-normal">国産</th>
                  <th className="px-3 pb-2 border-l border-slate-800/50 text-center font-normal">ボルボ</th>
                  <th className="px-3 pb-2 text-center font-normal">国産</th>
                  <th className="px-3 pb-2 border-l border-slate-800/50 text-center font-normal">ボルボ</th>
                  <th className="px-3 pb-2 text-center font-normal">国産</th>
                  <th className="sticky right-0 bg-slate-950"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">読み込み中...</td>
                  </tr>
                ) : (
                  <>
                    <tr className="bg-slate-950/80 font-bold border-b-2 border-slate-600">
                      <td className="p-3 sticky left-0 z-10 bg-slate-950/80 text-white">月合計</td>
                      <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono">{monthTotals.volvoEntries}台</td>
                      <td className="px-3 py-2 text-right font-mono">{monthTotals.otherEntries}台</td>
                      <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono text-emerald-400">¥{monthTotals.volvoProfit.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-300">¥{monthTotals.otherProfit.toLocaleString()}</td>
                      <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono">¥{monthTotals.volvoLabor.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">¥{monthTotals.otherLabor.toLocaleString()}</td>
                      <td className="sticky right-0 z-10 bg-slate-950/80"></td>
                    </tr>
                    {reports.map((r) => {
                    const isToday = r.date === todayDateStr;
                    const volvoEntries = r.volvo_shaken_count + r.volvo_tenken_count + r.volvo_general_count + r.volvo_bankin_count;
                    const otherEntries = r.other_shaken_count + r.other_tenken_count + r.other_general_count + r.other_bankin_count;
                    const volvoProfit = r.volvo_profit_no_bankin + r.volvo_bankin_profit;
                    const otherProfit = r.other_profit_no_bankin + r.other_bankin_profit;
                    return (
                      <tr
                        key={r.date}
                        className={`transition-colors ${isToday ? 'bg-sky-950/40 hover:bg-sky-950/60' : 'hover:bg-slate-700/30'}`}
                      >
                        <td className={`p-3 font-bold sticky z-10 ${isToday ? 'text-sky-300 bg-sky-950/40' : 'text-white bg-slate-800'}`}>
                          {r.date}{isToday && <span className="ml-2 text-[10px] font-bold text-sky-400 align-middle">今日</span>}
                        </td>
                        <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono">{volvoEntries}台</td>
                        <td className="px-3 py-2 text-right font-mono">{otherEntries}台</td>
                        <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono text-emerald-400 font-semibold">¥{volvoProfit.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-300">¥{otherProfit.toLocaleString()}</td>
                        <td className="px-3 py-2 border-l border-slate-800/30 text-right font-mono">¥{r.volvo_labor_sales.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono">¥{r.other_labor_sales.toLocaleString()}</td>
                        <td className={`p-3 text-center sticky right-0 z-10 ${isToday ? 'bg-sky-950/40' : 'bg-slate-800'}`}>
                          <button
                            onClick={() => setEditingReport(r)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-sans font-semibold transition-colors"
                          >
                            {r.id ? '編集' : '入力'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-700/80 font-mono">
                <tr>
                  <th rowSpan={2} className="p-3 sticky left-0 bg-slate-950 z-10 align-bottom">日付</th>
                  {FIELD_GROUPS.map((g) => (
                    <th key={g.category} colSpan={g.fields.length} className={`p-2 text-center border-l border-slate-800 font-semibold ${g.color}`}>
                      {g.category}
                    </th>
                  ))}
                  <th rowSpan={2} className="p-3 text-center sticky right-0 bg-slate-950 z-10 align-bottom">操作</th>
                </tr>
                <tr>
                  {ALL_FIELDS.map((f) => (
                    <th
                      key={f.key}
                      className={`p-2 text-[10px] ${f.key === 'volvo_new_orders' ? 'text-sky-400 font-bold' : 'font-normal'} ${f.unit ? 'whitespace-nowrap' : 'w-14 whitespace-normal text-center'} ${
                        GROUP_START_KEYS.has(f.key) ? 'border-l-2 border-slate-500' : 'border-l border-slate-800/50'
                      }`}
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={TABLE_COLUMN_COUNT} className="p-8 text-center text-slate-400">読み込み中...</td>
                  </tr>
                ) : (
                  <>
                  <tr className="bg-slate-950/80 font-bold border-b-2 border-slate-600">
                    <td className="p-3 sticky left-0 z-10 bg-slate-950/80 text-white">月合計</td>
                    {ALL_FIELDS.map((f) => (
                      <td
                        key={f.key}
                        className={`p-2 ${f.unit ? '' : 'w-14 text-center'} ${GROUP_START_KEYS.has(f.key) ? 'border-l-2 border-slate-600' : 'border-l border-slate-800/30'}`}
                      >
                        {f.unit === '円' ? `¥${fieldTotals[f.key].toLocaleString()}` : fieldTotals[f.key]}
                      </td>
                    ))}
                    <td className="sticky right-0 z-10 bg-slate-950/80"></td>
                  </tr>
                  {reports.map((r, idx) => {
                    const isToday = r.date === todayDateStr;
                    const rowBg = isToday ? 'bg-sky-950/40' : idx % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/40';
                    const hoverBg = isToday ? 'hover:bg-sky-950/60' : 'hover:bg-slate-700/40';
                    return (
                      <tr key={r.date} className={`transition-colors font-mono border-b border-slate-700/40 ${rowBg} ${hoverBg}`}>
                        <td className={`p-3 font-bold sticky left-0 z-10 ${isToday ? 'text-sky-300' : 'text-white'} ${rowBg}`}>
                          {r.date}
                        </td>
                        {ALL_FIELDS.map((f) => (
                          <td
                            key={f.key}
                            className={`p-2 ${f.unit ? '' : 'w-14 text-center'} ${f.key === 'volvo_new_orders' ? 'text-sky-400 font-bold text-sm' : ''} ${GROUP_START_KEYS.has(f.key) ? 'border-l-2 border-slate-600' : 'border-l border-slate-800/30'}`}
                          >
                            {f.unit === '円' ? `¥${(r[f.key] || 0).toLocaleString()}` : r[f.key]}
                          </td>
                        ))}
                        <td className={`p-3 text-center sticky right-0 z-10 ${rowBg}`}>
                          <button
                            onClick={() => setEditingReport(r)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-sans font-semibold transition-colors"
                          >
                            {r.id ? '編集' : '入力'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 編集・新規入力モーダル */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white">
                日報データ{editingReport.id ? '編集' : '新規登録'} (<span className="text-sky-400 font-mono">{editingReport.date}</span>)
              </h3>
              <button
                onClick={() => setEditingReport(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 font-bold">
                サービス粗利合計: ¥{(volvoProfitTotal + otherProfitTotal).toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {FIELD_GROUPS.map((g, idx) => (
                <div key={g.category} className={`space-y-2 ${idx > 0 ? 'pt-2 border-t border-slate-700/50' : ''}`}>
                  <h4 className={`text-xs font-bold ${g.color}`}>{g.category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {g.fields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-slate-400 mb-1">{f.label}{f.unit ? `(${f.unit})` : ''}</label>
                        <input
                          type="number"
                          value={editingReport[f.key]}
                          onChange={(e) => handleInputChange(f.key, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
