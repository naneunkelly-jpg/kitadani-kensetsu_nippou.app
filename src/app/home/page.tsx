import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { ScheduleToggle } from "@/components/schedule-toggle";
import { getTodayJstString } from "@/lib/date";
import { effectiveScheduleStatus } from "@/lib/schedule";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const todayStr = getTodayJstString();

  const [{ data: profile }, { data: scheduleOverride }, { data: todayReport }, { count: openToolCount }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
      supabase
        .from("employee_schedules")
        .select("status")
        .eq("employee_id", user.id)
        .eq("schedule_date", todayStr)
        .maybeSingle(),
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

  const status = effectiveScheduleStatus(todayStr, scheduleOverride?.status);
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-4">
        <p className="text-sm text-muted">{dateLabel}</p>

        {/* 今日の日報を書く：最重要アクションを最上部・最大に配置 */}
        <Link
          href="/report/new"
          className="block rounded-2xl bg-accent px-5 py-6 text-center text-lg font-bold text-accent-foreground shadow-sm active:opacity-90"
        >
          {todayReport ? "今日の日報を編集する" : "今日の日報を書く"}
        </Link>

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

          <ScheduleToggle initialStatus={status} />

          <Link
            href="/tools"
            className="rounded-2xl border border-border bg-card p-5 active:bg-gray-50"
          >
            <p className="text-sm text-muted">現在持ち出している工具</p>
            <p className="mt-1 text-xl font-bold text-foreground">{openToolCount ?? 0}件</p>
          </Link>

          <Link
            href="/report"
            className="rounded-2xl border border-border bg-card p-5 active:bg-gray-50"
          >
            <p className="text-sm text-muted">過去の日報</p>
            <p className="mt-1 text-xl font-bold text-foreground">見る</p>
          </Link>

          <Link
            href="/materials"
            className="rounded-2xl border border-border bg-card p-5 active:bg-gray-50"
          >
            <p className="text-sm text-muted">材料の使用記録</p>
            <p className="mt-1 text-xl font-bold text-foreground">記録する</p>
          </Link>
        </div>
      </main>
    </>
  );
}
