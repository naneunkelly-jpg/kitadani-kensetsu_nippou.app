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

  const parsed = dateSchema.safeParse(formData.get("date"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "日付を入力してください。" };
  }

  const date = parsed.data;
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

  if (existing) {
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
      status: "day_off",
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
    .eq("status", "day_off");

  if (error) {
    return { error: `取り消しに失敗しました: ${error.message}` };
  }

  revalidatePath("/home");
  revalidatePath("/leave");
  revalidatePath("/admin/holidays");
  revalidatePath("/admin");

  return {};
}
