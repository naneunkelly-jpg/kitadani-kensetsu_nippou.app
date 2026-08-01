"use client";

import { useMemo } from "react";

export type EntryState = {
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
export function makeKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyEntry(): EntryState {
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

export function TimeSelect({
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

export function WorkEntryCard({
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
