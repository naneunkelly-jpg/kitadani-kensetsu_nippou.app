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

export async function deleteToolAction(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();

  // 現在誰かが持ち出し中（未返却）の工具は削除できないようにする。
  const { count: openCount } = await supabase
    .from("tool_checkouts")
    .select("id", { count: "exact", head: true })
    .eq("tool_id", id)
    .is("returned_at", null);

  if ((openCount ?? 0) > 0) {
    return {
      error: "現在持ち出し中の工具は削除できません。返却されてから削除してください。",
    };
  }

  // 過去の持ち出し履歴（返却済み）はFK制約があるため、工具本体より先に削除する。
  const { error: checkoutDeleteError } = await supabase
    .from("tool_checkouts")
    .delete()
    .eq("tool_id", id);

  if (checkoutDeleteError) {
    return { error: `削除に失敗しました: ${checkoutDeleteError.message}` };
  }

  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/tools");
  return {};
}
