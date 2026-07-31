"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
};

const clientSchema = z.object({
  name: z.string().trim().min(1, "元請け先名を入力してください。"),
  note: z.string().trim().optional(),
});

export async function createClientAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("clients").insert({
    name: parsed.data.name,
    note: parsed.data.note ?? "",
  });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

const updateClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "元請け先名を入力してください。"),
  note: z.string().trim().optional(),
  isActive: z.union([z.literal("on"), z.undefined()]),
});

export async function updateClientAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateClientSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    note: formData.get("note"),
    isActive: formData.get("isActive") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      note: parsed.data.note ?? "",
      is_active: parsed.data.isActive === "on",
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${parsed.data.id}`);
  return {};
}
