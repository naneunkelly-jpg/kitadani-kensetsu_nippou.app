import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { NewWorksiteForm } from "./worksite-form";

export default async function NewWorksitePage() {
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
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground">現場を追加</h1>
        {(clients ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
            先に元請け先を登録してください。
          </p>
        ) : (
          <NewWorksiteForm clients={clients ?? []} />
        )}
      </main>
    </>
  );
}
