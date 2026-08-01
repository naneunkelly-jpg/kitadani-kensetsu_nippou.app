"use client";

import { useState, useTransition } from "react";
import { cancelLeaveAction } from "./actions";

export function CancelLeaveButton({ date }: { date: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(`${date}の欠勤予定を取り消しますか？`)) return;
          setError(null);
          startTransition(async () => {
            const result = await cancelLeaveAction(date);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted disabled:opacity-60"
      >
        {isPending ? "処理中..." : "取り消す"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
