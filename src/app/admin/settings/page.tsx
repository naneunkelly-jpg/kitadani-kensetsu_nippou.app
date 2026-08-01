import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { NotificationScheduleForm } from "./schedule-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: schedule } = await supabase
    .from("notification_schedule")
    .select(
      "evening_reminder_time, morning_reminder_time, last_evening_sent_date, last_morning_sent_date"
    )
    .eq("id", true)
    .single();

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <h1 className="text-xl font-bold text-foreground">通知設定</h1>

          <NotificationScheduleForm
            eveningReminderTime={schedule?.evening_reminder_time ?? "18:00"}
            morningReminderTime={schedule?.morning_reminder_time ?? "06:00"}
          />

          <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted">
            <p>
              直近の当日分リマインド送信日:{" "}
              {schedule?.last_evening_sent_date ?? "まだ送信されていません"}
            </p>
            <p className="mt-1">
              直近の前日分未提出通知送信日:{" "}
              {schedule?.last_morning_sent_date ?? "まだ送信されていません"}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
