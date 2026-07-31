import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { WORKSITE_STATUS_LABELS } from "@/lib/worksite-status";

export default async function WorksitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: worksites } = await supabase
    .from("worksites")
    .select("id, name, status, client_id, clients(id, name)")
    .order("created_at", { ascending: true });

  const grouped = new Map<
    string,
    { clientName: string; sites: { id: string; name: string; status: string }[] }
  >();

  for (const site of worksites ?? []) {
    const client = Array.isArray(site.clients) ? site.clients[0] : site.clients;
    const clientId = site.client_id;
    const clientName = client?.name ?? "(不明な元請け先)";
    if (!grouped.has(clientId)) {
      grouped.set(clientId, { clientName, sites: [] });
    }
    grouped.get(clientId)!.sites.push({ id: site.id, name: site.name, status: site.status });
  }

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">現場管理</h1>
          <Link
            href="/admin/worksites/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 現場を追加
          </Link>
        </div>

        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([clientId, group]) => (
            <div key={clientId} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">{group.clientName}</p>
              <div className="mt-2 space-y-1">
                {group.sites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/admin/worksites/${site.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 pl-6 hover:bg-gray-50"
                  >
                    <span className="text-foreground">└ {site.name}</span>
                    <span className="text-xs text-muted">
                      {WORKSITE_STATUS_LABELS[site.status] ?? site.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {grouped.size === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              現場がまだ登録されていません。
            </p>
          )}
        </div>
      </main>
    </>
  );
}
