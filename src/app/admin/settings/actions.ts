"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
  success?: boolean;
};

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻の形式が不正です。");

const scheduleSchema = z.object({
  eveningReminderTime: timeSchema,
  morningReminderTime: timeSchema,
});

export async function updateNotificationScheduleAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, userId } = await requireAdmin();

  const parsed = scheduleSchema.safeParse({
    eveningReminderTime: formData.get("eveningReminderTime"),
    morningReminderTime: formData.get("morningReminderTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("notification_schedule")
    .update({
      evening_reminder_time: parsed.data.eveningReminderTime,
      morning_reminder_time: parsed.data.morningReminderTime,
      updated_by: userId,
    })
    .eq("id", true);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
