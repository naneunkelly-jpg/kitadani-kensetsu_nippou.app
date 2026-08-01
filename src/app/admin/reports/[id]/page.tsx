import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { DeleteReportButton } from "@/components/delete-report-button";
import { REPORT_STATUS_LABELS } from "@/lib/report-status";
import { ConfirmReportButton } from "./confirm-button";

export default async function AdminReportDetailPage({
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

  const { data: report } = await supabase
    .from("daily_reports")
    .select(
      "id, report_date, status, today_summary, tomorrow_plan, remarks, submitted_at, profiles!daily_reports_employee_id_fkey(full_name)"
    )
    .eq("id", id)
    .single();

  if (!report) notFound();

  const reportEmployee = Array.isArray(report.profiles)
    ? report.profiles[0]
    : report.profiles;

  const { data: entries } = await supabase
    .from("work_entries")
    .select(
      "id, start_time, end_time, break_minutes, work_hours, work_detail, clients(name), worksites(name), report_photos(storage_path)"
    )
    .eq("daily_report_id", report.id)
    .order("sort_order");

  const entriesWithPhotos = await Promise.all(
    (entries ?? []).map(async (e) => {
      const client = Array.isArray(e.clients) ? e.clients[0] : e.clients;
      const worksite = Array.isArray(e.worksites) ? e.worksites[0] : e.worksites;
      const photos = Array.isArray(e.report_photos) ? e.report_photos : [];
      const paths = photos.map((p) => p.storage_path);
      let urls: string[] = [];
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from("report-photos")
          .createSignedUrls(paths, 3600);
        urls = (signed ?? [])
          .filter((s) => !!s.signedUrl)
          .map((s) => s.signedUrl as string);
      }
      return {
        ...e,
        clientName: client?.name ?? "",
        worksiteName: worksite?.name ?? "",
        photoUrls: urls,
      };
    })
  );

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" backHref="/admin/reports" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {report.report_date}　{reportEmployee?.full_name}
            </h1>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                report.status === "confirmed"
                  ? "bg-green-50 text-success"
                  : report.status === "submitted"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-muted"
              }`}
            >
              {REPORT_STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>
          <div className="flex gap-2">
            {report.status === "submitted" && (
              <ConfirmReportButton reportId={report.id} />
            )}
            <Link
              href={`/admin/reports/${report.id}/edit`}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-accent"
            >
              編集する
            </Link>
            <DeleteReportButton reportId={report.id} redirectTo="/admin/reports" />
          </div>
        </div>

        {entriesWithPhotos.map((e) => (
          <div key={e.id} className="space-y-2 rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold text-foreground">
              {e.clientName} / {e.worksiteName}
            </p>
            <p className="text-sm text-muted">
              {e.start_time.slice(0, 5)} 〜 {e.end_time.slice(0, 5)}（休憩{e.break_minutes}分） ・ 実働{" "}
              {e.work_hours}時間
            </p>
            {e.work_detail && <p className="whitespace-pre-wrap text-sm text-foreground">{e.work_detail}</p>}
            {e.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {e.photoUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          {report.today_summary && (
            <div>
              <p className="text-sm font-medium text-muted">今日行ったこと</p>
              <p className="whitespace-pre-wrap text-foreground">{report.today_summary}</p>
            </div>
          )}
          {report.tomorrow_plan && (
            <div>
              <p className="text-sm font-medium text-muted">明日の予定</p>
              <p className="whitespace-pre-wrap text-foreground">{report.tomorrow_plan}</p>
            </div>
          )}
          {report.remarks && (
            <div>
              <p className="text-sm font-medium text-muted">備考</p>
              <p className="whitespace-pre-wrap text-foreground">{report.remarks}</p>
            </div>
          )}
        </div>

        <Link href="/admin/reports" className="block text-center text-sm text-accent">
          一覧に戻る
        </Link>
        </div>
      </main>
    </>
  );
}
