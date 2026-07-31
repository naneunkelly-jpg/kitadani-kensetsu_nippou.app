"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
};

const toolSchema = z.object({
  name: z.string().trim().min(1, "工具名を入力してください。"),
  managementNo: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function createToolAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = toolSchema.safeParse({
    name: formData.get("name"),
    managementNo: formData.get("managementNo"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("tools").insert({
    name: parsed.data.name,
    management_no: parsed.data.managementNo ?? "",
    note: parsed.data.note ?? "",
  });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

const updateToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "工具名を入力してください。"),
  managementNo: z.string().trim().optional(),
  note: z.string().trim().optional(),
  isActive: z.union([z.literal("on"), z.undefined()]),
});

export async function updateToolAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateToolSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    managementNo: formData.get("managementNo"),
    note: formData.get("note"),
    isActive: formData.get("isActive") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("tools")
    .update({
      name: parsed.data.name,
      management_no: parsed.data.managementNo ?? "",
      note: parsed.data.note ?? "",
      is_active: parsed.data.isActive === "on",
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/tools");
  revalidatePath(`/admin/tools/${parsed.data.id}`);
  return {};
}
