import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { MaterialRow } from "./material-row";
import { DeleteStockEntryButton } from "./delete-stock-entry-button";
import Link from "next/link";

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

  const [{ data: materials }, { data: usages }, { data: stockSummary }, { data: stockEntries }] =
    await Promise.all([
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
      supabase.from("material_stock_summary").select("material_id, stock"),
      supabase
        .from("material_stock_entries")
        .select("id, entry_date, quantity, note, materials(name, unit), profiles(full_name)")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const stockByMaterialId = new Map(
    (stockSummary ?? []).map((s) => [s.material_id, s.stock])
  );

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
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
            <MaterialRow
              key={m.id}
              material={{
                id: m.id,
                name: m.name,
                unit: m.unit,
                note: m.note,
                isActive: m.is_active,
                stock: stockByMaterialId.get(m.id) ?? 0,
              }}
            />
          ))}
          {(materials ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              材料がまだ登録されていません。
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">直近の入荷記録</h2>
          {(stockEntries ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              まだ入荷記録がありません。
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-24" />
                  <col />
                  <col className="w-24" />
                </colgroup>
                <thead className="bg-gray-50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3">日付</th>
                    <th className="px-4 py-3">登録者</th>
                    <th className="px-4 py-3">現場</th>
                    <th className="px-4 py-3">材料</th>
                    <th className="px-4 py-3">数量</th>
                    <th className="px-4 py-3">備考</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(stockEntries ?? []).map((s) => {
                    const material = Array.isArray(s.materials) ? s.materials[0] : s.materials;
                    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
                    return (
                      <tr key={s.id} className="border-t border-border">
                        <td className="px-4 py-3">{s.entry_date}</td>
                        <td className="px-4 py-3 text-muted">{profile?.full_name ?? ""}</td>
                        <td className="px-4 py-3 text-muted">－</td>
                        <td className="truncate px-4 py-3">{material?.name ?? ""}</td>
                        <td className="px-4 py-3">
                          {s.quantity}
                          {material?.unit ?? ""}
                        </td>
                        <td className="truncate px-4 py-3 text-muted">{s.note}</td>
                        <td className="px-4 py-3">
                          <DeleteStockEntryButton id={s.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-24" />
                  <col />
                  <col className="w-24" />
                </colgroup>
                <thead className="bg-gray-50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3">日付</th>
                    <th className="px-4 py-3">従業員</th>
                    <th className="px-4 py-3">現場</th>
                    <th className="px-4 py-3">材料</th>
                    <th className="px-4 py-3">数量</th>
                    <th className="px-4 py-3">備考</th>
                    <th className="px-4 py-3"></th>
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
                        <td className="truncate px-4 py-3">{worksite?.name ?? ""}</td>
                        <td className="truncate px-4 py-3">{material?.name ?? ""}</td>
                        <td className="px-4 py-3">
                          {u.quantity}
                          {material?.unit ?? ""}
                        </td>
                        <td className="truncate px-4 py-3 text-muted">{u.note}</td>
                        <td className="px-4 py-3"></td>
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
