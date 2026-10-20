"use client";

import { useState } from "react";

export function CsvExportLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("CSVの生成に失敗しました。");
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "export.csv";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("CSVの生成に失敗しました。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        aria-disabled={isPending}
        className={`${className ?? ""} ${isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        {isPending ? "出力中..." : children}
      </a>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </>
  );
}
