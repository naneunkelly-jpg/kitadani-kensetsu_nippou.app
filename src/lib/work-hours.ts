/**
 * 開始時刻・終了時刻（"HH:MM"）と休憩時間（分）から実働時間（時間、小数）を計算する。
 * 終了時刻が開始時刻以前の場合は null を返す（同日内のみ対応、翌日またぎ非対応）。
 */
export function calcWorkHours(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number | null {
  if (!startTime || !endTime) return null;

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const rawMinutes = endMinutes - startMinutes - (breakMinutes || 0);

  if (rawMinutes <= 0) return null;

  return Math.round((rawMinutes / 60) * 100) / 100;
}
