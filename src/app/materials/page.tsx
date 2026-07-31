import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { getTodayJstString } from "@/lib/date";
import { MaterialUsageForm } from "./usage-form";
import { DeleteMaterialUsageButton } from "./delete-usage-button";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const [{ data: materials }, { data: worksites }, { data: usages }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name, unit")
      .eq("is_active", true)
      .order("name"),
    supabase.from("worksites").select("id, name").order("name"),
    supabase
      .from("material_usages")
      .select("id, used_date, quantity, note, materials(name, unit), worksites(name)")
      .eq("employee_id", user.id)
      .order("used_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold text-foreground">材料の使用記録</h1>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">材料を使ったことを記録する</h2>
          <MaterialUsageForm
            materials={materials ?? []}
            worksites={worksites ?? []}
            today={getTodayJstString()}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">自分の最近の使用記録</h2>
          {(usages ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              まだ使用記録がありません。
            </p>
          ) : (
            <div className="space-y-2">
              {(usages ?? []).map((u) => {
                const material = Array.isArray(u.materials) ? u.materials[0] : u.materials;
                const worksite = Array.isArray(u.worksites) ? u.worksites[0] : u.worksites;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {material?.name ?? ""}　{u.quantity}
                        {material?.unit ?? ""}
                      </p>
                      <p className="text-xs text-muted">
                        {u.used_date} ・ {worksite?.name ?? ""}
                        {u.note && ` ・ ${u.note}`}
                      </p>
                    </div>
                    <DeleteMaterialUsageButton usageId={u.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
