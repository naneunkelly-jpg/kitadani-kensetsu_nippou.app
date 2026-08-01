"use client";

import { useActionState } from "react";
import { updateNotificationScheduleAction, type FormState } from "./actions";

const initialState: FormState = {};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimeSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [defaultHour, defaultMinute] = defaultValue.split(":");

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} id={`${name}-hidden`} defaultValue={defaultValue} />
      <select
        defaultValue={defaultHour}
        onChange={(e) => {
          const hidden = document.getElementById(`${name}-hidden`) as HTMLInputElement;
          const [, m] = hidden.value.split(":");
          hidden.value = `${e.target.value}:${m}`;
        }}
        className="w-[4.5rem] rounded-xl border border-border px-2 py-3 text-base outline-none focus:border-accent"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-muted">:</span>
      <select
        defaultValue={defaultMinute}
        onChange={(e) => {
          const hidden = document.getElementById(`${name}-hidden`) as HTMLInputElement;
          const [h] = hidden.value.split(":");
          hidden.value = `${h}:${e.target.value}`;
        }}
        className="w-[4.5rem] rounded-xl border border-border px-2 py-3 text-base outline-none focus:border-accent"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function NotificationScheduleForm({
  eveningReminderTime,
  morningReminderTime,
}: {
  eveningReminderTime: string;
  morningReminderTime: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationScheduleAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          未提出リマインドの時刻（当日分）
        </label>
        <p className="mb-2 text-xs text-muted">
          この時刻に、まだ日報を提出していない出勤予定の従業員へ通知します。
        </p>
        <TimeSelect name="eveningReminderTime" defaultValue={eveningReminderTime} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          未提出通知の時刻（前日分）
        </label>
        <p className="mb-2 text-xs text-muted">
          この時刻に、前日の日報が未提出のまま日をまたいだ従業員へ通知します。
        </p>
        <TimeSelect name="morningReminderTime" defaultValue={morningReminderTime} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
          通知時刻を更新しました。
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
