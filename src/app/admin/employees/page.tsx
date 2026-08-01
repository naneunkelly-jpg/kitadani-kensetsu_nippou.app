import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, employee_code, role, is_active")
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">従業員管理</h1>
          <Link
            href="/admin/employees/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            ＋ 従業員を追加
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">氏名</th>
                <th className="whitespace-nowrap px-4 py-3">社員コード</th>
                <th className="whitespace-nowrap px-4 py-3">権限</th>
                <th className="whitespace-nowrap px-4 py-3">在籍状態</th>
              </tr>
            </thead>
            <tbody>
              {(employees ?? []).map((emp) => (
                <tr key={emp.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {emp.full_name || "(未設定)"}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{emp.employee_code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {emp.role === "admin" ? "管理者" : "従業員"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {emp.is_active ? (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                        在籍中
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                        無効化
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(employees ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    従業員がまだいません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
