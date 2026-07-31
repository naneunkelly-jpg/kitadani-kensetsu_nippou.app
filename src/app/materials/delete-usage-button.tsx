"use client";

import { useState, useTransition } from "react";
import { deleteMaterialUsageAction } from "./actions";

export function DeleteMaterialUsageButton({ usageId }: { usageId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("この使用記録を削除しますか？")) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteMaterialUsageAction(usageId);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger disabled:opacity-60"
      >
        {isPending ? "処理中..." : "削除"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
