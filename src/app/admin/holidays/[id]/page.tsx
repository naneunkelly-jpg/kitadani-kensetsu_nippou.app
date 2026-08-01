import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { HolidayEditForm } from "./edit-form";

export default async function HolidayDetailPage({
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

  const { data: item } = await supabase
    .from("company_holidays")
    .select("id, holiday_date, name, note")
    .eq("id", id)
    .single();

  if (!item) notFound();

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" backHref="/admin/holidays" />
      <AdminNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">会社公休日編集</h1>
            <Link href="/admin/holidays" className="text-sm text-accent">
              一覧に戻る
            </Link>
          </div>
          <p className="text-sm text-muted">日付: {item.holiday_date}</p>
          <HolidayEditForm id={item.id} name={item.name} note={item.note} />
        </div>
      </main>
    </>
  );
}
