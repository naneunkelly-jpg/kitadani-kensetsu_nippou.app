import { logoutAction } from "@/app/logout/actions";

export function AppHeader({
  userName,
  roleLabel,
}: {
  userName: string;
  roleLabel: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">北谷建設 日報管理</p>
          <p className="text-xs text-muted">
            {userName}（{roleLabel}）
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted active:bg-gray-100"
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  );
}
