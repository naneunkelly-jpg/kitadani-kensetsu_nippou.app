"use client";

import { useState } from "react";
import { SCHEDULE_STATUS_LABELS, type ScheduleStatus } from "@/lib/schedule";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export type CalendarDay = {
  date: string;
  dayNum: number;
  holidayName: string | null;
  holidayNote: string | null;
  leaves: { name: string; status: ScheduleStatus; reason: string | null }[];
};

export function HolidayCalendarGrid({
  days,
  todayStr,
}: {
  days: (CalendarDay | null)[];
  todayStr: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected = days.find((d) => d?.date === selectedDate) ?? null;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDate;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : day.date)}
              className={`min-h-16 rounded-lg border p-1 text-left text-xs ${
                day.holidayName ? "border-accent/30 bg-accent/10" : "border-border"
              } ${isToday ? "ring-2 ring-accent" : ""} ${isSelected ? "bg-accent/20" : ""}`}
            >
              <p className="text-muted">{day.dayNum}</p>
              {day.holidayName && (
                <p className="mt-1 truncate font-medium text-foreground">{day.holidayName}</p>
              )}
              {day.leaves.map((leave, idx) => (
                <p key={idx} className="mt-1 truncate font-medium text-blue-700">
                  {leave.name} {SCHEDULE_STATUS_LABELS[leave.status]}
                </p>
              ))}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="font-bold text-foreground">{selected.date}</p>

          {selected.holidayName && (
            <div className="mt-2">
              <p className="text-sm font-medium text-foreground">
                会社公休日：{selected.holidayName}
              </p>
              {selected.holidayNote && (
                <p className="text-xs text-muted">{selected.holidayNote}</p>
              )}
            </div>
          )}

          {selected.leaves.length > 0 && (
            <div className="mt-2 space-y-2">
              {selected.leaves.map((leave, idx) => (
                <div key={idx} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {leave.name}　{SCHEDULE_STATUS_LABELS[leave.status]}
                  </p>
                  <p className="mt-1 text-xs text-muted">理由：{leave.reason || "（未登録）"}</p>
                </div>
              ))}
            </div>
          )}

          {!selected.holidayName && selected.leaves.length === 0 && (
            <p className="mt-2 text-sm text-muted">この日の登録はありません。</p>
          )}
        </div>
      )}
    </div>
  );
}
