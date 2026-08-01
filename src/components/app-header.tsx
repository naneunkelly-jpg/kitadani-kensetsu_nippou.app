import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";

export function AppHeader({
  userName,
  roleLabel,
  backHref,
}: {
  userName: string;
  roleLabel: string;
  // PWAとしてホーム画面から起動した場合はブラウザの戻るボタンが無いため、
  // トップ階層以外のページでは必ず指定してアプリ内に戻る手段を用意する。
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label="戻る"
              className="-ml-1 shrink-0 rounded-lg p-2 text-lg text-muted active:bg-gray-100"
            >
              ←
            </Link>
          )}
          <Image
            src="/icons/logo.png"
            alt=""
            width={44}
            height={32}
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">北谷建設 日報管理</p>
            <p className="truncate text-xs text-muted">
              {userName}（{roleLabel}）
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted active:bg-gray-100"
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  );
}
