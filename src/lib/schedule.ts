import { dayOfWeekUTC } from "@/lib/date";

export type ScheduleStatus = "scheduled_work" | "day_off" | "day_off_am" | "day_off_pm";

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
  day_off_am: "午前休",
  day_off_pm: "午後休",
};

// 半休はその半分は働くため、日報提出などの「出勤扱い」判定ではtrueになる。
export function isWorkingStatus(status: ScheduleStatus): boolean {
  return status === "scheduled_work" || status === "day_off_am" || status === "day_off_pm";
}
