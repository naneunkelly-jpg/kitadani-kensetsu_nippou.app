"use client";

import { useActionState, useState } from "react";
import { addMaterialStockAction, type FormState } from "./actions";

const initialState: FormState = {};

export function AddStockForm({ materialId, unit }: { materialId: string; unit: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addMaterialStockAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-border py-2 text-sm font-medium text-muted"
      >
        ＋ 入荷を登録
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-border bg-gray-50 p-3">
      <input type="hidden" name="materialId" value={materialId} />
      <input
        name="quantity"
        type="number"
        min={0}
        step="0.01"
        required
        placeholder={`数量${unit ? `（${unit}）` : ""}`}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        name="note"
        placeholder="備考（任意・仕入先など）"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? "登録中..." : "登録する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted"
        >
          閉じる
        </button>
      </div>
    </form>
  );
}
