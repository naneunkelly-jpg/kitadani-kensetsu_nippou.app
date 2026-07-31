"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTodayJstString } from "@/lib/date";
import type { ScheduleStatus } from "@/lib/schedule";

export type ScheduleActionState = {
  error?: string;
};

export async function setMyScheduleAction(
  status: ScheduleStatus
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const today = getTodayJstString();

  const { error } = await supabase.from("employee_schedules").upsert(
    {
      employee_id: user.id,
      schedule_date: today,
      status,
      updated_by: user.id,
    },
    { onConflict: "employee_id,schedule_date" }
  );

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/home");
  return {};
}
