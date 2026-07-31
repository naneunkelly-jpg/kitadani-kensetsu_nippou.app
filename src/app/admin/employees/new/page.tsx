import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { NewEmployeeForm } from "./new-employee-form";

export default async function NewEmployeePage() {
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
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground">従業員を追加</h1>
        <NewEmployeeForm />
      </main>
    </>
  );
}
