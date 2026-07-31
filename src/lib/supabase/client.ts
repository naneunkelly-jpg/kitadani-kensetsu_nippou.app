import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * ブラウザ（クライアントコンポーネント）から使うSupabaseクライアント。
 * anon keyのみを使用する。RLSにより本人のデータしか読み書きできない。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
