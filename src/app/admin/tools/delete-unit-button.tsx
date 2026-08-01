"use client";

import { useState, useTransition } from "react";
import { deleteToolAction } from "./actions";

export function DeleteToolUnitButton({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(`${label} を削除しますか？`)) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteToolAction(id);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-danger disabled:opacity-60"
      >
        削除
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
