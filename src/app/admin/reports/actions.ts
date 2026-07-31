"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";

export async function confirmReportAction(
  reportId: string
): Promise<{ error?: string }> {
  const { supabase, userId } = await requireAdmin();

  const { error } = await supabase
    .from("daily_reports")
    .update({ status: "confirmed", confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
  return {};
}
