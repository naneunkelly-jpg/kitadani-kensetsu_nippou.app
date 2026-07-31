import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminDashboardPage() {
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

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <>
      <AppHeader userName={profile?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-6">
        <p className="text-sm text-muted">{today}</p>
        <h1 className="text-xl font-bold text-foreground">本日の状況</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "出勤予定人数", value: "-" },
            { label: "休み人数", value: "-" },
            { label: "日報提出", value: "-" },
            { label: "提出率", value: "-" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted">
          ダッシュボードの実データ表示・未提出者一覧・現場状況・工具状況は
          Phase5で実装します。現時点では管理者としてログインできることの確認用画面です。
        </p>
      </main>
    </>
  );
}
