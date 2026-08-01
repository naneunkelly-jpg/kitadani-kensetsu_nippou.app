"use client";

import { useState } from "react";
import { pad2 } from "@/lib/date";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * <input type="date"> の代わりに使う年・月・日プルダウン。
 * モバイルSafariでは、値が空の状態の date input がコンテナ幅を無視して
 * はみ出す不具合があり（time inputで既知だった問題と同種）、CSSでは解決できないため
 * 3つの<select>を組み合わせて同じ役割を持たせている。
 * hidden inputに "YYYY-MM-DD" 形式の値を入れるので、通常のフォーム送信に
 * そのまま乗せられる（name属性はhidden inputのものが使われる）。
 */
export function DateSelect({
  name,
  defaultValue,
  yearsBefore = 3,
  yearsAfter = 3,
}: {
  name: string;
  defaultValue?: string;
  yearsBefore?: number;
  yearsAfter?: number;
}) {
  const initial = defaultValue ? defaultValue.split("-").map(Number) : [];
  const [year, setYear] = useState<number | "">(initial[0] ?? "");
  const [month, setMonth] = useState<number | "">(initial[1] ?? "");
  const [day, setDay] = useState<number | "">(initial[2] ?? "");

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: yearsBefore + yearsAfter + 1 },
    (_, i) => currentYear - yearsBefore + i
  );

  const maxDay = year !== "" && month !== "" ? daysInMonth(Number(year), Number(month)) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const value =
    year !== "" && month !== "" && day !== ""
      ? `${year}-${pad2(Number(month))}-${pad2(Number(day))}`
      : "";

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      <select
        value={year}
        onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
        className="min-w-0 flex-1 rounded-lg border border-border px-1 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="">年</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => {
          const v = e.target.value === "" ? "" : Number(e.target.value);
          setMonth(v);
          if (v !== "" && year !== "" && day !== "" && Number(day) > daysInMonth(Number(year), v)) {
            setDay(daysInMonth(Number(year), v));
          }
        }}
        className="min-w-0 flex-1 rounded-lg border border-border px-1 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="">月</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={day}
        onChange={(e) => setDay(e.target.value === "" ? "" : Number(e.target.value))}
        className="min-w-0 flex-1 rounded-lg border border-border px-1 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="">日</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
