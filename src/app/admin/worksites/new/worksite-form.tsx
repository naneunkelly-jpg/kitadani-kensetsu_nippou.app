"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createWorksiteAction, type FormState } from "../actions";
import { WORKSITE_STATUS_OPTIONS } from "@/lib/worksite-status";

const initialState: FormState = {};

export function NewWorksiteForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createWorksiteAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">元請け先</label>
        <select
          name="clientId"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
          <option value="">選択してください</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">現場名</label>
        <input
          name="name"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="例：○○様邸"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">住所</label>
        <input
          name="address"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">開始日</label>
          <input
            type="date"
            name="startDate"
            className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">終了予定日</label>
          <input
            type="date"
            name="endDate"
            className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">ステータス</label>
        <select
          name="status"
          defaultValue="before_start"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
          {WORKSITE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
          href="/admin/worksites"
          className="rounded-xl border border-border px-4 py-3 text-base font-medium text-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
