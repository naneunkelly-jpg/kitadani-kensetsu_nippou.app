"use client";

import { useActionState } from "react";
import { updateClientAction, type FormState } from "../actions";

const initialState: FormState = {};

export function ClientEditForm({
  id,
  name,
  note,
  isActive,
}: {
  id: string;
  name: string;
  note: string;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateClientAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="id" value={id} />

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">元請け先名</label>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考</label>
        <textarea
          name="note"
          defaultValue={note}
          rows={3}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isActive" defaultChecked={isActive} className="h-5 w-5" />
        有効（オフにすると日報入力時の選択肢から外れます）
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
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
