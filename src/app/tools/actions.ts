"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToolActionState = {
  error?: string;
};

export async function checkoutToolsAction(
  _prevState: ToolActionState,
  formData: FormData
): Promise<ToolActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const toolIds = formData.getAll("toolIds").filter((v): v is string => typeof v === "string");
  if (toolIds.length === 0) {
    return { error: "持ち出す工具を1つ以上選択してください。" };
  }

  const note = formData.get("note");

  const { error } = await supabase.from("tool_checkouts").insert(
    toolIds.map((toolId) => ({
      tool_id: toolId,
      employee_id: user.id,
      note: typeof note === "string" ? note.trim() : "",
    }))
  );

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "選択した工具の一部はすでに他の人が持ち出し中です。画面を更新してもう一度お試しください。",
      };
    }
    return { error: `持ち出し登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/tools");
  revalidatePath("/home");
  return {};
}

export async function returnToolAction(checkoutId: string): Promise<ToolActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("tool_checkouts")
    .update({ returned_at: new Date().toISOString() })
    .eq("id", checkoutId)
    .is("returned_at", null);

  if (error) {
    return { error: `返却の登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/tools");
  revalidatePath("/home");
  return {};
}
