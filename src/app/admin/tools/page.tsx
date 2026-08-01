import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { ToolGroupList, type ToolGroup } from "./tool-group-list";

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
      .select("id, name, management_no, note, is_active, created_at")
      .order("management_no", { ascending: true }),
    supabase
      .from("tool_checkouts")
      .select("tool_id, checked_out_at, profiles(full_name)")
      .is("returned_at", null),
  ]);

  const checkoutByToolId = new Map(
    (openCheckouts ?? []).map((c) => {
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return [c.tool_id, { employeeName: profile?.full_name ?? "", checkedOutAt: c.checked_out_at }];
    })
  );

  // 同じ名前の工具（号機違い）を1グループにまとめる。
  // 追加順ではなく工具名の五十音順で並べることで、種類が増えても管理しやすくする。
  const groupMap = new Map<string, ToolGroup>();
  for (const t of tools ?? []) {
    const group: ToolGroup = groupMap.get(t.name) ?? { name: t.name, units: [] };
    group.units.push({
      id: t.id,
      managementNo: t.management_no,
      note: t.note,
      isActive: t.is_active,
      checkout: checkoutByToolId.get(t.id) ?? null,
    });
    groupMap.set(t.name, group);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ja")
  );

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">工具管理</h1>
          <Link
            href="/admin/tools/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 新しい工具を追加
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
                    {tool?.name ?? ""}
                    {tool?.management_no && ` #${tool.management_no}`} — {profile?.full_name ?? ""}
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

        <ToolGroupList groups={groups} />

        {groups.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
            工具がまだ登録されていません。
          </p>
        )}
      </main>
    </>
  );
}
