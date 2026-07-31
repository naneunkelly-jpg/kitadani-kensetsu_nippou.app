import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { WorksiteEditForm } from "./edit-form";

export default async function WorksiteDetailPage({
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

  const [{ data: item }, { data: clients }] = await Promise.all([
    supabase
      .from("worksites")
      .select("id, client_id, name, address, start_date, end_date, status, note")
      .eq("id", id)
      .single(),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (!item) notFound();

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">現場編集</h1>
          <Link href="/admin/worksites" className="text-sm text-accent">
            一覧に戻る
          </Link>
        </div>
        <WorksiteEditForm
          id={item.id}
          clients={clients ?? []}
          clientId={item.client_id}
          name={item.name}
          address={item.address}
          startDate={item.start_date}
          endDate={item.end_date}
          status={item.status}
          note={item.note}
        />
      </main>
    </>
  );
}
