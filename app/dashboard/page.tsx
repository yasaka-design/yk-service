'use client';

import React, { useState, useEffect } from 'react';

// SVGメーター（修正：色閾値・描画計算・金額強調）
function GaugeMeter({ percent, actual, target, unit = '台', isCurrency = false, isLarge = false }: {
  percent: number;
  actual: number;
  target: number;
  unit?: string;
  isCurrency?: boolean;
  isLarge?: boolean;
}) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  // SVG半円の長さは r=45 のとき Math.PI * 45 ≒ 141.37
  const strokeDasharray = 141.37;
  // 進捗率に正確に連動するオフセット計算
  const strokeDashoffset = strokeDasharray - (strokeDasharray * clampedPercent) / 100;

  // ご指定の色条件: ~50%未満:赤 / 50%~80%未満:黄 / 80%以上:緑
  let strokeColor = '#ef4444'; // 赤 (< 50%)
  if (clampedPercent >= 50 && clampedPercent < 80) strokeColor = '#f59e0b'; // 黄 (50% <= val < 80%)
  if (clampedPercent >= 80) strokeColor = '#10b981'; // 緑 (>= 80%)

  const formatVal = (val: number) =>
    isCurrency ? `¥${val.toLocaleString()}` : `${val.toLocaleString()}${unit}`;

  // 25%, 50%, 75% の目盛り線
  const ticks = [25, 50, 75];

  return (
    <div className={`flex flex-col items-center justify-center relative my-1 ${isLarge ? 'h-32' : 'h-24'}`}>
      <svg className={isLarge ? "w-52 h-32" : "w-40 h-24"} viewBox="0 0 120 65">
        {/* メーター背景軌道 */}
        <path d="M 15 55 A 45 45 0 0 1 105 55" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
        
        {/* 実績ゲージ */}
        <path
          d="M 15 55 A 45 45 0 0 1 105 55"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease' }}
        />

        {/* 25%, 50%, 75% の目盛り線 */}
        {ticks.map((tick) => {
          const angle = (180 - (tick / 100) * 180) * (Math.PI / 180);
          const x1 = 60 + 40 * Math.cos(angle);
          const y1 = 55 - 40 * Math.sin(angle);
          const x2 = 60 + 47 * Math.cos(angle);
          const y2 = 55 - 47 * Math.sin(angle);
          return (
            <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          );
        })}
      </svg>

      {/* 25%, 50%, 75% の数値ラベル */}
      <span className="absolute top-1 left-7 text-[8px] text-slate-400 font-mono">25%</span>
      <span className="absolute top-0 text-[8px] text-slate-400 font-mono">50%</span>
      <span className="absolute top-1 right-7 text-[8px] text-slate-400 font-mono">75%</span>

      {/* 中央の進捗率 & 累計実績（金額の場合は白太文字でくっきり表示） */}
      <div className={`absolute text-center ${isLarge ? 'top-6' : 'top-4'}`}>
        <span className={`${isLarge ? 'text-2xl' : 'text-lg'} font-extrabold text-white block`}>
          {percent.toFixed(1)}<span className="text-xs">%</span>
        </span>
        
        {/* 累計実績（白太文字指定） */}
        <p className={`font-bold text-white tracking-wide font-mono ${isLarge ? 'text-sm mt-1' : 'text-xs mt-0.5'}`}>
          {formatVal(actual)}
        </p>
        <p className="text-[9px] text-slate-400 font-mono">
          目標: {formatVal(target)}
        </p>
      </div>
    </div>
  );
}

// 下部指標（折り返し防止・1行レイアウト調整）
function SubMetrics({ target, actual, elapsedDays, isCurrency, unit }: {
  target: number;
  actual: number;
  elapsedDays: number;
  isCurrency: boolean;
  unit: string;
}) {
  const remaining = Math.max(target - actual, 0);
  const dailyAverage = elapsedDays > 0 ? actual / elapsedDays : 0;
  const daysToReach = dailyAverage > 0 ? Math.ceil(remaining / dailyAverage) : 0;

  const formatSubVal = (num: number) => {
    if (isCurrency) {
      if (num >= 10000) return `${Math.round(num / 10000)}万`;
      return `¥${Math.round(num).toLocaleString()}`;
    }
    return `${Math.round(num)}${unit}`;
  };

  return (
    <div className="grid grid-cols-3 text-center border-t border-slate-700/50 pt-1.5 mt-auto text-[10px] gap-0.5">
      <div className="min-w-0">
        <p className="text-slate-400 truncate">残り</p>
        <p className="font-bold text-slate-100 whitespace-nowrap truncate">{formatSubVal(remaining)}</p>
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 truncate">日平均</p>
        <p className="font-bold text-slate-100 whitespace-nowrap truncate">{formatSubVal(dailyAverage)}</p>
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 truncate">到達目安</p>
        <p className="font-bold text-slate-100 whitespace-nowrap truncate">{daysToReach > 0 ? `${daysToReach}日` : '-'}</p>
      </div>
    </div>
  );
}

// ① メーター付きカード（ボルボ新車は青枠 `border-sky-500`）
function GaugeCard({ title, target, actual, unit = '台', isCurrency = false, elapsedDays = 1, isLarge = false }: any) {
  const percent = target > 0 ? (actual / target) * 100 : 0;

  return (
    <div className={`bg-slate-800/90 border rounded-xl p-3 flex flex-col justify-between h-full ${
      isLarge 
        ? 'md:col-span-2 border-sky-500/80 bg-gradient-to-r from-slate-800 via-slate-800 to-sky-950/30 shadow-lg shadow-sky-900/20' 
        : 'border-slate-700/60'
    }`}>
      <div className="flex justify-between items-center">
        <h4 className={`font-bold ${isLarge ? 'text-base text-sky-400' : 'text-xs text-slate-200'}`}>{title}</h4>
        <span className="text-[10px] text-slate-400 font-mono">
          目標 {isCurrency ? `¥${target.toLocaleString()}` : `${target}${unit}`}
        </span>
      </div>

      <GaugeMeter percent={percent} actual={actual} target={target} unit={unit} isCurrency={isCurrency} isLarge={isLarge} />
      <SubMetrics target={target} actual={actual} elapsedDays={elapsedDays} isCurrency={isCurrency} unit={unit} />
    </div>
  );
}

// ② メーターなしカード
function CompactSimpleCard({ title, target, actual, unit = '台', isCurrency = false, elapsedDays = 1 }: any) {
  const percent = target > 0 ? (actual / target) * 100 : 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-300">{title}</h4>
        <span className="text-[10px] text-slate-400 font-mono">
          目標 {isCurrency ? `¥${target.toLocaleString()}` : `${target}${unit}`}
        </span>
      </div>

      <div className="my-auto py-2 text-center">
        <p className="text-xl font-bold text-white font-mono">
          {isCurrency ? `¥${actual.toLocaleString()}` : `${actual.toLocaleString()} ${unit}`}
        </p>
        <p className="text-xs font-semibold text-amber-400 font-mono mt-0.5">
          進捗率: {percent.toFixed(1)}%
        </p>
      </div>

      <SubMetrics target={target} actual={actual} elapsedDays={elapsedDays} isCurrency={isCurrency} unit={unit} />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 当月の自動判定 & 初期値設定
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1〜12
  
  const getQuarterByMonth = (m: number) => {
    if (m >= 1 && m <= 3) return 'Q1';
    if (m >= 4 && m <= 6) return 'Q2';
    if (m >= 7 && m <= 9) return 'Q3';
    return 'Q4';
  };

  const [selectedQuarter, setSelectedQuarter] = useState<string>(getQuarterByMonth(currentMonthNum));
  const [viewMode, setViewMode] = useState<string>(String(currentMonthNum));
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const elapsedDays = Math.max(today.getDate(), 1);

  const getQuarterMonths = (q: string) => {
    switch (q) {
      case 'Q1': return [1, 2, 3];
      case 'Q2': return [4, 5, 6];
      case 'Q3': return [7, 8, 9];
      case 'Q4': return [10, 11, 12];
      default: return [7, 8, 9];
    }
  };

  const quarterMonths = getQuarterMonths(selectedQuarter);

  const handleQuarterChange = (q: string) => {
    setSelectedQuarter(q);
    setViewMode('all');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = viewMode === 'all'
        ? `/api/dashboard?quarter=${selectedQuarter}`
        : `/api/dashboard?quarter=${selectedQuarter}&month=${viewMode}`;

      const res = await fetch(url);
      const json = await res.json();
      setData(json);

      if (json.lastReportDate) {
        const [y, m, d] = json.lastReportDate.split('-').map(Number);
        setLastUpdated(`${y}年${m}月${d}日`);
      } else {
        setLastUpdated('データなし');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedQuarter, viewMode]);

  if (loading || !data) {
    return <div className="p-8 text-white bg-slate-900 min-h-screen">読み込み中...</div>;
  }

  let sales = { volvoNew: { actual: 0, target: 0 }, volvoUsed: { actual: 0, target: 0 }, japanNew: { actual: 0, target: 0 }, japanUsed: { actual: 0, target: 0 } };
  let service = {
    volvo: { shaken: { actual: 0, target: 0 }, tenken: { actual: 0, target: 0 }, ippan: { actual: 0, target: 0 } },
    japan: { shaken: { actual: 0, target: 0 }, tenken: { actual: 0, target: 0 }, ippan: { actual: 0, target: 0 } },
    kouchin: { volvo: { actual: 0, target: 0 }, japan: { actual: 0, target: 0 } },
    arari: { volvo: { actual: 0, target: 0 }, japan: { actual: 0, target: 0 } },
  };

  if (viewMode === 'all') {
    data.months?.forEach((m: any) => {
      sales.volvoNew.actual += m.sales?.volvoNew?.actual || 0;
      sales.volvoNew.target += m.sales?.volvoNew?.target || 0;
      sales.volvoUsed.actual += m.sales?.volvoUsed?.actual || 0;
      sales.volvoUsed.target += m.sales?.volvoUsed?.target || 0;
      sales.japanNew.actual += m.sales?.japanNew?.actual || 0;
      sales.japanNew.target += m.sales?.japanNew?.target || 0;
      sales.japanUsed.actual += m.sales?.japanUsed?.actual || 0;
      sales.japanUsed.target += m.sales?.japanUsed?.target || 0;

      service.volvo.shaken.actual += m.service?.volvo?.shaken?.actual || 0;
      service.volvo.shaken.target += m.service?.volvo?.shaken?.target || 0;
      service.volvo.tenken.actual += m.service?.volvo?.tenken?.actual || 0;
      service.volvo.tenken.target += m.service?.volvo?.tenken?.target || 0;
      service.volvo.ippan.actual += m.service?.volvo?.ippan?.actual || 0;
      service.volvo.ippan.target += m.service?.volvo?.ippan?.target || 0;

      service.japan.shaken.actual += m.service?.japan?.shaken?.actual || 0;
      service.japan.shaken.target += m.service?.japan?.shaken?.target || 0;
      service.japan.tenken.actual += m.service?.japan?.tenken?.actual || 0;
      service.japan.tenken.target += m.service?.japan?.tenken?.target || 0;
      service.japan.ippan.actual += m.service?.japan?.ippan?.actual || 0;
      service.japan.ippan.target += m.service?.japan?.ippan?.target || 0;

      service.kouchin.volvo.actual += m.service?.kouchin?.volvo?.actual || 0;
      service.kouchin.volvo.target += m.service?.kouchin?.volvo?.target || 0;
      service.kouchin.japan.actual += m.service?.kouchin?.japan?.actual || 0;
      service.kouchin.japan.target += m.service?.kouchin?.japan?.target || 0;

      service.arari.volvo.actual += m.service?.arari?.volvo?.actual || 0;
      service.arari.volvo.target += m.service?.arari?.volvo?.target || 0;
      service.arari.japan.actual += m.service?.arari?.japan?.actual || 0;
      service.arari.japan.target += m.service?.arari?.japan?.target || 0;
    });
  } else {
    const mNum = Number(viewMode);
    const mData = data.months?.find((m: any) => m.monthNum === mNum) || data.months?.[0] || {};
    sales = mData.sales || sales;
    service = mData.service || service;
  }

  // 分析メモ
  const items = [
    { name: 'ボルボ新車', actual: sales.volvoNew.actual, target: sales.volvoNew.target },
    { name: 'ボルボ車検', actual: service.volvo.shaken.actual, target: service.volvo.shaken.target },
    { name: 'ボルボ点検', actual: service.volvo.tenken.actual, target: service.volvo.tenken.target },
    { name: 'ボルボ一般整備', actual: service.volvo.ippan.actual, target: service.volvo.ippan.target },
  ];

  const sortedItems = [...items].sort((a, b) => {
    const pA = a.target > 0 ? a.actual / a.target : 0;
    const pB = b.target > 0 ? b.actual / b.target : 0;
    return pA - pB;
  });

  const lowest = sortedItems[0];
  const highest = sortedItems[sortedItems.length - 1];

  const lowestPercent = lowest.target > 0 ? ((lowest.actual / lowest.target) * 100).toFixed(1) : '0';
  const lowestRemaining = Math.max(lowest.target - lowest.actual, 0);
  const lowestDaily = elapsedDays > 0 ? lowest.actual / elapsedDays : 0;
  const lowestEstDays = lowestDaily > 0 ? Math.ceil(lowestRemaining / lowestDaily) : 0;

  const highestPercent = highest.target > 0 ? ((highest.actual / highest.target) * 100).toFixed(1) : '0';

  const volvoKouchinActual = service.kouchin.volvo.actual;
  const volvoArariActual = service.arari.volvo.actual;
  const profitRate = volvoKouchinActual > 0 ? ((volvoArariActual / volvoKouchinActual) * 100).toFixed(1) : '0';

  const totalShakenCount = service.volvo.shaken.actual + service.japan.shaken.actual;
  const totalTenkenCount = service.volvo.tenken.actual + service.japan.tenken.actual;
  const totalIppanCount = service.volvo.ippan.actual + service.japan.ippan.actual;
  const totalActualService = totalShakenCount + totalTenkenCount + totalIppanCount;

  const totalTargetService =
    service.volvo.shaken.target +
    service.japan.shaken.target +
    service.volvo.tenken.target +
    service.japan.tenken.target +
    service.volvo.ippan.target +
    service.japan.ippan.target;

  const totalServicePercent = totalTargetService > 0 ? ((totalActualService / totalTargetService) * 100).toFixed(1) : '0';

  // 経過日数ペースに対して遅れていないか(入庫台数合計の色分け判定用)
  const daysInPeriod = viewMode === 'all'
    ? quarterMonths.reduce((sum, m) => sum + new Date(today.getFullYear(), m, 0).getDate(), 0)
    : new Date(today.getFullYear(), Number(viewMode), 0).getDate();
  const pacePercent = daysInPeriod > 0 ? (elapsedDays / daysInPeriod) * 100 : 0;
  const isTotalServiceOnPace = Number(totalServicePercent) >= pacePercent;
  const isProfitRateHealthy = Number(profitRate) >= 100;

  // 着地予測(現在のペースがこのまま続いた場合の月末/期末見込み)
  const forecastValue = (actual: number) => (elapsedDays > 0 ? (actual / elapsedDays) * daysInPeriod : actual);

  const forecastPercent = (forecast: number, target: number) => (target > 0 ? ((forecast / target) * 100).toFixed(1) : '0');

  const volvoNewForecast = forecastValue(sales.volvoNew.actual);
  const isVolvoNewForecastOnTrack = volvoNewForecast >= sales.volvoNew.target;
  const volvoNewForecastPercent = forecastPercent(volvoNewForecast, sales.volvoNew.target);

  const volvoArariForecast = forecastValue(service.arari.volvo.actual);
  const isVolvoArariForecastOnTrack = volvoArariForecast >= service.arari.volvo.target;
  const volvoArariForecastPercent = forecastPercent(volvoArariForecast, service.arari.volvo.target);

  const japanArariForecast = forecastValue(service.arari.japan.actual);
  const isJapanArariForecastOnTrack = japanArariForecast >= service.arari.japan.target;
  const japanArariForecastPercent = forecastPercent(japanArariForecast, service.arari.japan.target);

  const viewTitle = viewMode === 'all' ? `${selectedQuarter} (3ヶ月合計)` : `${viewMode}月 (単月)`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-8">
      {/* ヘッダー & Q/月選択 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800 pb-4 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-bold text-white">ダッシュボード</h1>

          {/* Q切り替え */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
              <button
                key={q}
                onClick={() => handleQuarterChange(q)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedQuarter === q ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* 期間切り替え */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3ヶ月合計
            </button>
            {quarterMonths.map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(String(m))}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  viewMode === String(m) ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}月 {m === currentMonthNum ? '(当月)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
          最終更新: <span className="text-slate-200 font-mono">{lastUpdated}</span>
        </div>
      </div>

      {/* ① 営業実績 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200">① 営業実績 ({viewTitle})</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-fr">
          {/* ボルボ新車（青枠 border-sky-500 強調表示） */}
          <GaugeCard title="ボルボ新車" target={sales.volvoNew.target} actual={sales.volvoNew.actual} elapsedDays={elapsedDays} isLarge={true} />
          
          <CompactSimpleCard title="ボルボ中古車" target={sales.volvoUsed.target} actual={sales.volvoUsed.actual} elapsedDays={elapsedDays} />
          <CompactSimpleCard title="国産新車" target={sales.japanNew.target} actual={sales.japanNew.actual} elapsedDays={elapsedDays} />
          <CompactSimpleCard title="国産中古車" target={sales.japanUsed.target} actual={sales.japanUsed.actual} elapsedDays={elapsedDays} />
        </div>
      </section>

      {/* ② サービス実績 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200">② サービス実績 ({viewTitle})</h2>
        
        {/* VOLVO整備 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">VOLVO 整備</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-fr">
            <GaugeCard title="車検" target={service.volvo.shaken.target} actual={service.volvo.shaken.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="点検" target={service.volvo.tenken.target} actual={service.volvo.tenken.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="一般" target={service.volvo.ippan.target} actual={service.volvo.ippan.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="工賃売上" target={service.kouchin.volvo.target} actual={service.kouchin.volvo.actual} isCurrency={true} elapsedDays={elapsedDays} />
            <GaugeCard title="粗利" target={service.arari.volvo.target} actual={service.arari.volvo.actual} isCurrency={true} elapsedDays={elapsedDays} />
          </div>
        </div>

        {/* 国産車整備 */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-slate-400">国産車 整備</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-fr">
            <GaugeCard title="車検" target={service.japan.shaken.target} actual={service.japan.shaken.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="点検" target={service.japan.tenken.target} actual={service.japan.tenken.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="一般" target={service.japan.ippan.target} actual={service.japan.ippan.actual} elapsedDays={elapsedDays} />
            <CompactSimpleCard title="工賃売上" target={service.kouchin.japan.target} actual={service.kouchin.japan.actual} isCurrency={true} elapsedDays={elapsedDays} />
            <GaugeCard title="粗利" target={service.arari.japan.target} actual={service.arari.japan.actual} isCurrency={true} elapsedDays={elapsedDays} />
          </div>
        </div>
      </section>

      {/* ③ パーツ ＆ 保険 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200">③ パーツ ＆ 保険 ({viewTitle})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          <GaugeCard title="パーツ売上" target={data.other?.parts?.target || 0} actual={data.other?.parts?.actual || 0} isCurrency={true} elapsedDays={elapsedDays} />
          <GaugeCard title="保険獲得" target={data.other?.insurance?.target || 0} actual={data.other?.insurance?.actual || 0} unit="件" elapsedDays={elapsedDays} />
        </div>
      </section>

      {/* 分析メモ */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-3">
        <h3 className="text-base font-bold text-amber-400">分析メモ</h3>
        <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-rose-400">•</span>
            <span>
              最も遅れているのは <strong className="text-rose-400">{lowest.name}</strong>（進捗率 {lowestPercent}%）。残り {lowestRemaining}台を、現在の日平均ペース（{Math.round(lowestDaily)}台/日）で追うと目標到達まで約 <strong className="text-rose-400">{lowestEstDays}日</strong> かかる見込みです。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400">•</span>
            <span>
              最も進捗が良いのは <strong className="text-sky-400">{highest.name}</strong>（進捗率 {highestPercent}%）です。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={isProfitRateHealthy ? 'text-sky-400' : 'text-rose-400'}>•</span>
            <span>
              ボルボ整備の工賃売上に対する粗利率は現在 <strong className={isProfitRateHealthy ? 'text-sky-400' : 'text-rose-400'}>{profitRate}%</strong> です。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={isTotalServiceOnPace ? 'text-sky-400' : 'text-rose-400'}>•</span>
            <span>
              入庫台数（車検+点検+一般）の合計進捗は <strong className={isTotalServiceOnPace ? 'text-sky-400' : 'text-rose-400'}>{totalActualService}台 / {totalTargetService}台 ({totalServicePercent}%)</strong> です。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={isVolvoNewForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>•</span>
            <span>
              現在のペースが続いた場合、<strong className="text-slate-100">ボルボ新車</strong>の着地予測は <strong className={isVolvoNewForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>{volvoNewForecast.toFixed(1)}台（達成率 {volvoNewForecastPercent}%）</strong>（目標 {sales.volvoNew.target}台）です。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={isVolvoArariForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>•</span>
            <span>
              <strong className="text-slate-100">ボルボ粗利</strong>の着地予測は <strong className={isVolvoArariForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>¥{Math.round(volvoArariForecast).toLocaleString()}（達成率 {volvoArariForecastPercent}%）</strong>（目標 ¥{service.arari.volvo.target.toLocaleString()}）です。
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={isJapanArariForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>•</span>
            <span>
              <strong className="text-slate-100">国産粗利</strong>の着地予測は <strong className={isJapanArariForecastOnTrack ? 'text-sky-400' : 'text-rose-400'}>¥{Math.round(japanArariForecast).toLocaleString()}（達成率 {japanArariForecastPercent}%）</strong>（目標 ¥{service.arari.japan.target.toLocaleString()}）です。
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}