"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcWorkHours } from "@/lib/work-hours";
import { saveReportAction, markDayOffAction } from "../actions";
import type { ScheduleStatus } from "@/lib/schedule";

export type ExistingEntry = {
  clientId: string;
  worksiteId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workDetail: string;
  photos: { path: string; url: string }[];
};

type EntryState = {
  key: string;
  clientId: string;
  worksiteId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  breakMinutesInput: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// crypto.randomUUID は https / localhost 以外（スマホをLAN IPで開いた場合など）
// では使えないことがあるため、常に動く簡易IDを使う。
function makeKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyEntry(): EntryState {
  return {
    key: makeKey(),
    clientId: "",
    worksiteId: "",
    startTime: "",
    endTime: "",
    breakMinutes: 0,
    breakMinutesInput: "0",
  };
}

function draftKey(employeeId: string, reportDate: string) {
  return `kitadani-report-draft-${employeeId}-${reportDate}`;
}

type DraftPayload = {
  remarks?: string;
  entries?: Array<{
    clientId?: string;
    worksiteId?: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
  }>;
};

function loadDraft(employeeId: string, reportDate: string): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(draftKey(employeeId, reportDate));
    return saved ? (JSON.parse(saved) as DraftPayload) : null;
  } catch {
    return null;
  }
}

export function ReportForm({
  employeeId,
  reportDate,
  clients,
  worksites,
  isConfirmed,
  initialWorkStatus,
  initial,
}: {
  employeeId: string;
  reportDate: string;
  clients: { id: string; name: string }[];
  worksites: { id: string; name: string; client_id: string }[];
  isConfirmed: boolean;
  initialWorkStatus: ScheduleStatus;
  initial: {
    todaySummary: string;
    tomorrowPlan: string;
    remarks: string;
    entries: ExistingEntry[];
  };
}) {
  const router = useRouter();

  // サーバー側の下書き/提出済みデータがある場合はそれを使う。
  // 無い場合は、まずサーバーと同じ空の状態でレンダリングし（SSRとの不一致を防ぐため）、
  // マウント後にローカル下書きがあれば復元する（通信不安定時の入力消失対策）。
  const hasServerData = initial.entries.length > 0;

  const [workStatus, setWorkStatus] = useState<ScheduleStatus>(
    hasServerData ? "scheduled_work" : initialWorkStatus
  );
  const [remarks, setRemarks] = useState(initial.remarks);
  const [entries, setEntries] = useState<EntryState[]>(() => {
    if (hasServerData) {
      return initial.entries.map((e) => ({
        key: makeKey(),
        clientId: e.clientId,
        worksiteId: e.worksiteId,
        startTime: e.startTime,
        endTime: e.endTime,
        breakMinutes: e.breakMinutes,
        breakMinutesInput: String(e.breakMinutes),
      }));
    }
    return [emptyEntry()];
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // マウント後（クライアントのみ）にローカル下書きを復元する。
  // レンダー中に読むとサーバー描画と食い違い、Hydrationエラーの原因になるため useEffect で行う。
  useEffect(() => {
    if (hasServerData) return;
    const draft = loadDraft(employeeId, reportDate);
    if (!draft) return;
    if (draft.remarks !== undefined) setRemarks(draft.remarks);
    if (draft.entries && draft.entries.length > 0) {
      setEntries(
        draft.entries.map((e) => ({
          key: makeKey(),
          clientId: e.clientId ?? "",
          worksiteId: e.worksiteId ?? "",
          startTime: e.startTime ?? "",
          endTime: e.endTime ?? "",
          breakMinutes: e.breakMinutes ?? 0,
          breakMinutesInput: String(e.breakMinutes ?? 0),
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = draftKey(employeeId, reportDate);
    const payload = {
      remarks,
      entries: entries.map((e) => ({
        clientId: e.clientId,
        worksiteId: e.worksiteId,
        startTime: e.startTime,
        endTime: e.endTime,
        breakMinutes: e.breakMinutes,
      })),
    };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // 保存できなくても致命的ではないため無視する
    }
  }, [remarks, entries, employeeId, reportDate]);

  function updateEntry(key: string, patch: Partial<EntryState>) {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e))
    );
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
  }

  function handleSaveDayOff() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await markDayOffAction(reportDate);
        if (result.error) {
          setError(result.error);
          return;
        }
        try {
          window.localStorage.removeItem(draftKey(employeeId, reportDate));
        } catch {
          // noop
        }
        router.push("/home");
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました。");
      }
    });
  }

  function handleSave(submit: boolean) {
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
      try {
        const result = await saveReportAction({
          reportDate,
          todaySummary: "",
          tomorrowPlan: "",
          remarks,
          entries: entries.map((e) => ({
            clientId: e.clientId,
            worksiteId: e.worksiteId,
            startTime: e.startTime,
            endTime: e.endTime,
            breakMinutes: Number(e.breakMinutes) || 0,
            workDetail: "",
            photoPaths: [] as string[],
          })),
          submit,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        try {
          window.localStorage.removeItem(draftKey(employeeId, reportDate));
        } catch {
          // noop
        }

        router.push("/home");
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました。");
      }
    });
  }

  if (isConfirmed) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-muted">
            この日報は管理者に確認済みのため編集できません。修正が必要な場合は管理者にご連絡ください。
          </p>
          <a href="/home" className="mt-4 block text-center text-sm text-accent">
            ホームに戻る
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">日報入力</h1>
        <p className="text-sm text-muted">{reportDate}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-medium text-foreground">本日の勤務</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setWorkStatus("scheduled_work")}
            className={`rounded-xl px-4 py-3 text-base font-semibold ${
              workStatus === "scheduled_work"
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted"
            }`}
          >
            出勤
          </button>
          <button
            type="button"
            onClick={() => setWorkStatus("day_off")}
            className={`rounded-xl px-4 py-3 text-base font-semibold ${
              workStatus === "day_off"
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted"
            }`}
          >
            休み
          </button>
        </div>
      </div>

      {workStatus === "scheduled_work" && (
        <>
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
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {workStatus === "scheduled_work" ? (
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave(false)}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-semibold text-foreground disabled:opacity-60"
          >
            下書き保存
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave(true)}
            className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
          >
            {isPending ? "保存中..." : "提出する"}
          </button>
        </div>
      ) : (
        <div className="pb-8">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveDayOff}
            className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
          >
            {isPending ? "保存中..." : "休みとして保存する"}
          </button>
        </div>
      )}
    </div>
    </main>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [h, m] = value ? value.split(":") : ["", ""];

  return (
    <div className="flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m || "00"}`)}
        className="w-[4.5rem] rounded-xl border border-border px-2 py-3 text-base outline-none focus:border-accent"
      >
        <option value="">--</option>
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="text-muted">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h || "00"}:${e.target.value}`)}
        className="w-[4.5rem] rounded-xl border border-border px-2 py-3 text-base outline-none focus:border-accent"
      >
        <option value="">--</option>
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}

function WorkEntryCard({
  index,
  entry,
  clients,
  worksites,
  onChange,
  onRemove,
}: {
  index: number;
  entry: EntryState;
  clients: { id: string; name: string }[];
  worksites: { id: string; name: string; client_id: string }[];
  onChange: (patch: Partial<EntryState>) => void;
  onRemove?: () => void;
}) {
  const filteredWorksites = useMemo(
    () => worksites.filter((w) => w.client_id === entry.clientId),
    [worksites, entry.clientId]
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">現場 {index + 1}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-danger"
          >
            この現場を削除
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">元請け先</label>
        <select
          value={entry.clientId}
          onChange={(e) =>
            onChange({ clientId: e.target.value, worksiteId: "" })
          }
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        >
          <option value="">選択してください</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">現場</label>
        <select
          value={entry.worksiteId}
          onChange={(e) => onChange({ worksiteId: e.target.value })}
          disabled={!entry.clientId}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent disabled:bg-gray-50"
        >
          <option value="">選択してください</option>
          {filteredWorksites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          作業開始時間
        </label>
        <TimeSelect
          value={entry.startTime}
          onChange={(v) => onChange({ startTime: v })}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          作業終了時間
        </label>
        <TimeSelect
          value={entry.endTime}
          onChange={(v) => onChange({ endTime: v })}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          休憩時間（分）
        </label>
        <input
          type="number"
          min={0}
          step={5}
          value={entry.breakMinutesInput}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = Number(raw);
            onChange({
              breakMinutesInput: raw,
              breakMinutes: raw === "" || Number.isNaN(parsed) ? 0 : parsed,
            });
          }}
          onBlur={() => {
            if (entry.breakMinutesInput === "") {
              onChange({ breakMinutesInput: "0" });
            }
          }}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
