"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayJstString } from "@/lib/date";

export type SelectDateState = {
  error?: string;
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を選択してください。");

export async function goToReportForDateAction(
  _prevState: SelectDateState,
  formData: FormData
): Promise<SelectDateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const parsed = dateSchema.safeParse(formData.get("date"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "日付を選択してください。" };
  }

  const date = parsed.data;
  const today = getTodayJstString();
  if (date > today) {
    return { error: "未来の日付は選択できません。" };
  }

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("status")
    .eq("employee_id", user.id)
    .eq("report_date", date)
    .maybeSingle();

  if (existing && (existing.status === "submitted" || existing.status === "confirmed")) {
    return {
      error: `${date}の日報はすでに提出済みです。内容を確認・修正したい場合は「過去の日報」一覧から開いてください。`,
    };
  }

  redirect(`/report/new?date=${date}`);
}
