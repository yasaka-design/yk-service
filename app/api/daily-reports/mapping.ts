// daily_reports テーブルの実データ項目一覧(日報入力画面 app/page.tsx の reportData と同一)

export const NUMERIC_FIELDS = [
  'sr_visitors',
  'sr_new_visitors',
  'negotiations',
  'test_drives',
  'estimates',
  'volvo_new_orders',
  'volvo_new_registrations',
  'volvo_new_demo_cars',
  'volvo_used_orders',
  'volvo_used_registrations',
  'volvo_used_demo_cars',
  'japan_new_orders',
  'japan_new_registrations',
  'japan_new_demo_cars',
  'japan_used_orders',
  'japan_used_registrations',
  'japan_used_demo_cars',
  'volvo_shaken_count',
  'volvo_tenken_count',
  'volvo_general_count',
  'volvo_bankin_count',
  'other_shaken_count',
  'other_tenken_count',
  'other_general_count',
  'other_bankin_count',
  'volvo_profit_no_bankin',
  'volvo_bankin_profit',
  'volvo_labor_sales',
  'volvo_profit_with_bankin',
  'other_profit_no_bankin',
  'other_bankin_profit',
  'other_labor_sales',
  'other_profit_with_bankin',
  'parts_purchase',
  'insurance_count',
  'loan_lease_count',
  'trade_in_count',
] as const;

export type NumericField = (typeof NUMERIC_FIELDS)[number];

// リクエストボディから既知の数値項目だけを取り出す(未知のキーはDBに渡さない)
export function sanitizeReport(body: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of NUMERIC_FIELDS) {
    if (body[key] !== undefined) {
      out[key] = Number(body[key]) || 0;
    }
  }
  return out;
}

// DBの行を欠損項目0埋めでフロントに返す(古いデータで未設定の列があっても崩れないように)
export function normalizeRow(row: any) {
  const out: Record<string, unknown> = { id: row.id, date: row.date };
  for (const key of NUMERIC_FIELDS) {
    out[key] = Number(row[key] || 0);
  }
  return out;
}
