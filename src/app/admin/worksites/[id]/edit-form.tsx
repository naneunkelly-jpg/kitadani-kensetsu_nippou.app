"use client";

import { useActionState } from "react";
import { updateWorksiteAction, type FormState } from "../actions";
import { WORKSITE_STATUS_OPTIONS } from "@/lib/worksite-status";
import { DateSelect } from "@/components/date-select";

const initialState: FormState = {};

export function WorksiteEditForm({
  id,
  clients,
  clientId,
  name,
  address,
  startDate,
  endDate,
  status,
  note,
}: {
  id: string;
  clients: { id: string; name: string }[];
  clientId: string;
  name: string;
  address: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  note: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateWorksiteAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="id" value={id} />

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">元請け先</label>
        <select
          name="clientId"
          defaultValue={clientId}
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
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
          defaultValue={name}
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">住所</label>
        <input
          name="address"
          defaultValue={address}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-foreground">開始日</label>
          <DateSelect name="startDate" defaultValue={startDate ?? ""} />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-foreground">終了予定日</label>
          <DateSelect name="endDate" defaultValue={endDate ?? ""} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">ステータス</label>
        <select
          name="status"
          defaultValue={status}
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
          defaultValue={note}
          rows={3}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

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
