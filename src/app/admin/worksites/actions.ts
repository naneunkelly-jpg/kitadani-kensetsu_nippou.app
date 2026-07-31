"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export type FormState = {
  error?: string;
};

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const worksiteSchema = z.object({
  clientId: z.string().uuid("元請け先を選択してください。"),
  name: z.string().trim().min(1, "現場名を入力してください。"),
  address: z.string().trim().optional(),
  startDate: z.preprocess(emptyToUndefined, z.string().optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(["before_start", "in_progress", "completed", "on_hold"]),
  note: z.string().trim().optional(),
});

export async function createWorksiteAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = worksiteSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    address: formData.get("address"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase.from("worksites").insert({
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    address: parsed.data.address ?? "",
    start_date: parsed.data.startDate ?? null,
    end_date: parsed.data.endDate ?? null,
    status: parsed.data.status,
    note: parsed.data.note ?? "",
  });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/worksites");
  redirect("/admin/worksites");
}

const updateWorksiteSchema = worksiteSchema.extend({
  id: z.string().uuid(),
});

export async function updateWorksiteAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = updateWorksiteSchema.safeParse({
    id: formData.get("id"),
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    address: formData.get("address"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { error } = await supabase
    .from("worksites")
    .update({
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      address: parsed.data.address ?? "",
      start_date: parsed.data.startDate ?? null,
      end_date: parsed.data.endDate ?? null,
      status: parsed.data.status,
      note: parsed.data.note ?? "",
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/worksites");
  revalidatePath(`/admin/worksites/${parsed.data.id}`);
  return {};
}
