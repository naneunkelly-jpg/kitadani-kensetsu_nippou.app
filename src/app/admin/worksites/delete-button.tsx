"use client";

import { useState, useTransition } from "react";
import { deleteWorksiteAction } from "./actions";

export function DeleteWorksiteButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault();
          if (!confirm(`${name} を削除しますか？`)) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteWorksiteAction(id);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-danger disabled:opacity-60"
      >
        {isPending ? "削除中..." : "削除"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
