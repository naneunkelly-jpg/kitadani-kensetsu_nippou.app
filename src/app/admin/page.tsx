import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { getTodayJstString } from "@/lib/date";
import { effectiveScheduleStatus } from "@/lib/schedule";

export default async function AdminDashboardPage() {
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

  const todayStr = getTodayJstString();
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  const [{ data: employees }, { data: scheduleOverrides }, { data: todayReports }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("employee_schedules")
        .select("employee_id, status")
        .eq("schedule_date", todayStr),
      supabase
        .from("daily_reports")
        .select("employee_id, status")
        .eq("report_date", todayStr),
    ]);

  const overrideByEmployee = new Map(
    (scheduleOverrides ?? []).map((s) => [s.employee_id, s.status])
  );
  const reportByEmployee = new Map(
    (todayReports ?? []).map((r) => [r.employee_id, r.status])
  );

  const scheduledEmployees = (employees ?? []).filter(
    (e) => effectiveScheduleStatus(todayStr, overrideByEmployee.get(e.id)) === "scheduled_work"
  );
  const dayOffCount = (employees ?? []).length - scheduledEmployees.length;

  const submittedCount = scheduledEmployees.filter((e) => {
    const status = reportByEmployee.get(e.id);
    return status === "submitted" || status === "confirmed";
  }).length;

  const unsubmittedEmployees = scheduledEmployees.filter((e) => {
    const status = reportByEmployee.get(e.id);
    return status !== "submitted" && status !== "confirmed";
  });

  const submissionRate =
    scheduledEmployees.length > 0
      ? Math.round((submittedCount / scheduledEmployees.length) * 100)
      : null;

  const stats = [
    { label: "出勤予定人数", value: `${scheduledEmployees.length}人` },
    { label: "休み人数", value: `${dayOffCount}人` },
    { label: "日報提出", value: `${submittedCount}/${scheduledEmployees.length}人` },
    { label: "提出率", value: submissionRate === null ? "―" : `${submissionRate}%` },
  ];

  return (
    <>
      <AppHeader userName={profile?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
        <p className="text-sm text-muted">{today}</p>
        <h1 className="text-xl font-bold text-foreground">本日の状況</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">
            未提出者（出勤予定・{unsubmittedEmployees.length}人）
          </h2>
          {unsubmittedEmployees.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
              出勤予定の従業員は全員、日報を提出済みです。
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {unsubmittedEmployees.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    {e.full_name || "(未設定)"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                    {reportByEmployee.get(e.id) === "draft" ? "下書きのまま" : "未提出"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted">
          日報の詳細は
          <Link href="/admin/reports" className="text-accent underline-offset-2 hover:underline">
            日報一覧
          </Link>
          、月別の集計は
          <Link href="/admin/summary" className="text-accent underline-offset-2 hover:underline">
            月次集計
          </Link>
          から確認できます。
        </p>

        <Link
          href="/account/password"
          className="block text-center text-sm text-accent underline-offset-2 hover:underline"
        >
          パスワードを変更する
        </Link>
      </main>
    </>
  );
}
