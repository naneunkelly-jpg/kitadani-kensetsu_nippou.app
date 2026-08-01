import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { getTodayJstString } from "@/lib/date";
import { ReportForm, type ExistingEntry } from "./report-form";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const reportDate = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
    ? sp.date
    : getTodayJstString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: clients }, { data: worksites }, { data: report }, { data: scheduleOverride }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
      supabase
        .from("clients")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("worksites")
        .select("id, name, client_id")
        .order("name"),
      supabase
        .from("daily_reports")
        .select("id, status, today_summary, tomorrow_plan, remarks")
        .eq("employee_id", user.id)
        .eq("report_date", reportDate)
        .maybeSingle(),
      supabase
        .from("employee_schedules")
        .select("status")
        .eq("employee_id", user.id)
        .eq("schedule_date", reportDate)
        .maybeSingle(),
    ]);

  let existingEntries: ExistingEntry[] = [];

  if (report) {
    const { data: entries } = await supabase
      .from("work_entries")
      .select("client_id, worksite_id, start_time, end_time, break_minutes, work_detail, sort_order")
      .eq("daily_report_id", report.id)
      .order("sort_order");

    existingEntries = (entries ?? []).map((e) => ({
      clientId: e.client_id,
      worksiteId: e.worksite_id,
      startTime: e.start_time.slice(0, 5),
      endTime: e.end_time.slice(0, 5),
      breakMinutes: e.break_minutes,
      workDetail: e.work_detail,
      photos: [],
    }));
  }

  const initialWorkStatus = scheduleOverride?.status === "day_off" ? "day_off" : "scheduled_work";

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
        backHref="/home"
      />
      <ReportForm
        employeeId={user.id}
        reportDate={reportDate}
        clients={clients ?? []}
        worksites={worksites ?? []}
        isConfirmed={report?.status === "confirmed"}
        initialWorkStatus={initialWorkStatus}
        initial={{
          todaySummary: report?.today_summary ?? "",
          tomorrowPlan: report?.tomorrow_plan ?? "",
          remarks: report?.remarks ?? "",
          entries: existingEntries,
        }}
      />
    </>
  );
}
