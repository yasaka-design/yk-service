import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

function getQuarterDateRange(quarter: string, year: number) {
  switch (quarter) {
    case 'Q1': return { months: [1, 2, 3], startDate: `${year}-01-01`, endDate: `${year}-03-31` };
    case 'Q2': return { months: [4, 5, 6], startDate: `${year}-04-01`, endDate: `${year}-06-30` };
    case 'Q3': return { months: [7, 8, 9], startDate: `${year}-07-01`, endDate: `${year}-09-30` };
    case 'Q4': return { months: [10, 11, 12], startDate: `${year}-10-01`, endDate: `${year}-12-31` };
    default: return { months: [7, 8, 9], startDate: `${year}-07-01`, endDate: `${year}-09-30` };
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const quarter = searchParams.get('quarter') || 'Q3';
  const year = Number(searchParams.get('year')) || 2026;
  const selectedMonth = searchParams.get('month');

  const { months, startDate, endDate } = getQuarterDateRange(quarter, year);

  try {
    // 1. 実績データ取得
    const { data: reportsData } = await supabase
      .from('daily_reports')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // 閲覧リンク経由のセッションは、リンク発行日までのデータしか見せない
    const reports = (reportsData || []).filter((r: any) =>
      session.role === 'viewer' ? r.date <= session.asOf : true
    );

    // 実データが入っている最終日(=最終更新日として表示する)
    const lastReportDate = reports.reduce((latest: string | null, r: any) => {
      if (!r.date) return latest;
      return !latest || r.date > latest ? r.date : latest;
    }, null);

    // 2. 目標データ取得
    const { data: targetsData } = await supabase
      .from('monthly_targets')
      .select('*');

    const targets = targetsData || [];

    // 3. 月ごとの集計
    const monthlyAggregated = months.map((monthNum) => {
      const monthName = `${monthNum}月`;
      const formattedMonth = String(monthNum).padStart(2, '0');
      const targetMonthKey = `${year}-${formattedMonth}`;

      const monthReports = reports.filter((r: any) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d.getMonth() + 1 === monthNum;
      });

      const t = targets.find((item: any) => item.target_month === targetMonthKey) || {};

      const actuals = monthReports.reduce(
        (acc: any, r: any) => {
          acc.sales.volvoNew += Number(r.volvo_new_orders || 0);
          acc.sales.volvoUsed += Number(r.volvo_used_orders || 0);
          acc.sales.japanNew += Number(r.japan_new_orders || 0);
          acc.sales.japanUsed += Number(r.japan_used_orders || 0);

          acc.service.volvo.shaken += Number(r.volvo_shaken_count || 0);
          acc.service.volvo.tenken += Number(r.volvo_tenken_count || 0);
          acc.service.volvo.ippan += Number(r.volvo_general_count || 0);

          acc.service.japan.shaken += Number(r.other_shaken_count || 0);
          acc.service.japan.tenken += Number(r.other_tenken_count || 0);
          acc.service.japan.ippan += Number(r.other_general_count || 0);

          acc.service.kouchin.volvo += Number(r.volvo_labor_sales || 0);
          acc.service.kouchin.japan += Number(r.other_labor_sales || 0);
          acc.service.arari.volvo += Number(r.volvo_profit_with_bankin || 0);
          acc.service.arari.japan += Number(r.other_profit_with_bankin || 0);

          return acc;
        },
        {
          sales: { volvoNew: 0, volvoUsed: 0, japanNew: 0, japanUsed: 0 },
          service: {
            volvo: { shaken: 0, tenken: 0, ippan: 0 },
            japan: { shaken: 0, tenken: 0, ippan: 0 },
            kouchin: { volvo: 0, japan: 0 },
            arari: { volvo: 0, japan: 0 },
          },
        }
      );

      return {
        monthNum,
        monthName,
        sales: {
          volvoNew: { actual: actuals.sales.volvoNew, target: Number(t.volvo_new_orders || 0) },
          volvoUsed: { actual: actuals.sales.volvoUsed, target: Number(t.volvo_used_orders || 0) },
          japanNew: { actual: actuals.sales.japanNew, target: Number(t.japan_new_orders || 0) },
          japanUsed: { actual: actuals.sales.japanUsed, target: Number(t.japan_used_orders || 0) },
        },
        service: {
          volvo: {
            shaken: { actual: actuals.service.volvo.shaken, target: Number(t.volvo_shaken_count || 0) },
            tenken: { actual: actuals.service.volvo.tenken, target: Number(t.volvo_tenken_count || 0) },
            ippan: { actual: actuals.service.volvo.ippan, target: Number(t.volvo_general_count || 0) },
          },
          japan: {
            shaken: { actual: actuals.service.japan.shaken, target: Number(t.other_shaken_count || 0) },
            tenken: { actual: actuals.service.japan.tenken, target: Number(t.other_tenken_count || 0) },
            ippan: { actual: actuals.service.japan.ippan, target: Number(t.other_general_count || 0) },
          },
          kouchin: {
            volvo: {
              actual: actuals.service.kouchin.volvo,
              target: Number(t.volvo_profit || 0) + Number(t.volvo_tenken_profit || 0) + Number(t.volvo_general_profit || 0),
            },
            japan: {
              actual: actuals.service.kouchin.japan,
              target: Number(t.other_profit || 0) + Number(t.other_tenken_profit || 0) + Number(t.other_general_profit || 0),
            },
          },
          arari: {
            volvo: { actual: actuals.service.arari.volvo, target: Number(t.volvo_labor_sales || 0) },
            japan: { actual: actuals.service.arari.japan, target: Number(t.other_labor_sales || 0) },
          },
        },
        parts: {
          actual: monthReports.reduce((sum: number, r: any) => sum + Number(r.parts_purchase || 0), 0),
          target: Number(t.volvo_parts_sales || 0) + Number(t.other_parts_sales || 0)
        },
        insurance: {
          actual: monthReports.reduce((sum: number, r: any) => sum + Number(r.insurance_count || 0), 0),
          target: Number(t.insurance_count || 0)
        }
      };
    });

    // 表示対象月（単月指定かQ全体か）の判定
    let activeMonths = months;
    if (selectedMonth && !isNaN(Number(selectedMonth))) {
      activeMonths = [Number(selectedMonth)];
    }

    const filteredReports = reports.filter((r: any) => {
      if (!r.date) return false;
      const m = new Date(r.date).getMonth() + 1;
      return activeMonths.includes(m);
    });

    const activeMonthKeys = activeMonths.map(m => `${year}-${String(m).padStart(2, '0')}`);
    const filteredTargets = targets.filter((t: any) => activeMonthKeys.includes(t.target_month));

    const totalPartsActual = filteredReports.reduce((sum: number, r: any) => sum + Number(r.parts_purchase || 0), 0);
    const totalPartsTarget = filteredTargets.reduce((sum: number, t: any) => sum + Number(t.volvo_parts_sales || 0) + Number(t.other_parts_sales || 0), 0);

    const totalInsuranceActual = filteredReports.reduce((sum: number, r: any) => sum + Number(r.insurance_count || 0), 0);
    const totalInsuranceTarget = filteredTargets.reduce((sum: number, t: any) => sum + Number(t.insurance_count || 0), 0);

    return NextResponse.json({
      months: monthlyAggregated,
      other: {
        parts: { actual: totalPartsActual, target: totalPartsTarget },
        insurance: { actual: totalInsuranceActual, target: totalInsuranceTarget },
      },
      lastReportDate,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
  }
}