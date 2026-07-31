import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";

export default async function ReportHistoryPage() {
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

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, report_date, status, today_summary")
    .eq("employee_id", user.id)
    .order("report_date", { ascending: false });

  const reportIds = (reports ?? []).map((r) => r.id);
  const { data: entries } = reportIds.length
    ? await supabase
        .from("work_entries")
        .select("daily_report_id, clients(name), worksites(name)")
        .in("daily_report_id", reportIds)
        .order("sort_order")
    : { data: [] };

  const entriesByReport = new Map<
    string,
    { clientName: string; worksiteName: string }[]
  >();
  for (const e of entries ?? []) {
    const client = Array.isArray(e.clients) ? e.clients[0] : e.clients;
    const worksite = Array.isArray(e.worksites) ? e.worksites[0] : e.worksites;
    const list = entriesByReport.get(e.daily_report_id) ?? [];
    list.push({
      clientName: client?.name ?? "",
      worksiteName: worksite?.name ?? "",
    });
    entriesByReport.set(e.daily_report_id, list);
  }

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-3">
        <h1 className="text-xl font-bold text-foreground">過去の日報</h1>

        {(reports ?? []).map((r) => {
          const sites = entriesByReport.get(r.id) ?? [];
          const label =
            sites.length === 0
              ? "―"
              : sites.length === 1
                ? `${sites[0].clientName} / ${sites[0].worksiteName}`
                : `${sites[0].clientName} / ${sites[0].worksiteName} 他${sites.length - 1}件`;

          return (
            <Link
              key={r.id}
              href={`/report/${r.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-foreground">{r.report_date}</p>
                <p className="text-sm text-muted">{label}</p>
                {r.today_summary && (
                  <p className="mt-1 truncate text-xs text-muted">{r.today_summary}</p>
                )}
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                  r.status === "confirmed"
                    ? "bg-green-50 text-success"
                    : r.status === "submitted"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-muted"
                }`}
              >
                {REPORT_STATUS_LABELS[r.status] ?? r.status}
              </span>
            </Link>
          );
        })}

        {(reports ?? []).length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
            まだ日報がありません。
          </p>
        )}
      </main>
    </>
  );
}
