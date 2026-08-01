import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { SelectDateForm } from "./select-date-form";

export default async function SelectReportDatePage() {
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

  const isAdmin = profile?.role === "admin";

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={isAdmin ? "管理者" : "従業員"}
        backHref={isAdmin ? "/admin" : "/home"}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <h1 className="text-xl font-bold text-foreground">過去の日報を提出する</h1>
          <p className="text-sm text-muted">
            提出し忘れていた日の日報を、日付を選んで書けます。すでに提出済みの日は選べません。
          </p>
          <SelectDateForm />
        </div>
      </main>
    </>
  );
}
