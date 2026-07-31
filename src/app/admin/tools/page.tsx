import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: tools }, { data: openCheckouts }] = await Promise.all([
    supabase
      .from("tools")
      .select("id, name, management_no, note, is_active")
      .order("created_at", { ascending: true }),
    supabase
      .from("tool_checkouts")
      .select("tool_id, checked_out_at, profiles(full_name)")
      .is("returned_at", null),
  ]);

  const checkoutByToolId = new Map(
    (openCheckouts ?? []).map((c) => {
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return [c.tool_id, { name: profile?.full_name ?? "", checkedOutAt: c.checked_out_at }];
    })
  );

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">工具管理</h1>
          <Link
            href="/admin/tools/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 工具を追加
          </Link>
        </div>

        {(openCheckouts ?? []).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              現在の持ち出し状況（{(openCheckouts ?? []).length}件）
            </h2>
            <ul className="space-y-1 text-sm text-muted">
              {(openCheckouts ?? []).map((c, i) => {
                const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                const tool = (tools ?? []).find((t) => t.id === c.tool_id);
                return (
                  <li key={i}>
                    {tool?.name ?? ""} — {profile?.full_name ?? ""}
                    （
                    {new Date(c.checked_out_at).toLocaleDateString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                    })}
                    から）
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          {(tools ?? []).map((t) => {
            const checkout = checkoutByToolId.get(t.id);
            return (
              <Link
                key={t.id}
                href={`/admin/tools/${t.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {t.name}
                    {t.management_no && (
                      <span className="ml-2 text-xs text-muted">#{t.management_no}</span>
                    )}
                  </p>
                  {t.note && <p className="text-sm text-muted">{t.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {checkout ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {checkout.name} 持ち出し中
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                      在庫あり
                    </span>
                  )}
                  {!t.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                      無効
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {(tools ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              工具がまだ登録されていません。
            </p>
          )}
        </div>
      </main>
    </>
  );
}
