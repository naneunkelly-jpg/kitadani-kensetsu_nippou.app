"use client";

import { useActionState } from "react";
import { changeMyPasswordAction, type FormState } from "./actions";

const initialState: FormState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changeMyPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          現在のパスワード
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          新しいパスワード
        </label>
        <input
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="8文字以上"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          新しいパスワード（確認）
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
          パスワードを変更しました。
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "変更中..." : "パスワードを変更する"}
      </button>
    </form>
  );
}
