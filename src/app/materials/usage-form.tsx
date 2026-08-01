"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { recordMaterialUsageAction, type MaterialActionState } from "./actions";
import { DateSelect } from "@/components/date-select";

const initialState: MaterialActionState = {};

export function MaterialUsageForm({
  materials,
  worksites,
}: {
  materials: { id: string; name: string; unit: string }[];
  worksites: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    recordMaterialUsageAction,
    initialState
  );
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");

  const selectedUnit = useMemo(
    () => materials.find((m) => m.id === materialId)?.unit ?? "",
    [materials, materialId]
  );

  if (materials.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        材料が登録されていません。管理者にご連絡ください。
      </p>
    );
  }

  if (worksites.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        現場が登録されていません。管理者にご連絡ください。
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">材料</label>
        <select
          name="materialId"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">現場</label>
        <select
          name="worksiteId"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
          {worksites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          数量{selectedUnit && `（${selectedUnit}）`}
        </label>
        <input
          name="quantity"
          type="number"
          min={0}
          step="0.1"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">使用日</label>
        <DateSelect name="usedDate" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考（任意）</label>
        <textarea
          name="note"
          rows={2}
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
        {isPending ? "記録中..." : "記録する"}
      </button>
    </form>
  );
}
