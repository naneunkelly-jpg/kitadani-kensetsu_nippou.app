import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { getTodayJstString } from "@/lib/date";
import { LeaveForm } from "./leave-form";
import { CancelLeaveButton } from "./cancel-leave-button";

export default async function LeavePage() {
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

  const todayStr = getTodayJstString();

  const { data: upcoming } = await supabase
    .from("employee_schedules")
    .select("schedule_date")
    .eq("employee_id", user.id)
    .eq("status", "day_off")
    .gte("schedule_date", todayStr)
    .order("schedule_date");

  return (
    <>
      <AppHeader
        userName={profile?.full_name ?? "従業員"}
        roleLabel={profile?.role === "admin" ? "管理者" : "従業員"}
        backHref={profile?.role === "admin" ? "/admin" : "/home"}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <h1 className="text-xl font-bold text-foreground">欠勤予定</h1>

          <LeaveForm />

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              登録済みの欠勤予定（{(upcoming ?? []).length}件）
            </h2>
            {(upcoming ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
                登録済みの欠勤予定はありません。
              </p>
            ) : (
              <div className="space-y-2">
                {(upcoming ?? []).map((row) => (
                  <div
                    key={row.schedule_date}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                  >
                    <p className="font-medium text-foreground">{row.schedule_date}</p>
                    <CancelLeaveButton date={row.schedule_date} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
