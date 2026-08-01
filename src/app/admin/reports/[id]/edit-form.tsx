"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcWorkHours } from "@/lib/work-hours";
import { adminUpdateReportAction } from "../actions";
import {
  WorkEntryCard,
  makeKey,
  emptyEntry,
  type EntryState,
} from "@/components/work-entry-card";

export function AdminReportEditForm({
  reportId,
  clients,
  worksites,
  initialRemarks,
  initialEntries,
}: {
  reportId: string;
  clients: { id: string; name: string }[];
  worksites: { id: string; name: string; client_id: string }[];
  initialRemarks: string;
  initialEntries: {
    clientId: string;
    worksiteId: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
  }[];
}) {
  const router = useRouter();
  const [remarks, setRemarks] = useState(initialRemarks);
  const [entries, setEntries] = useState<EntryState[]>(() =>
    initialEntries.length > 0
      ? initialEntries.map((e) => ({
          key: makeKey(),
          clientId: e.clientId,
          worksiteId: e.worksiteId,
          startTime: e.startTime,
          endTime: e.endTime,
          breakMinutes: e.breakMinutes,
          breakMinutesInput: String(e.breakMinutes),
        }))
      : [emptyEntry()]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateEntry(key: string, patch: Partial<EntryState>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
  }

  function handleSave() {
    setError(null);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.clientId || !e.worksiteId || !e.startTime || !e.endTime) {
        setError(`${i + 1}件目の現場: 元請け先・現場・開始時間・終了時間を入力してください。`);
        return;
      }
      if (calcWorkHours(e.startTime, e.endTime, e.breakMinutes) === null) {
        setError(
          `${i + 1}件目の現場: 終了時間は開始時間より後にし、休憩を差し引いて実働時間が0より大きくなるようにしてください。`
        );
        return;
      }
    }

    startTransition(async () => {
      const result = await adminUpdateReportAction({
        reportId,
        remarks,
        entries: entries.map((e) => ({
          clientId: e.clientId,
          worksiteId: e.worksiteId,
          startTime: e.startTime,
          endTime: e.endTime,
          breakMinutes: Number(e.breakMinutes) || 0,
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/admin/reports/${reportId}`);
    });
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <WorkEntryCard
          key={entry.key}
          index={i}
          entry={entry}
          clients={clients}
          worksites={worksites}
          onChange={(patch) => updateEntry(entry.key, patch)}
          onRemove={entries.length > 1 ? () => removeEntry(entry.key) : undefined}
        />
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted"
      >
        ＋ 現場を追加
      </button>

      <div className="rounded-2xl border border-border bg-card p-5">
        <label className="mb-1 block text-sm font-medium text-foreground">備考</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
