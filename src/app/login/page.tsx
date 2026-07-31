"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-bold text-foreground">北谷建設</p>
          <p className="text-2xl font-bold text-foreground">日報管理</p>
        </div>

        <form action={formAction} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <label
              htmlFor="employeeCode"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              社員コード
            </label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              inputMode="text"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
              placeholder="例：0001"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
              placeholder="パスワード"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
          >
            {isPending ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          ログイン情報が分からない場合は管理者にお問い合わせください。
        </p>
      </div>
    </main>
  );
}
