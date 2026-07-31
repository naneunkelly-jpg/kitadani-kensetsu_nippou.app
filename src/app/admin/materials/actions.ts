"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
};

const materialSchema = z.object({
  name: z.string().trim().min(1, "材料名を入力してください。"),
  unit: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function createMaterialAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = materialSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("materials").insert({
    name: parsed.data.name,
    unit: parsed.data.unit ?? "",
    note: parsed.data.note ?? "",
  });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/materials");
  redirect("/admin/materials");
}

const updateMaterialSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "材料名を入力してください。"),
  unit: z.string().trim().optional(),
  note: z.string().trim().optional(),
  isActive: z.union([z.literal("on"), z.undefined()]),
});

export async function updateMaterialAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateMaterialSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    unit: formData.get("unit"),
    note: formData.get("note"),
    isActive: formData.get("isActive") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("materials")
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit ?? "",
      note: parsed.data.note ?? "",
      is_active: parsed.data.isActive === "on",
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/materials");
  revalidatePath(`/admin/materials/${parsed.data.id}`);
  return {};
}
