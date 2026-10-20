import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { getTodayJstString, getTodayJstYearMonth, monthRange, dayOfWeekUTC, pad2 } from "@/lib/date";
import { SCHEDULE_STATUS_LABELS, type ScheduleStatus } from "@/lib/schedule";
import { SingleHolidayAddForm } from "./single-add-form";
import { RangeHolidayAddForm } from "./range-add-form";
import { DeleteHolidayButton } from "./delete-button";
import { HolidayCalendarGrid, type CalendarDay } from "./calendar-grid";

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const today = getTodayJstYearMonth();
  const year = Number(sp.year) || today.year;
  const month = Number(sp.month) || today.month;
  const todayStr = getTodayJstString();

  const { start, end } = monthRange(year, month);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: holidays }, { data: employeeLeaves }] = await Promise.all([
    supabase
      .from("company_holidays")
      .select("id, holiday_date, name, note")
      .gte("holiday_date", start)
      .lte("holiday_date", end)
      .order("holiday_date"),
    supabase
      .from("employee_schedules")
      .select(
        "schedule_date, status, reason, profiles!employee_schedules_employee_id_fkey(full_name)"
      )
      .in("status", ["day_off", "day_off_am", "day_off_pm"])
      .gte("schedule_date", start)
      .lte("schedule_date", end)
      .order("schedule_date"),
  ]);

  const holidayMap = new Map((holidays ?? []).map((h) => [h.holiday_date, h]));

  type EmployeeLeave = {
    date: string;
    name: string;
    status: ScheduleStatus;
    reason: string | null;
  };

  const leavesByDate = new Map<
    string,
    { name: string; status: ScheduleStatus; reason: string | null }[]
  >();
  const leaveList: EmployeeLeave[] = [];
  for (const l of employeeLeaves ?? []) {
    const p = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
    const name = p?.full_name || "(未設定)";
    const reason = l.reason as string | null;
    const status = l.status as ScheduleStatus;
    const list = leavesByDate.get(l.schedule_date) ?? [];
    list.push({ name, status, reason });
    leavesByDate.set(l.schedule_date, list);
    leaveList.push({ date: l.schedule_date, name, status, reason });
  }

  const firstWeekday = dayOfWeekUTC(start);
  const lastDay = Number(end.slice(8, 10));
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`),
  ];

  const days: (CalendarDay | null)[] = cells.map((dateStr) => {
    if (!dateStr) return null;
    const holiday = holidayMap.get(dateStr);
    return {
      date: dateStr,
      dayNum: Number(dateStr.slice(8, 10)),
      holidayName: holiday?.name ?? null,
      holidayNote: holiday?.note ?? null,
      leaves: leavesByDate.get(dateStr) ?? [],
    };
  });

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold text-foreground">会社カレンダー（公休日設定）</h1>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <Link
              href={`/admin/holidays?year=${prev.year}&month=${prev.month}`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
            >
              ＜ 前月
            </Link>
            <p className="text-lg font-bold text-foreground">
              {year}年{month}月
            </p>
            <Link
              href={`/admin/holidays?year=${next.year}&month=${next.month}`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
            >
              次月 ＞
            </Link>
          </div>

          <HolidayCalendarGrid days={days} todayStr={todayStr} />
          <p className="mt-2 text-xs text-muted">日付をタップすると詳細を確認できます。</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold text-foreground">
            従業員の休み一覧（{year}年{month}月）
          </h2>
          {leaveList.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              この月に登録された従業員の休みはありません。
            </p>
          ) : (
            <div className="space-y-2">
              {leaveList.map((l, idx) => (
                <div
                  key={`${l.date}-${l.name}-${idx}`}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <p className="font-medium text-foreground">
                    {l.date}　{l.name}　{SCHEDULE_STATUS_LABELS[l.status]}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    理由：{l.reason || "（未登録）"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SingleHolidayAddForm />
          <RangeHolidayAddForm />
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold text-foreground">
            {year}年{month}月の会社公休日
          </h2>
          <div className="space-y-2">
            {(holidays ?? []).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {h.holiday_date}　{h.name}
                  </p>
                  {h.note && <p className="text-sm text-muted">{h.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/holidays/${h.id}`}
                    prefetch={false}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    編集
                  </Link>
                  <DeleteHolidayButton id={h.id} />
                </div>
              </div>
            ))}
            {(holidays ?? []).length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
                この月の会社公休日はまだ登録されていません。
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
