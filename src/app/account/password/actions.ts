"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  success?: boolean;
};

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください。"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください。"),
  confirmPassword: z.string().min(1, "確認用のパスワードを入力してください。"),
});

export async function changeMyPasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "ログインが必要です。" };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "新しいパスワードと確認用パスワードが一致しません。" };
  }

  // 本人確認のため、現在のパスワードで再ログインできることを確認してから変更する。
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return { error: "現在のパスワードが正しくありません。" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return { error: `パスワードの変更に失敗しました: ${updateError.message}` };
  }

  return { success: true };
}
