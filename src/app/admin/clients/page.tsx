import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, note, is_active")
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">元請け先管理</h1>
          <Link
            href="/admin/clients/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 元請け先を追加
          </Link>
        </div>

        <div className="space-y-2">
          {(clients ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                {c.note && <p className="text-sm text-muted">{c.note}</p>}
              </div>
              {c.is_active ? (
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                  有効
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                  無効
                </span>
              )}
            </Link>
          ))}
          {(clients ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              元請け先がまだ登録されていません。
            </p>
          )}
        </div>
      </main>
    </>
  );
}
