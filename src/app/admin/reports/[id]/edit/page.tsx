import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { AdminReportEditForm } from "../edit-form";

export default async function AdminReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: report }, { data: clients }, { data: worksites }] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("id, report_date, remarks, profiles!daily_reports_employee_id_fkey(full_name)")
      .eq("id", id)
      .single(),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("worksites").select("id, name, client_id").order("name"),
  ]);

  if (!report) notFound();

  const employee = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;

  const { data: entries } = await supabase
    .from("work_entries")
    .select("client_id, worksite_id, start_time, end_time, break_minutes")
    .eq("daily_report_id", id)
    .order("sort_order");

  return (
    <>
      <AppHeader
        userName={me?.full_name ?? "管理者"}
        roleLabel="管理者"
        backHref={`/admin/reports/${id}`}
      />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">日報を編集</h1>
            <p className="text-sm text-muted">
              {report.report_date}　{employee?.full_name}
            </p>
          </div>

          <AdminReportEditForm
            reportId={report.id}
            clients={clients ?? []}
            worksites={worksites ?? []}
            initialRemarks={report.remarks}
            initialEntries={(entries ?? []).map((e) => ({
              clientId: e.client_id,
              worksiteId: e.worksite_id,
              startTime: e.start_time.slice(0, 5),
              endTime: e.end_time.slice(0, 5),
              breakMinutes: e.break_minutes,
            }))}
          />
        </div>
      </main>
    </>
  );
}
