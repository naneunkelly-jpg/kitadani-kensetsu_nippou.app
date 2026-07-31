"use client";

import { useState, useTransition } from "react";
import { confirmReportAction } from "../actions";

export function ConfirmReportButton({ reportId }: { reportId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("この日報を確認済みにしますか？")) return;
          startTransition(async () => {
            const result = await confirmReportAction(reportId);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "処理中..." : "確認済みにする"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
