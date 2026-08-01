"use client";

import { useActionState } from "react";
import { addHolidayRangeAction, type FormState } from "./actions";
import { DateSelect } from "@/components/date-select";

const initialState: FormState = {};

export function RangeHolidayAddForm() {
  const [state, formAction, isPending] = useActionState(
    addHolidayRangeAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold text-foreground">期間で一括登録</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-foreground">開始日</label>
          <DateSelect name="startDate" />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-foreground">終了日</label>
          <DateSelect name="endDate" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">名称</label>
        <input
          name="name"
          required
          placeholder="例：年末年始休暇"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考</label>
        <input
          name="note"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.info && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">{state.info}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "登録中..." : "まとめて登録する"}
      </button>
    </form>
  );
}
