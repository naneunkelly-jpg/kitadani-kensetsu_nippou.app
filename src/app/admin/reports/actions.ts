"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { calcWorkHours } from "@/lib/work-hours";

export async function confirmReportAction(
  reportId: string
): Promise<{ error?: string }> {
  const { supabase, userId } = await requireAdmin();

  const { error } = await supabase
    .from("daily_reports")
    .update({ status: "confirmed", confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
  return {};
}

export async function bulkConfirmReportsAction(
  reportIds: string[]
): Promise<{ error?: string; count?: number }> {
  const { supabase, userId } = await requireAdmin();

  if (reportIds.length === 0) {
    return { error: "対象が選択されていません。" };
  }

  // 提出済み（submitted）のものだけを確認済みにする。下書きや既に確認済みのものは対象外。
  const { data, error } = await supabase
    .from("daily_reports")
    .update({ status: "confirmed", confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .in("id", reportIds)
    .eq("status", "submitted")
    .select("id");

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/reports");

  return { count: data?.length ?? 0 };
}

// ------------------------------------------------------------
// 管理者による日報の修正。従業員から「確認済みの日報を直してほしい」と
// 依頼があった場合を想定し、ステータスに関わらず管理者だけが修正できる。
// ------------------------------------------------------------
type AdminUpdateEntryInput = {
  clientId: string;
  worksiteId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

export async function adminUpdateReportAction(input: {
  reportId: string;
  remarks: string;
  entries: AdminUpdateEntryInput[];
}): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();

  if (input.entries.length === 0) {
    return { error: "現場を1件以上入力してください。" };
  }

  const { data: report } = await supabase
    .from("daily_reports")
    .select("id, employee_id")
    .eq("id", input.reportId)
    .single();

  if (!report) {
    return { error: "日報が見つかりません。" };
  }

  const computedEntries: (AdminUpdateEntryInput & { workHours: number; sortOrder: number })[] = [];

  for (let i = 0; i < input.entries.length; i++) {
    const e = input.entries[i];
    const workHours = calcWorkHours(e.startTime, e.endTime, e.breakMinutes);
    if (workHours === null) {
      return {
        error: `${i + 1}件目の現場: 終了時間は開始時間より後にし、休憩時間を差し引いて実働時間が0より大きくなるようにしてください。`,
      };
    }
    computedEntries.push({ ...e, workHours, sortOrder: i });
  }

  const { error: remarksError } = await supabase
    .from("daily_reports")
    .update({ remarks: input.remarks })
    .eq("id", input.reportId);

  if (remarksError) {
    return { error: `保存に失敗しました: ${remarksError.message}` };
  }

  const { error: deleteError } = await supabase
    .from("work_entries")
    .delete()
    .eq("daily_report_id", input.reportId);

  if (deleteError) {
    return { error: `保存に失敗しました: ${deleteError.message}` };
  }

  for (const entry of computedEntries) {
    const { error: insertError } = await supabase.from("work_entries").insert({
      daily_report_id: input.reportId,
      employee_id: report.employee_id,
      client_id: entry.clientId,
      worksite_id: entry.worksiteId,
      start_time: entry.startTime,
      end_time: entry.endTime,
      break_minutes: entry.breakMinutes,
      work_hours: entry.workHours,
      work_detail: "",
      sort_order: entry.sortOrder,
    });

    if (insertError) {
      return { error: `保存に失敗しました: ${insertError.message}` };
    }
  }

  revalidatePath(`/admin/reports/${input.reportId}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/summary");

  return {};
}
