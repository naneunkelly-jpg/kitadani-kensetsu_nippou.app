import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { CheckoutToolsForm } from "./checkout-form";
import { ReturnToolButton } from "./return-button";

export default async function ToolsPage() {
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

  const [{ data: tools }, { data: openCheckouts }] = await Promise.all([
    supabase
      .from("tools")
      .select("id, name, management_no")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("tool_checkouts")
      .select("id, tool_id, employee_id, checked_out_at, note, tools(name, management_no), profiles(full_name)")
      .is("returned_at", null)
      .order("checked_out_at"),
  ]);

  const takenToolIds = new Set((openCheckouts ?? []).map((c) => c.tool_id));
  const availableTools = (tools ?? [])
    .filter((t) => !takenToolIds.has(t.id))
    .map((t) => ({ id: t.id, name: t.name, managementNo: t.management_no }));

  const myOpen = (openCheckouts ?? []).filter((c) => c.employee_id === user.id);
  const othersOpen = (openCheckouts ?? []).filter((c) => c.employee_id !== user.id);

  function toolLabel(c: (typeof myOpen)[number]) {
    const tool = Array.isArray(c.tools) ? c.tools[0] : c.tools;
    return tool?.management_no ? `${tool?.name} #${tool.management_no}` : (tool?.name ?? "");
  }

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
        backHref={profile?.role === "admin" ? "/admin" : "/home"}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-xl font-bold text-foreground">工具の持ち出し・返却</h1>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            持ち出し中の工具（{myOpen.length}件）
          </h2>
          {myOpen.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              現在持ち出している工具はありません。
            </p>
          ) : (
            <div className="space-y-2">
              {myOpen.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{toolLabel(c)}</p>
                    <p className="text-xs text-muted">
                      {new Date(c.checked_out_at).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                      から持ち出し中
                      {c.note && ` ・ ${c.note}`}
                    </p>
                  </div>
                  <ReturnToolButton checkoutId={c.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">工具を持ち出す</h2>
          <CheckoutToolsForm tools={availableTools} />
        </div>

        {othersOpen.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">他の人が持ち出し中</h2>
            <ul className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
              {othersOpen.map((c) => {
                const profileRow = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                return (
                  <li key={c.id}>
                    {toolLabel(c)} — {profileRow?.full_name ?? ""}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
