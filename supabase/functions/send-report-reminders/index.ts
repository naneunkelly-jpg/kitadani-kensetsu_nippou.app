// 北谷建設 日報管理: 日報未提出者へのWeb Push通知
//
// pg_cron から毎分呼び出される。実際に通知を送るかどうかは
// public.notification_schedule テーブルに保存された時刻（JST, "HH:MM"）と
// 現在時刻が一致するかで判断する（時刻自体は管理者ページから変更できる）。
// 一致していない分は何もせず早期リターンする（コストはごくわずか）。
//
// - 設定時刻の evening_reminder_time … 今日の日報がまだ未提出の人へのリマインド。
// - 設定時刻の morning_reminder_time … 前日の日報が未提出のまま日をまたいだ人への通知。
//
// 同じ分に複数回叩かれても二重送信しないよう、送信したら
// last_evening_sent_date / last_morning_sent_date（JSTの日付）を更新し、
// 既に今日分を送っていればスキップする。
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

function getJstParts(date: Date): { dateStr: string; hm: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  const h = parts.find((p) => p.type === "hour")!.value;
  const min = parts.find((p) => p.type === "minute")!.value;
  return { dateStr: `${y}-${m}-${d}`, hm: `${h}:${min}` };
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

async function sendReminders(
  supabase: ReturnType<typeof createClient>,
  mode: "evening" | "morning",
  todayJst: string
) {
  const targetDate = mode === "morning" ? addDays(todayJst, -1) : todayJst;

  const { data: employees, error } = await supabase.rpc("get_pending_report_employees", {
    target_date: targetDate,
  });

  if (error) {
    return { error: error.message };
  }

  const pending = (employees ?? []) as PendingEmployee[];
  if (pending.length === 0) {
    return { sent: 0, targets: 0, targetDate };
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
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
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

  return { sent, targets: pending.length, targetDate };
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { dateStr: todayJst, hm: nowHm } = getJstParts(new Date());

  const { data: schedule, error: scheduleError } = await supabase
    .from("notification_schedule")
    .select("evening_reminder_time, morning_reminder_time, last_evening_sent_date, last_morning_sent_date")
    .eq("id", true)
    .single();

  if (scheduleError || !schedule) {
    return new Response(JSON.stringify({ error: scheduleError?.message ?? "設定が見つかりません" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown> = {};

  if (schedule.evening_reminder_time === nowHm && schedule.last_evening_sent_date !== todayJst) {
    results.evening = await sendReminders(supabase, "evening", todayJst);
    await supabase
      .from("notification_schedule")
      .update({ last_evening_sent_date: todayJst })
      .eq("id", true);
  }

  if (schedule.morning_reminder_time === nowHm && schedule.last_morning_sent_date !== todayJst) {
    results.morning = await sendReminders(supabase, "morning", todayJst);
    await supabase
      .from("notification_schedule")
      .update({ last_morning_sent_date: todayJst })
      .eq("id", true);
  }

  return new Response(JSON.stringify({ now: nowHm, today: todayJst, ...results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
