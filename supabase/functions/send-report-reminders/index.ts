// 北谷建設 日報管理: 日報未提出者へのWeb Push通知
//
// pg_cron から1日2回呼び出される。
// - mode: "evening" … 18:00（JST）。今日の日報がまだ未提出の人へのリマインド。
// - mode: "morning" … 翌6:00（JST）。前日の日報が未提出のまま日をまたいだ人への通知。
//
// 「出勤予定なのに未提出」の判定は public.get_pending_report_employees(target_date)
// というSQL関数（src/lib/schedule.ts の effectiveScheduleStatus と同じロジック）に
// 委譲している。

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@kitadani-kensetsu.jp";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function getJstDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type PendingEmployee = { employee_id: string; full_name: string };
type PushSubscriptionRow = {
  id: string;
  employee_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

Deno.serve(async (req) => {
  let mode: "evening" | "morning" = "evening";
  try {
    const body = await req.json();
    if (body?.mode === "morning") mode = "morning";
  } catch {
    // ボディが無い/不正な場合はeveningとして扱う
  }

  const todayJst = getJstDateString(new Date());
  const targetDate = mode === "morning" ? addDays(todayJst, -1) : todayJst;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: employees, error } = await supabase.rpc("get_pending_report_employees", {
    target_date: targetDate,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pending = (employees ?? []) as PendingEmployee[];

  if (pending.length === 0) {
    return new Response(JSON.stringify({ sent: 0, targetDate, mode }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const employeeIds = pending.map((e) => e.employee_id);

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, employee_id, endpoint, p256dh, auth")
    .in("employee_id", employeeIds);

  const title = mode === "evening" ? "日報の提出をお忘れなく" : "日報が未提出です";
  const body =
    mode === "evening"
      ? "本日の日報がまだ提出されていません。"
      : `${targetDate}の日報が提出されていません。至急ご提出ください。`;
  const url = `/report/new?date=${mode === "evening" ? todayJst : targetDate}`;

  let sent = 0;
  const staleIds: string[] = [];

  for (const sub of (subscriptions ?? []) as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url })
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(sub.id);
      }
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return new Response(
    JSON.stringify({ sent, targets: pending.length, targetDate, mode }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
