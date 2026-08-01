"use client";

import { useState, useTransition } from "react";
import { deleteMaterialStockEntryAction } from "./actions";

export function DeleteStockEntryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("この入荷記録を削除しますか？")) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteMaterialStockEntryAction(id);
            if (result.error) setError(result.error);
          });
        }}
        className="whitespace-nowrap rounded-lg border border-border px-2 py-1 text-xs font-medium text-danger disabled:opacity-60"
      >
        削除
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
