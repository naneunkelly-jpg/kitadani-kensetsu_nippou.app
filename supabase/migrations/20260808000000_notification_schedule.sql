-- ============================================================
-- 北谷建設 日報・現場管理システム
-- 通知時刻を管理者ページから変更できるようにする
--
-- 設計方針: pg_cronのスケジュール自体（時刻）を動的に書き換えるのではなく、
-- cronは「毎分」実行するだけにして、実際に送るかどうかの判定
-- （現在時刻が設定時刻と一致するか）をこのテーブルの値で行う。
-- こうすることでアプリ側に pg_cron を操作する権限を持たせる必要がなくなる。
-- 1行だけを持つ設定テーブル（idはtrue固定）。
-- ============================================================

create table if not exists public.notification_schedule (
  id boolean primary key default true check (id),
  evening_reminder_time text not null default '18:00',
  morning_reminder_time text not null default '06:00',
  last_evening_sent_date date,
  last_morning_sent_date date,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.notification_schedule (id) values (true)
on conflict (id) do nothing;

drop trigger if exists set_updated_at on public.notification_schedule;
create trigger set_updated_at
  before update on public.notification_schedule
  for each row execute function public.set_updated_at();

alter table public.notification_schedule enable row level security;

drop policy if exists "notification_schedule_admin_only" on public.notification_schedule;
create policy "notification_schedule_admin_only"
  on public.notification_schedule for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- cronは毎分実行するだけにし、実際に送るかはEdge Function側で
-- notification_scheduleの設定時刻と現在時刻（JST）を比較して判断する。
-- ------------------------------------------------------------
select cron.unschedule('kitadani-evening-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitadani-evening-report-reminder');

select cron.unschedule('kitadani-morning-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitadani-morning-report-reminder');

select cron.unschedule('kitadani-report-reminder-tick')
where exists (select 1 from cron.job where jobname = 'kitadani-report-reminder-tick');

select cron.schedule(
  'kitadani-report-reminder-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://szgancjtnkruehgujekn.supabase.co/functions/v1/send-report-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
