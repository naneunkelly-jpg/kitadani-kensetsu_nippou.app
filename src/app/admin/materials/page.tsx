import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminMaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: materials }, { data: usages }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name, unit, note, is_active")
      .order("created_at", { ascending: true }),
    supabase
      .from("material_usages")
      .select(
        "id, used_date, quantity, note, materials(name, unit), worksites(name), profiles(full_name)"
      )
      .order("used_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">材料管理</h1>
          <Link
            href="/admin/materials/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 材料を追加
          </Link>
        </div>

        <div className="space-y-2">
          {(materials ?? []).map((m) => (
            <Link
              key={m.id}
              href={`/admin/materials/${m.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-foreground">
                  {m.name}
                  {m.unit && <span className="ml-2 text-xs text-muted">単位: {m.unit}</span>}
                </p>
                {m.note && <p className="text-sm text-muted">{m.note}</p>}
              </div>
              {!m.is_active && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                  無効
                </span>
              )}
            </Link>
          ))}
          {(materials ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              材料がまだ登録されていません。
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">直近の使用記録</h2>
          {(usages ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              まだ使用記録がありません。
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3">日付</th>
                    <th className="px-4 py-3">従業員</th>
                    <th className="px-4 py-3">現場</th>
                    <th className="px-4 py-3">材料</th>
                    <th className="px-4 py-3">数量</th>
                    <th className="px-4 py-3">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {(usages ?? []).map((u) => {
                    const material = Array.isArray(u.materials) ? u.materials[0] : u.materials;
                    const worksite = Array.isArray(u.worksites) ? u.worksites[0] : u.worksites;
                    const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="px-4 py-3">{u.used_date}</td>
                        <td className="px-4 py-3">{profile?.full_name ?? ""}</td>
                        <td className="px-4 py-3">{worksite?.name ?? ""}</td>
                        <td className="px-4 py-3">{material?.name ?? ""}</td>
                        <td className="px-4 py-3">
                          {u.quantity}
                          {material?.unit ?? ""}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-muted">{u.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
