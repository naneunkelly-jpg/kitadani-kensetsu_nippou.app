"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { employeeCodeToEmail } from "@/lib/config";

export type FormState = {
  error?: string;
  success?: boolean;
};

const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, "氏名を入力してください。"),
  employeeCode: z
    .string()
    .trim()
    .min(1, "社員コードを入力してください。")
    .regex(/^[a-zA-Z0-9_-]+$/, "社員コードは半角英数字で入力してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
  isAdmin: z.union([z.literal("on"), z.undefined()]),
});

export async function createEmployeeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = createEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    employeeCode: formData.get("employeeCode"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { fullName, employeeCode, password, isAdmin } = parsed.data;
  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.createUser({
    email: employeeCodeToEmail(employeeCode),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      employee_code: employeeCode,
      role: isAdmin === "on" ? "admin" : "employee",
    },
  });

  if (error) {
    if (error.message.includes("already been registered") || error.code === "email_exists") {
      return { error: "この社員コードは既に使われています。別のコードを入力してください。" };
    }
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

const updateEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  fullName: z.string().trim().min(1, "氏名を入力してください。"),
  isActive: z.union([z.literal("on"), z.undefined()]),
  isAdmin: z.union([z.literal("on"), z.undefined()]),
});

export async function updateEmployeeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateEmployeeSchema.safeParse({
    employeeId: formData.get("employeeId"),
    fullName: formData.get("fullName"),
    isActive: formData.get("isActive") ?? undefined,
    isAdmin: formData.get("isAdmin") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { employeeId, fullName, isActive, isAdmin } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      is_active: isActive === "on",
      role: isAdmin === "on" ? "admin" : "employee",
    })
    .eq("id", employeeId);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);
  return { success: true };
}

const resetPasswordSchema = z.object({
  employeeId: z.string().uuid(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});

export async function resetEmployeePasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    employeeId: formData.get("employeeId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(parsed.data.employeeId, {
    password: parsed.data.password,
  });

  if (error) {
    return { error: `パスワードの再設定に失敗しました: ${error.message}` };
  }

  return { success: true };
}

// ------------------------------------------------------------
// 勤務状態（管理者が代理で当日分を変更する）
// ------------------------------------------------------------
import { getTodayJstString } from "@/lib/date";
import type { ScheduleStatus } from "@/lib/schedule";

export async function setEmployeeScheduleAction(
  employeeId: string,
  status: ScheduleStatus
): Promise<{ error?: string }> {
  const { supabase, userId } = await requireAdmin();
  const today = getTodayJstString();

  const { error } = await supabase.from("employee_schedules").upsert(
    {
      employee_id: employeeId,
      schedule_date: today,
      status,
      updated_by: userId,
    },
    { onConflict: "employee_id,schedule_date" }
  );

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/employees/${employeeId}`);
  return {};
}
