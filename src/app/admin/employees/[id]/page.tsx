import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { EmployeeEditForm, PasswordResetForm } from "./edit-form";
import { AdminScheduleToggle } from "./schedule-toggle-admin";
import { getTodayJstString } from "@/lib/date";
import { effectiveScheduleStatus } from "@/lib/schedule";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: employee } = await supabase
    .from("profiles")
    .select("id, full_name, employee_code, role, is_active")
    .eq("id", id)
    .single();

  if (!employee) {
    notFound();
  }

  const todayStr = getTodayJstString();
  const { data: scheduleOverride } = await supabase
    .from("employee_schedules")
    .select("status")
    .eq("employee_id", id)
    .eq("schedule_date", todayStr)
    .maybeSingle();

  const status = effectiveScheduleStatus(todayStr, scheduleOverride?.status);

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">従業員編集</h1>
          <Link href="/admin/employees" className="text-sm text-accent">
            一覧に戻る
          </Link>
        </div>
        <p className="text-sm text-muted">社員コード: {employee.employee_code}</p>

        <EmployeeEditForm
          employeeId={employee.id}
          fullName={employee.full_name}
          isActive={employee.is_active}
          isAdmin={employee.role === "admin"}
        />

        <AdminScheduleToggle employeeId={employee.id} initialStatus={status} />

        <PasswordResetForm employeeId={employee.id} />
      </main>
    </>
  );
}
