import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service Role Key を使う管理者専用クライアント。
 * 【重要】このファイルはサーバー専用コード（Route Handler / Server Action）からのみ呼び出すこと。
 * クライアントコンポーネントや、クライアントに送られるコードから絶対に import しないこと。
 * 従業員アカウントの作成など、管理者操作にのみ使用する。
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
