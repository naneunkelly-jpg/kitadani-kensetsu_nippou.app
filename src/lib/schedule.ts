import { dayOfWeekUTC } from "@/lib/date";

export type ScheduleStatus = "scheduled_work" | "day_off";

/**
 * 例外（employee_schedulesの登録）が無い場合のデフォルト勤務状態を計算する。
 * 月〜土＝出勤予定、日＝休み。
 */
export function defaultScheduleStatus(dateStr: string): ScheduleStatus {
  const weekday = dayOfWeekUTC(dateStr); // 0=日, 6=土
  return weekday === 0 ? "day_off" : "scheduled_work";
}

/**
 * 例外があればそれを優先し、無ければデフォルトを返す。
 */
export function effectiveScheduleStatus(
  dateStr: string,
  overrideStatus: ScheduleStatus | null | undefined
): ScheduleStatus {
  return overrideStatus ?? defaultScheduleStatus(dateStr);
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled_work: "出勤予定",
  day_off: "休み",
};
