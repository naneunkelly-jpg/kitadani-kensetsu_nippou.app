"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bulkConfirmReportsAction } from "./actions";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";

export type ReportRow = {
  reportId: string;
  reportDate: string;
  status: string;
  submittedAt: string | null;
  employeeName: string;
  clientName: string;
  worksiteName: string;
  workDetail: string;
};

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const seenReportIds = new Set<string>();

  function toggle(reportId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  }

  function handleBulkConfirm() {
    if (selected.size === 0) return;
    if (!confirm(`選択された${selected.size}件を確認済みにしますか？`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await bulkConfirmReportsAction(Array.from(selected));
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(`${result.count ?? 0}件を確認済みにしました。`);
      setSelected(new Set());
    });
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent bg-accent/5 p-4">
          <p className="text-sm font-medium text-foreground">選択された{selected.size}件</p>
          <button
            type="button"
            disabled={isPending}
            onClick={handleBulkConfirm}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          >
            {isPending
              ? "処理中..."
              : `選択された${selected.size}件のステータスを全て確認済みに変更する`}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">{message}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-muted">
            <tr>
              <th className="whitespace-nowrap px-4 py-3"></th>
              <th className="whitespace-nowrap px-4 py-3">日付</th>
              <th className="whitespace-nowrap px-4 py-3">従業員</th>
              <th className="whitespace-nowrap px-4 py-3">元請け先</th>
              <th className="whitespace-nowrap px-4 py-3">現場</th>
              <th className="whitespace-nowrap px-4 py-3">作業内容</th>
              <th className="whitespace-nowrap px-4 py-3">提出時間</th>
              <th className="whitespace-nowrap px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isFirstOfReport = !seenReportIds.has(row.reportId);
              seenReportIds.add(row.reportId);
              const selectable = isFirstOfReport && row.status === "submitted";

              return (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selected.has(row.reportId)}
                        onChange={() => toggle(row.reportId)}
                        className="h-4 w-4"
                        aria-label={`${row.reportDate} ${row.employeeName} を選択`}
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/reports/${row.reportId}`}
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      {row.reportDate}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{row.employeeName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.clientName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.worksiteName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted">{row.workDetail}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {row.submittedAt
                      ? new Date(row.submittedAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tokyo",
                        })
                      : "―"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === "confirmed"
                          ? "bg-green-50 text-success"
                          : row.status === "submitted"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-muted"
                      }`}
                    >
                      {REPORT_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  該当する日報がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
