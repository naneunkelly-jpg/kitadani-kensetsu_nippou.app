"use client";

import { useActionState } from "react";
import {
  updateEmployeeAction,
  resetEmployeePasswordAction,
  type FormState,
} from "../actions";

const initialState: FormState = {};

export function EmployeeEditForm({
  employeeId,
  fullName,
  isActive,
  isAdmin,
}: {
  employeeId: string;
  fullName: string;
  isActive: boolean;
  isAdmin: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateEmployeeAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="employeeId" value={employeeId} />

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">氏名</label>
        <input
          name="fullName"
          defaultValue={fullName}
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isActive" defaultChecked={isActive} className="h-5 w-5" />
        在籍中（オフにすると通知が届かなくなり、ログインもできなくなります）
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isAdmin" defaultChecked={isAdmin} className="h-5 w-5" />
        管理者にする
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
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

export function PasswordResetForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, isPending] = useActionState(
    resetEmployeePasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          パスワードの緊急再設定
        </label>
        <p className="text-xs text-muted">
          通常は本人がログイン後「パスワードを変更する」から変更します。パスワードを忘れて連絡があった場合など、緊急時のみ使用してください。
        </p>
      </div>
      <input
        name="password"
        type="text"
        required
        placeholder="新しいパスワード（8文字以上）"
        className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
      />
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
          パスワードを更新しました。
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl border border-border px-4 py-3 text-base font-medium text-foreground disabled:opacity-60"
      >
        {isPending ? "更新中..." : "パスワードを更新"}
      </button>
    </form>
  );
}
