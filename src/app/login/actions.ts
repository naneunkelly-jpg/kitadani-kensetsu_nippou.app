"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { employeeCodeToEmail } from "@/lib/config";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const employeeCode = String(formData.get("employeeCode") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!employeeCode || !password) {
    return { error: "社員コードとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: employeeCodeToEmail(employeeCode),
    password,
  });

  if (error) {
    return { error: "社員コードまたはパスワードが正しくありません。" };
  }

  redirect("/");
}
