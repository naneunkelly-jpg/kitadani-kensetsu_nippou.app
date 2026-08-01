"use client";

import { useActionState } from "react";
import { goToReportForDateAction, type SelectDateState } from "./actions";
import { DateSelect } from "@/components/date-select";

const initialState: SelectDateState = {};

export function SelectDateForm() {
  const [state, formAction, isPending] = useActionState(
    goToReportForDateAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">日報を書く日</label>
        <DateSelect name="date" yearsBefore={1} yearsAfter={0} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "確認中..." : "この日の日報を書く"}
      </button>
    </form>
  );
}
