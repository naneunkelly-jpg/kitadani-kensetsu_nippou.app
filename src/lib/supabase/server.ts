import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * サーバーコンポーネント / Server Action / Route Handler から使うSupabaseクライアント。
 * anon keyを使用し、ユーザーのCookieセッションを引き継ぐ。
 * RLSはログインユーザー本人の権限で評価される。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合はCookie書き込み不可。
            // middlewareがセッション更新を行うため無視してよい。
          }
        },
      },
    }
  );
}
