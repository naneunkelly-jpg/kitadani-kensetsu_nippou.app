"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
  info?: string;
};

const singleSchema = z.object({
  date: z.string().min(1, "日付を入力してください。"),
  name: z.string().trim().min(1, "名称を入力してください。"),
  note: z.string().trim().optional(),
});

export async function addHolidayAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = singleSchema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("company_holidays").insert({
    holiday_date: parsed.data.date,
    name: parsed.data.name,
    note: parsed.data.note ?? "",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "その日付は既に会社公休日として登録されています。" };
    }
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/holidays");
  return { info: "登録しました。" };
}

const rangeSchema = z
  .object({
    startDate: z.string().min(1, "開始日を入力してください。"),
    endDate: z.string().min(1, "終了日を入力してください。"),
    name: z.string().trim().min(1, "名称を入力してください。"),
    note: z.string().trim().optional(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "終了日は開始日以降にしてください。",
    path: ["endDate"],
  });

export async function addHolidayRangeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = rangeSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    name: formData.get("name"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { startDate, endDate, name, note } = parsed.data;

  // 日数が多すぎる誤操作を防ぐ（1年分まで）
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (diffDays > 366) {
    return { error: "一度に登録できるのは366日分までです。" };
  }

  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  // 既存日付を確認し、重複はスキップする
  const { data: existing } = await supabase
    .from("company_holidays")
    .select("holiday_date")
    .gte("holiday_date", startDate)
    .lte("holiday_date", endDate);

  const existingSet = new Set((existing ?? []).map((r) => r.holiday_date));
  const toInsert = dates
    .filter((d) => !existingSet.has(d))
    .map((d) => ({ holiday_date: d, name, note: note ?? "" }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("company_holidays").insert(toInsert);
    if (error) {
      return { error: `登録に失敗しました: ${error.message}` };
    }
  }

  revalidatePath("/admin/holidays");

  const skipped = dates.length - toInsert.length;
  return {
    info:
      skipped > 0
        ? `${toInsert.length}件登録しました（${skipped}件は既に登録済みのためスキップしました）。`
        : `${toInsert.length}件登録しました。`,
  };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "名称を入力してください。"),
  note: z.string().trim().optional(),
});

export async function updateHolidayAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("company_holidays")
    .update({ name: parsed.data.name, note: parsed.data.note ?? "" })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/holidays");
  return { info: "更新しました。" };
}

export async function deleteHolidayAction(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("company_holidays").delete().eq("id", id);
  revalidatePath("/admin/holidays");
}
