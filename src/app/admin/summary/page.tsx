import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { getTodayJstYearMonth } from "@/lib/date";
import { getMonthlySummary } from "@/lib/summary";

type SearchParams = {
  year?: string;
  month?: string;
};

export default async function AdminSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { year: currentYear } = getTodayJstYearMonth();

  const year = Number(sp.year) || getTodayJstYearMonth().year;
  const month = Number(sp.month) || getTodayJstYearMonth().month;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { employees, clients, worksites } = await getMonthlySummary(year, month);

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold text-foreground">月次集計</h1>

        <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs text-muted">年</label>
            <select
              name="year"
              defaultValue={year}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">月</label>
            <select
              name="month"
              defaultValue={month}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            表示
          </button>
        </form>

        <a
          href={`/admin/summary/csv?type=all&year=${year}&month=${month}`}
          className="block rounded-2xl border-2 border-accent bg-accent/5 px-4 py-3 text-center text-sm font-semibold text-accent active:bg-accent/10"
        >
          集計をまとめてCSVエクスポート
        </a>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              従業員別（{year}年{month}月）
            </h2>
            <a
              href={`/admin/summary/csv?type=employee&year=${year}&month=${month}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-gray-100"
            >
              CSVエクスポート
            </a>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">氏名</th>
                  <th className="whitespace-nowrap px-4 py-3">出勤日数</th>
                  <th className="whitespace-nowrap px-4 py-3">総実働時間</th>
                  <th className="whitespace-nowrap px-4 py-3">人日</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.employeeId} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {e.employeeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{e.attendanceDays}日</td>
                    <td className="whitespace-nowrap px-4 py-3">{e.workHours}時間</td>
                    <td className="whitespace-nowrap px-4 py-3">{e.personDays}人日</td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      該当する従業員がいません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              元請け先別（{year}年{month}月）
            </h2>
            <a
              href={`/admin/summary/csv?type=client&year=${year}&month=${month}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-gray-100"
            >
              CSVエクスポート
            </a>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">元請け先</th>
                  <th className="whitespace-nowrap px-4 py-3">総実働時間</th>
                  <th className="whitespace-nowrap px-4 py-3">人日</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.clientId} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {c.clientName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{c.workHours}時間</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.personDays}人日</td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted">
                      該当するデータがありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              現場別（{year}年{month}月）
            </h2>
            <a
              href={`/admin/summary/csv?type=worksite&year=${year}&month=${month}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-gray-100"
            >
              CSVエクスポート
            </a>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">現場</th>
                  <th className="whitespace-nowrap px-4 py-3">元請け先</th>
                  <th className="whitespace-nowrap px-4 py-3">総実働時間</th>
                  <th className="whitespace-nowrap px-4 py-3">人日</th>
                </tr>
              </thead>
              <tbody>
                {worksites.map((w) => (
                  <tr key={w.worksiteId} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {w.worksiteName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{w.clientName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{w.workHours}時間</td>
                    <td className="whitespace-nowrap px-4 py-3">{w.personDays}人日</td>
                  </tr>
                ))}
                {worksites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      該当するデータがありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
