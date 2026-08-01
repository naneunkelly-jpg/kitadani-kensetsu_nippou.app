"use client";

import { useActionState, useState } from "react";
import { createToolAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddToolUnitForm({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createToolAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-border py-2 text-sm font-medium text-muted"
      >
        ＋ 号機を追加
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-border bg-gray-50 p-3">
      <input type="hidden" name="name" value={name} />
      <input
        name="managementNo"
        placeholder="管理番号（例：T-012・任意）"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        name="note"
        placeholder="備考（任意）"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? "追加中..." : "追加する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
