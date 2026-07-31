"use client";

import { useTransition } from "react";
import { deleteHolidayAction } from "./actions";

export function DeleteHolidayButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("この会社公休日を削除しますか？")) return;
        startTransition(() => {
          deleteHolidayAction(id);
        });
      }}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger disabled:opacity-60"
    >
      削除
    </button>
  );
}
