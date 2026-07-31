"use client";

import { useState, useTransition } from "react";
import { returnToolAction } from "./actions";

export function ReturnToolButton({ checkoutId }: { checkoutId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("この工具を返却しますか？")) return;
          setError(null);
          startTransition(async () => {
            const result = await returnToolAction(checkoutId);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-60"
      >
        {isPending ? "処理中..." : "返却する"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
