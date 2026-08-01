"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReportAction } from "@/app/report/actions";

export function DeleteReportButton({
  reportId,
  redirectTo,
}: {
  reportId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("この日報を削除しますか？元に戻せません。")) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteReportAction(reportId);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push(redirectTo);
          });
        }}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-danger disabled:opacity-60"
      >
        {isPending ? "削除中..." : "削除する"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
