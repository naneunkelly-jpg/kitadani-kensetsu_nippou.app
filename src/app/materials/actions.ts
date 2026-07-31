"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTodayJstString } from "@/lib/date";

export type MaterialActionState = {
  error?: string;
};

const usageSchema = z.object({
  materialId: z.string().uuid("材料を選択してください。"),
  worksiteId: z.string().uuid("現場を選択してください。"),
  usedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください。"),
  quantity: z.coerce.number().positive("数量は0より大きい値を入力してください。"),
  note: z.string().trim().optional(),
});

export async function recordMaterialUsageAction(
  _prevState: MaterialActionState,
  formData: FormData
): Promise<MaterialActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const parsed = usageSchema.safeParse({
    materialId: formData.get("materialId"),
    worksiteId: formData.get("worksiteId"),
    usedDate: formData.get("usedDate") || getTodayJstString(),
    quantity: formData.get("quantity"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("material_usages").insert({
    material_id: parsed.data.materialId,
    employee_id: user.id,
    worksite_id: parsed.data.worksiteId,
    used_date: parsed.data.usedDate,
    quantity: parsed.data.quantity,
    note: parsed.data.note ?? "",
  });

  if (error) {
    return { error: `記録に失敗しました: ${error.message}` };
  }

  revalidatePath("/materials");
  revalidatePath("/admin/materials");
  return {};
}

export async function deleteMaterialUsageAction(
  usageId: string
): Promise<MaterialActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("material_usages")
    .delete()
    .eq("id", usageId)
    .eq("employee_id", user.id);

  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/materials");
  revalidatePath("/admin/materials");
  return {};
}
