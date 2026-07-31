"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createToolAction, type FormState } from "../actions";

const initialState: FormState = {};

export function NewToolForm() {
  const [state, formAction, isPending] = useActionState(
    createToolAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">工具名</label>
        <input
          name="name"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="例：インパクトドライバー"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">管理番号</label>
        <input
          name="managementNo"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="例：T-012（任意）"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考</label>
        <textarea
          name="note"
          rows={3}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? "登録中..." : "登録する"}
        </button>
        <Link
          href="/admin/tools"
          className="rounded-xl border border-border px-4 py-3 text-base font-medium text-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
