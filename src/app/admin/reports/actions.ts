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

export async function bulkConfirmReportsAction(
  reportIds: string[]
): Promise<{ error?: string; count?: number }> {
  const { supabase, userId } = await requireAdmin();

  if (reportIds.length === 0) {
    return { error: "対象が選択されていません。" };
  }

  // 提出済み（submitted）のものだけを確認済みにする。下書きや既に確認済みのものは対象外。
  const { data, error } = await supabase
    .from("daily_reports")
    .update({ status: "confirmed", confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .in("id", reportIds)
    .eq("status", "submitted")
    .select("id");

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/reports");

  return { count: data?.length ?? 0 };
}
