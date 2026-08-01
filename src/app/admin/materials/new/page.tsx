import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { NewMaterialForm } from "./material-form";

export default async function NewMaterialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" backHref="/admin/materials" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <h1 className="text-xl font-bold text-foreground">材料を追加</h1>
          <NewMaterialForm />
        </div>
      </main>
    </>
  );
}
