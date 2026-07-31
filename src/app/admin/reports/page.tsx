import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";

type SearchParams = {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  clientId?: string;
  worksiteId?: string;
  status?: string;
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: employees }, { data: clients }, { data: worksites }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("worksites").select("id, name, client_id").order("name"),
    ]);

  let query = supabase
    .from("daily_reports")
    .select(
      "id, report_date, status, submitted_at, employee_id, profiles!daily_reports_employee_id_fkey(full_name), work_entries(id, start_time, end_time, work_hours, work_detail, client_id, worksite_id, sort_order, clients(name), worksites(name))"
    )
    .order("report_date", { ascending: false });

  if (sp.dateFrom) query = query.gte("report_date", sp.dateFrom);
  if (sp.dateTo) query = query.lte("report_date", sp.dateTo);
  if (sp.employeeId) query = query.eq("employee_id", sp.employeeId);
  if (sp.status) query = query.eq("status", sp.status);

  const { data: reports } = await query;

  type Row = {
    reportId: string;
    reportDate: string;
    status: string;
    submittedAt: string | null;
    employeeName: string;
    clientId: string;
    clientName: string;
    worksiteId: string;
    worksiteName: string;
    workDetail: string;
    workHours: number;
  };

  const rows: Row[] = [];
  for (const r of reports ?? []) {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const entries = Array.isArray(r.work_entries) ? r.work_entries : [];
    for (const e of entries) {
      const client = Array.isArray(e.clients) ? e.clients[0] : e.clients;
      const worksite = Array.isArray(e.worksites) ? e.worksites[0] : e.worksites;
      if (sp.clientId && e.client_id !== sp.clientId) continue;
      if (sp.worksiteId && e.worksite_id !== sp.worksiteId) continue;
      rows.push({
        reportId: r.id,
        reportDate: r.report_date,
        status: r.status,
        submittedAt: r.submitted_at,
        employeeName: profile?.full_name ?? "",
        clientId: e.client_id,
        clientName: client?.name ?? "",
        worksiteId: e.worksite_id,
        worksiteName: worksite?.name ?? "",
        workDetail: e.work_detail,
        workHours: e.work_hours,
      });
    }
  }

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground">日報一覧</h1>

        <form className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3 md:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs text-muted">開始日</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={sp.dateFrom}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">終了日</label>
            <input
              type="date"
              name="dateTo"
              defaultValue={sp.dateTo}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">従業員</label>
            <select
              name="employeeId"
              defaultValue={sp.employeeId ?? ""}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            >
              <option value="">すべて</option>
              {(employees ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">元請け先</label>
            <select
              name="clientId"
              defaultValue={sp.clientId ?? ""}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            >
              <option value="">すべて</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">現場</label>
            <select
              name="worksiteId"
              defaultValue={sp.worksiteId ?? ""}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            >
              <option value="">すべて</option>
              {(worksites ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">ステータス</label>
            <select
              name="status"
              defaultValue={sp.status ?? ""}
              className="w-full rounded-lg border border-border px-2 py-2 text-sm"
            >
              <option value="">すべて</option>
              <option value="draft">下書き</option>
              <option value="submitted">提出済み</option>
              <option value="confirmed">確認済み</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-3 md:col-span-6">
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              絞り込む
            </button>
          </div>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">従業員</th>
                <th className="px-4 py-3">元請け先</th>
                <th className="px-4 py-3">現場</th>
                <th className="px-4 py-3">作業内容</th>
                <th className="px-4 py-3">提出時間</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reports/${row.reportId}`}
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      {row.reportDate}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.employeeName}</td>
                  <td className="px-4 py-3">{row.clientName}</td>
                  <td className="px-4 py-3">{row.worksiteName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted">
                    {row.workDetail}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.submittedAt
                      ? new Date(row.submittedAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tokyo",
                        })
                      : "―"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === "confirmed"
                          ? "bg-green-50 text-success"
                          : row.status === "submitted"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-muted"
                      }`}
                    >
                      {REPORT_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted">
                    該当する日報がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
