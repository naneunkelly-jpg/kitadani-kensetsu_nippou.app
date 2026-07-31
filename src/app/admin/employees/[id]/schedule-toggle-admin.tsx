"use client";

import { useState, useTransition } from "react";
import { setEmployeeScheduleAction } from "../actions";
import { SCHEDULE_STATUS_LABELS, type ScheduleStatus } from "@/lib/schedule";

export function AdminScheduleToggle({
  employeeId,
  initialStatus,
}: {
  employeeId: string;
  initialStatus: ScheduleStatus;
}) {
  const [status, setStatus] = useState<ScheduleStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: ScheduleStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setEmployeeScheduleAction(employeeId, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setStatus(next);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted">本日の勤務状態</p>
      <p className="mt-1 text-xl font-bold text-foreground">
        {SCHEDULE_STATUS_LABELS[status]}
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          handleChange(status === "scheduled_work" ? "day_off" : "scheduled_work")
        }
        className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {isPending
          ? "更新中..."
          : status === "scheduled_work"
            ? "本日を休みにする"
            : "本日を出勤予定に戻す"}
      </button>
    </div>
  );
}
