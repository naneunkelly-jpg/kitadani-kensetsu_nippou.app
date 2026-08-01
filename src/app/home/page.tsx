import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { PushSubscribeToggle } from "@/components/push-subscribe-toggle";
import { getTodayJstString } from "@/lib/date";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // PWAとしてホーム画面から起動した場合、manifestのstart_urlにより
  // ログイン画面を経由せず直接ここに来ることがあるため、
  // 管理者の場合はここで管理者ダッシュボードへ振り分ける。
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const todayStr = getTodayJstString();

  const [{ data: todayReport }, { count: openToolCount }] =
    await Promise.all([
      supabase
        .from("daily_reports")
        .select("status")
        .eq("employee_id", user.id)
        .eq("report_date", todayStr)
        .maybeSingle(),
      supabase
        .from("tool_checkouts")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", user.id)
        .is("returned_at", null),
    ]);

  const reportStatusLabel = todayReport
    ? (REPORT_STATUS_LABELS[todayReport.status] ?? todayReport.status)
    : "未提出";
  const isSubmitted = todayReport?.status && todayReport.status !== "draft";

  const today = new Date();
  const dateLabel = today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <p className="text-sm text-muted">{dateLabel}</p>

        {/* 今日の日報を書く：最重要アクションを最上部・最大に配置 */}
        <Link
          href="/report/new"
          className="block rounded-2xl bg-accent px-5 py-6 text-center text-lg font-bold text-accent-foreground shadow-sm active:opacity-90"
        >
          {todayReport ? "今日の日報を編集する" : "今日の日報を書く"}
        </Link>

        {/* 工具・材料の記録：主要アクションほどではないが目立たせる */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/tools"
            className="rounded-2xl border-2 border-accent bg-accent/5 px-4 py-4 text-center active:bg-accent/10"
          >
            <p className="font-semibold text-accent">工具の持ち出し・返却</p>
            <p className="mt-1 text-sm text-muted">持ち出し中 {openToolCount ?? 0}件</p>
          </Link>

          <Link
            href="/materials"
            className="rounded-2xl border-2 border-accent bg-accent/5 px-4 py-4 text-center active:bg-accent/10"
          >
            <p className="font-semibold text-accent">材料の使用記録</p>
            <p className="mt-1 text-sm text-muted">記録する</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">今日の日報提出状況</p>
            <p
              className={`mt-1 text-xl font-bold ${
                isSubmitted ? "text-success" : "text-foreground"
              }`}
            >
              {reportStatusLabel}
            </p>
          </div>

          <Link
            href="/report"
            className="rounded-2xl border border-border bg-card p-5 active:bg-gray-50"
          >
            <p className="text-sm text-muted">過去の日報</p>
            <p className="mt-1 text-xl font-bold text-foreground">見る</p>
          </Link>
        </div>

        <PushSubscribeToggle />

        <Link
          href="/account/password"
          className="block text-center text-sm text-accent underline-offset-2 hover:underline"
        >
          パスワードを変更する
        </Link>
      </div>
      </main>
    </>
  );
}
