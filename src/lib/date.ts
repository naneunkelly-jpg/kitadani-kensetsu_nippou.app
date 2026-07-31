// 日本時間(Asia/Tokyo)基準での日付ユーティリティ。
// サーバーの実行環境がUTC等でも、常に日本時間で「今日」を判定するために使う。

export function getTodayJstString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

export function getTodayJstYearMonth(): { year: number; month: number } {
  const [y, m] = getTodayJstString().split("-").map(Number);
  return { year: y, month: m };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// 月初・月末（YYYY-MM-DD）を返す
export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { start, end };
}

// 0=日曜日〜6=土曜日
export function dayOfWeekUTC(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}
