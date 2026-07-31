"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createEmployeeAction, type FormState } from "../actions";

const initialState: FormState = {};

export function NewEmployeeForm() {
  const [state, formAction, isPending] = useActionState(
    createEmployeeAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">氏名</label>
        <input
          name="fullName"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="例：山田 太郎"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">社員コード</label>
        <input
          name="employeeCode"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="例：0002"
        />
        <p className="mt-1 text-xs text-muted">
          半角英数字。ログイン画面で入力するIDになります。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          初期パスワード
        </label>
        <input
          name="password"
          type="text"
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="8文字以上"
        />
        <p className="mt-1 text-xs text-muted">
          本人に伝えてください。ログイン後の変更機能は今後追加予定です。
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isAdmin" className="h-5 w-5" />
        この従業員を管理者にする
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? "登録中..." : "登録する"}
        </button>
        <Link
          href="/admin/employees"
          className="rounded-xl border border-border px-4 py-3 text-base font-medium text-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
