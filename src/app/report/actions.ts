"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcWorkHours } from "@/lib/work-hours";

export type SaveReportResult = {
  error?: string;
  reportId?: string;
};

const workEntrySchema = z.object({
  clientId: z.string().uuid("元請け先を選択してください。"),
  worksiteId: z.string().uuid("現場を選択してください。"),
  startTime: z.string().min(1, "作業開始時間を入力してください。"),
  endTime: z.string().min(1, "作業終了時間を入力してください。"),
  breakMinutes: z.number().min(0).max(24 * 60),
  workDetail: z.string().trim().optional(),
  photoPaths: z.array(z.string()).default([]),
});

const saveReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  todaySummary: z.string().trim().optional(),
  tomorrowPlan: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  entries: z.array(workEntrySchema).min(1, "現場を1件以上入力してください。"),
  submit: z.boolean(),
});

export type SaveReportInput = z.infer<typeof saveReportSchema>;

export async function saveReportAction(
  input: SaveReportInput
): Promise<SaveReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const parsed = saveReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { reportDate, todaySummary, tomorrowPlan, remarks, entries, submit } =
    parsed.data;

  // 実働時間をサーバー側で再計算し、不正な時間指定を弾く
  const computedEntries: {
    client_id: string;
    worksite_id: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    work_hours: number;
    work_detail: string;
    sort_order: number;
    photoPaths: string[];
  }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const workHours = calcWorkHours(e.startTime, e.endTime, e.breakMinutes);
    if (workHours === null) {
      return {
        error: `${i + 1}件目の現場: 終了時間は開始時間より後にし、休憩時間を差し引いて実働時間が0より大きくなるようにしてください。`,
      };
    }
    computedEntries.push({
      client_id: e.clientId,
      worksite_id: e.worksiteId,
      start_time: e.startTime,
      end_time: e.endTime,
      break_minutes: e.breakMinutes,
      work_hours: workHours,
      work_detail: e.workDetail ?? "",
      sort_order: i,
      photoPaths: e.photoPaths,
    });
  }

  // daily_reports の upsert（employee_id + report_date で一意）
  const existingStatusRes = await supabase
    .from("daily_reports")
    .select("id, status")
    .eq("employee_id", user.id)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (existingStatusRes.data?.status === "confirmed") {
    return {
      error: "この日報は管理者に確認済みのため編集できません。修正が必要な場合は管理者にご連絡ください。",
    };
  }

  const nextStatus = submit ? "submitted" : "draft";

  const { data: report, error: reportError } = await supabase
    .from("daily_reports")
    .upsert(
      {
        employee_id: user.id,
        report_date: reportDate,
        today_summary: todaySummary ?? "",
        tomorrow_plan: tomorrowPlan ?? "",
        remarks: remarks ?? "",
        status: nextStatus,
        submitted_at: submit ? new Date().toISOString() : null,
      },
      { onConflict: "employee_id,report_date" }
    )
    .select("id")
    .single();

  if (reportError || !report) {
    return { error: `保存に失敗しました: ${reportError?.message ?? "不明なエラー"}` };
  }

  // 出勤として日報を保存する場合、勤務状態も出勤予定に揃える
  // （以前「休み」に変更されていた日を出勤に戻すケースを含む）。失敗しても日報保存自体は継続する。
  await supabase.from("employee_schedules").upsert(
    {
      employee_id: user.id,
      schedule_date: reportDate,
      status: "scheduled_work",
      updated_by: user.id,
    },
    { onConflict: "employee_id,schedule_date" }
  );

  // 既存の作業明細を削除してから再登録する（写真もカスケード削除される）
  const { error: deleteError } = await supabase
    .from("work_entries")
    .delete()
    .eq("daily_report_id", report.id);

  if (deleteError) {
    return { error: `保存に失敗しました: ${deleteError.message}` };
  }

  for (const entry of computedEntries) {
    const { data: workEntry, error: entryError } = await supabase
      .from("work_entries")
      .insert({
        daily_report_id: report.id,
        employee_id: user.id,
        client_id: entry.client_id,
        worksite_id: entry.worksite_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
        break_minutes: entry.break_minutes,
        work_hours: entry.work_hours,
        work_detail: entry.work_detail,
        sort_order: entry.sort_order,
      })
      .select("id")
      .single();

    if (entryError || !workEntry) {
      return { error: `保存に失敗しました: ${entryError?.message ?? "不明なエラー"}` };
    }

    if (entry.photoPaths.length > 0) {
      const { error: photoError } = await supabase.from("report_photos").insert(
        entry.photoPaths.map((path) => ({
          work_entry_id: workEntry.id,
          employee_id: user.id,
          storage_path: path,
        }))
      );
      if (photoError) {
        return { error: `写真の保存に失敗しました: ${photoError.message}` };
      }
    }
  }

  revalidatePath("/home");
  revalidatePath("/report");
  revalidatePath(`/report/${report.id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${report.id}`);

  return { reportId: report.id };
}

/**
 * その日を「休み」として保存する。既にその日の日報（下書き含む）があれば削除し、
 * employee_schedules に休みの例外を記録する。
 */
export async function markDayOffAction(reportDate: string): Promise<SaveReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return { error: "日付が不正です。" };
  }

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id, status")
    .eq("employee_id", user.id)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (existing?.status === "confirmed") {
    return {
      error: "この日報は管理者に確認済みのため変更できません。修正が必要な場合は管理者にご連絡ください。",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("daily_reports")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return { error: `保存に失敗しました: ${deleteError.message}` };
    }
  }

  const { error: scheduleError } = await supabase.from("employee_schedules").upsert(
    {
      employee_id: user.id,
      schedule_date: reportDate,
      status: "day_off",
      updated_by: user.id,
    },
    { onConflict: "employee_id,schedule_date" }
  );

  if (scheduleError) {
    return { error: `保存に失敗しました: ${scheduleError.message}` };
  }

  revalidatePath("/home");
  revalidatePath("/report");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");

  return {};
}
