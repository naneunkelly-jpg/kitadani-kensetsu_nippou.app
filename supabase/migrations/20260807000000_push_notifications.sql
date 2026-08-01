-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 6: Web Push通知（18:00提出リマインド・翌6:00未提出通知）
-- ============================================================

-- ------------------------------------------------------------
-- push_subscriptions: ブラウザのPush購読情報
-- 1端末（ブラウザ）ごとに1行。同じ人が複数端末で通知を受け取れるよう
-- employee_idに対してendpoint違いで複数行持てるようにする。
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_employee_idx on public.push_subscriptions (employee_id);

drop trigger if exists set_updated_at on public.push_subscriptions;
create trigger set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_own_or_admin" on public.push_subscriptions;
create policy "push_subscriptions_own_or_admin"
  on public.push_subscriptions for all
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
-- get_pending_report_employees: 指定日に出勤予定だったのに、
-- その日の日報がまだ提出（submitted/confirmed）されていない従業員一覧。
-- employee_schedulesの例外 > 曜日デフォルト（日曜=休み）という
-- src/lib/schedule.ts の effectiveScheduleStatus と同じロジックをSQLで再現している。
-- ------------------------------------------------------------
create or replace function public.get_pending_report_employees(target_date date)
returns table (employee_id uuid, full_name text)
language sql
stable
as $$
  select p.id, p.full_name
  from public.profiles p
  left join public.employee_schedules es
    on es.employee_id = p.id and es.schedule_date = target_date
  left join public.daily_reports dr
    on dr.employee_id = p.id and dr.report_date = target_date
  where p.is_active = true
    and p.push_enabled = true
    and coalesce(
      es.status,
      case when extract(dow from target_date) = 0 then 'day_off' else 'scheduled_work' end
    ) = 'scheduled_work'
    and (dr.id is null or dr.status = 'draft')
$$;

-- ------------------------------------------------------------
-- pg_cron + pg_net: 18:00（JST）と翌6:00（JST）にEdge Functionを呼び出す。
-- Edge Function自体はデプロイ時に --no-verify-jwt を付けており、
-- ここでは認証ヘッダを付けない（サービスロールキーをDBに書き込みたくないため）。
-- ------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('kitatani-evening-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitatani-evening-report-reminder');

select cron.unschedule('kitatani-morning-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitatani-morning-report-reminder');

-- 18:00 JST = 09:00 UTC
select cron.schedule(
  'kitatani-evening-report-reminder',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://szgancjtnkruehgujekn.supabase.co/functions/v1/send-report-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"mode": "evening"}'::jsonb
  );
  $$
);

-- 翌6:00 JST = 21:00 UTC（前日）
select cron.schedule(
  'kitatani-morning-report-reminder',
  '0 21 * * *',
  $$
  select net.http_post(
    url := 'https://szgancjtnkruehgujekn.supabase.co/functions/v1/send-report-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"mode": "morning"}'::jsonb
  );
  $$
);
