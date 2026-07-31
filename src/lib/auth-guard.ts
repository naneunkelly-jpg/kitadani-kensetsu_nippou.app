import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action内で「本当に管理者か」をDBレベルで再確認するための関数。
 * proxy.ts（旧middleware）でも保護しているが、Server Actionは直接呼び出される
 * 可能性があるため、二重に確認する（多層防御）。
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です。");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new Error("管理者権限が必要です。");
  }

  return { supabase, userId: user.id };
}
