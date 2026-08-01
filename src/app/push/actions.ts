"use server";

import { createClient } from "@/lib/supabase/server";

export type PushActionState = {
  error?: string;
};

export async function subscribePushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<PushActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      employee_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { error: `通知の登録に失敗しました: ${error.message}` };
  }

  return {};
}

export async function unsubscribePushAction(endpoint: string): Promise<PushActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("employee_id", user.id);

  if (error) {
    return { error: `解除に失敗しました: ${error.message}` };
  }

  return {};
}
