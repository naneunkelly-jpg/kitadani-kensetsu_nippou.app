"use client";

import { useState, useActionState } from "react";
import { registerLeaveAction, type LeaveActionState } from "./actions";
import { DateSelect } from "@/components/date-select";

const initialState: LeaveActionState = {};

const PERIOD_OPTIONS: { value: "day_off" | "day_off_am" | "day_off_pm"; label: string }[] = [
  { value: "day_off", label: "終日" },
  { value: "day_off_am", label: "午前休" },
  { value: "day_off_pm", label: "午後休" },
];

export function LeaveForm() {
  const [state, formAction, isPending] = useActionState(registerLeaveAction, initialState);
  const [period, setPeriod] = useState<"day_off" | "day_off_am" | "day_off_pm">("day_off");

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">休む日</label>
        <DateSelect name="date" yearsBefore={0} yearsAfter={2} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">休みの種類</label>
        <input type="hidden" name="period" value={period} />
        <div className="grid grid-cols-3 gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                period === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
          欠勤予定として登録しました。
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "登録中..." : "休みとして登録する"}
      </button>
    </form>
  );
}
