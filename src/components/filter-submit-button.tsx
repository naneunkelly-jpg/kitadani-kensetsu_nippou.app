"use client";

import { useFilterPending } from "./filter-form";

export function FilterSubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const isPending = useFilterPending();

  return (
    <button
      type="submit"
      disabled={isPending}
      className={`${className ?? ""} disabled:opacity-60`}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
}
