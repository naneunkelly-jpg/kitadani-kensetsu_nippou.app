import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { BackLink } from "@/components/back-link";
import { getTodayJstYearMonth } from "@/lib/date";
import { getEmployeeWorksiteSummary } from "@/lib/summary";

type SearchParams = {
  year?: string;
  month?: string;
};

export default async function AdminSummaryEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { year: defaultYear, month: defaultMonth } = getTodayJstYearMonth();
  const year = Number(sp.year) || defaultYear;
  const month = Number(sp.month) || defaultMonth;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { employeeName, rows } = await getEmployeeWorksiteSummary(id, year, month);
  if (employeeName === null) notFound();

  const summaryHref = `/admin/summary?year=${year}&month=${month}`;

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" backHref={summaryHref} />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {employeeName}（{year}年{month}月・現場別）
          </h1>
          <BackLink fallbackHref={summaryHref} className="text-sm text-accent">
            月次集計に戻る
          </BackLink>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">現場</th>
                <th className="whitespace-nowrap px-4 py-3">元請け先</th>
                <th className="whitespace-nowrap px-4 py-3">出勤日数</th>
                <th className="whitespace-nowrap px-4 py-3">実働時間</th>
                <th className="whitespace-nowrap px-4 py-3">人日</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.worksiteId} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                    {r.worksiteName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{r.clientName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.attendanceDays}日</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.workHours}時間</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.personDays}人日</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    この月の現場での作業記録はありません。
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
