import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { SelfServicePanel } from "@/components/self-service-panel";

export default async function AdminSelfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  return (
    <>
      <AppHeader userName={profile?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <p className="text-sm text-muted">{today}</p>
          <SelfServicePanel userId={user.id} />
        </div>
      </main>
    </>
  );
}
