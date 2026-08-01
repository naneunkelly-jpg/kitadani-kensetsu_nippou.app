"use client";

import { useActionState } from "react";
import { registerLeaveAction, type LeaveActionState } from "./actions";
import { DateSelect } from "@/components/date-select";

const initialState: LeaveActionState = {};

export function LeaveForm() {
  const [state, formAction, isPending] = useActionState(registerLeaveAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">休む日</label>
        <DateSelect name="date" yearsBefore={0} yearsAfter={2} />
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
