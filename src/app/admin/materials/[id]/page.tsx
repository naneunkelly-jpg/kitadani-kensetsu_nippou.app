import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";
import { MaterialEditForm } from "./edit-form";

export default async function MaterialDetailPage({
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
    .from("materials")
    .select("id, name, unit, note, is_active")
    .eq("id", id)
    .single();

  if (!item) notFound();

  return (
    <>
      <AppHeader userName={me?.full_name ?? "管理者"} roleLabel="管理者" />
      <AdminNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">材料編集</h1>
          <Link href="/admin/materials" className="text-sm text-accent">
            一覧に戻る
          </Link>
        </div>
        <MaterialEditForm
          id={item.id}
          name={item.name}
          unit={item.unit}
          note={item.note}
          isActive={item.is_active}
        />
      </main>
    </>
  );
}
