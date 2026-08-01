"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTodayJstString } from "@/lib/date";

export type LeaveActionState = {
  error?: string;
  success?: boolean;
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください。");
const periodSchema = z.enum(["day_off", "day_off_am", "day_off_pm"]);

export async function registerLeaveAction(
  _prevState: LeaveActionState,
  formData: FormData
): Promise<LeaveActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const parsedDate = dateSchema.safeParse(formData.get("date"));
  if (!parsedDate.success) {
    return { error: parsedDate.error.issues[0]?.message ?? "日付を入力してください。" };
  }
  const parsedPeriod = periodSchema.safeParse(formData.get("period") || "day_off");
  if (!parsedPeriod.success) {
    return { error: "休みの種類を確認してください。" };
  }

  const date = parsedDate.data;
  const status = parsedPeriod.data;
  const today = getTodayJstString();
  if (date < today) {
    return { error: "過去の日付は登録できません。" };
  }

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id, status")
    .eq("employee_id", user.id)
    .eq("report_date", date)
    .maybeSingle();

  if (existing?.status === "confirmed") {
    return {
      error: "この日はすでに管理者確認済みの日報があるため登録できません。",
    };
  }

  // 終日休みの場合、その日の日報（下書き含む）は不要になるため削除する。
  // 半休（午前休・午後休）は残り半分を働くため、既存の日報は残す。
  if (existing && status === "day_off") {
    const { error: deleteError } = await supabase
      .from("daily_reports")
      .delete()
      .eq("id", existing.id);
    if (deleteError) {
      return { error: `登録に失敗しました: ${deleteError.message}` };
    }
  }

  const { error } = await supabase.from("employee_schedules").upsert(
    {
      employee_id: user.id,
      schedule_date: date,
      status,
      updated_by: user.id,
    },
    { onConflict: "employee_id,schedule_date" }
  );

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/home");
  revalidatePath("/leave");
  revalidatePath("/admin/holidays");
  revalidatePath("/admin");

  return { success: true };
}

export async function cancelLeaveAction(date: string): Promise<LeaveActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("employee_schedules")
    .delete()
    .eq("employee_id", user.id)
    .eq("schedule_date", date)
    .in("status", ["day_off", "day_off_am", "day_off_pm"]);

  if (error) {
    return { error: `取り消しに失敗しました: ${error.message}` };
  }

  revalidatePath("/home");
  revalidatePath("/leave");
  revalidatePath("/admin/holidays");
  revalidatePath("/admin");

  return {};
}
