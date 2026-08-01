import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/date";

export type EmployeeSummaryRow = {
  employeeId: string;
  employeeName: string;
  attendanceDays: number;
  workHours: number;
  personDays: number;
};

export type ClientSummaryRow = {
  clientId: string;
  clientName: string;
  workHours: number;
  personDays: number;
};

export type WorksiteSummaryRow = {
  worksiteId: string;
  worksiteName: string;
  clientName: string;
  workHours: number;
  personDays: number;
};

export type MonthlySummary = {
  employees: EmployeeSummaryRow[];
  clients: ClientSummaryRow[];
  worksites: WorksiteSummaryRow[];
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * 指定した年月（JST基準）の従業員別・元請け先別・現場別の集計を計算する。
 * 出勤日数はdaily_reportsの件数、工数はwork_entries.work_hoursの合計。
 * 人日は固定8時間=1人日として work_hours ÷ 8 で按分する。
 */
export async function getMonthlySummary(
  year: number,
  month: number
): Promise<MonthlySummary> {
  const supabase = await createClient();
  const { start, end } = monthRange(year, month);

  const [{ data: profiles }, { data: reports }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("daily_reports")
      .select("id, employee_id")
      .gte("report_date", start)
      .lte("report_date", end),
  ]);

  const reportIds = (reports ?? []).map((r) => r.id);

  const { data: entries } =
    reportIds.length > 0
      ? await supabase
          .from("work_entries")
          .select(
            "employee_id, client_id, worksite_id, work_hours, clients(name), worksites(name)"
          )
          .in("daily_report_id", reportIds)
      : { data: [] };

  const attendanceByEmployee = new Map<string, number>();
  for (const r of reports ?? []) {
    attendanceByEmployee.set(
      r.employee_id,
      (attendanceByEmployee.get(r.employee_id) ?? 0) + 1
    );
  }

  const hoursByEmployee = new Map<string, number>();
  const clientAgg = new Map<string, { name: string; hours: number }>();
  const worksiteAgg = new Map<
    string,
    { name: string; clientName: string; hours: number }
  >();

  for (const e of entries ?? []) {
    hoursByEmployee.set(
      e.employee_id,
      (hoursByEmployee.get(e.employee_id) ?? 0) + e.work_hours
    );

    const client = Array.isArray(e.clients) ? e.clients[0] : e.clients;
    const worksite = Array.isArray(e.worksites) ? e.worksites[0] : e.worksites;

    const cAgg = clientAgg.get(e.client_id) ?? { name: client?.name ?? "", hours: 0 };
    cAgg.hours += e.work_hours;
    clientAgg.set(e.client_id, cAgg);

    const wAgg = worksiteAgg.get(e.worksite_id) ?? {
      name: worksite?.name ?? "",
      clientName: client?.name ?? "",
      hours: 0,
    };
    wAgg.hours += e.work_hours;
    worksiteAgg.set(e.worksite_id, wAgg);
  }

  const employees: EmployeeSummaryRow[] = (profiles ?? []).map((p) => {
    const workHours = hoursByEmployee.get(p.id) ?? 0;
    return {
      employeeId: p.id,
      employeeName: p.full_name || "(未設定)",
      attendanceDays: attendanceByEmployee.get(p.id) ?? 0,
      workHours: round1(workHours),
      personDays: round1(workHours / 8),
    };
  });

  const clients: ClientSummaryRow[] = Array.from(clientAgg.entries())
    .map(([id, v]) => ({
      clientId: id,
      clientName: v.name,
      workHours: round1(v.hours),
      personDays: round1(v.hours / 8),
    }))
    .sort((a, b) => b.workHours - a.workHours);

  const worksites: WorksiteSummaryRow[] = Array.from(worksiteAgg.entries())
    .map(([id, v]) => ({
      worksiteId: id,
      worksiteName: v.name,
      clientName: v.clientName,
      workHours: round1(v.hours),
      personDays: round1(v.hours / 8),
    }))
    .sort((a, b) => b.workHours - a.workHours);

  return { employees, clients, worksites };
}
