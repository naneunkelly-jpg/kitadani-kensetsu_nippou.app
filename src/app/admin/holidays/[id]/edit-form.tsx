"use client";

import { useActionState } from "react";
import { updateHolidayAction, type FormState } from "../actions";

const initialState: FormState = {};

export function HolidayEditForm({
  id,
  name,
  note,
}: {
  id: string;
  name: string;
  note: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateHolidayAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">名称</label>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考</label>
        <input
          name="note"
          defaultValue={note}
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
        {isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
