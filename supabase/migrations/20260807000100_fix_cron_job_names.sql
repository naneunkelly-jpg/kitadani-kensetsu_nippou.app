-- ============================================================
-- 北谷建設 日報・現場管理システム
-- cronジョブ名の誤字修正（kitatani → kitadani）
-- ============================================================

select cron.unschedule('kitatani-evening-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitatani-evening-report-reminder');

select cron.unschedule('kitatani-morning-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitatani-morning-report-reminder');

select cron.unschedule('kitadani-evening-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitadani-evening-report-reminder');

select cron.unschedule('kitadani-morning-report-reminder')
where exists (select 1 from cron.job where jobname = 'kitadani-morning-report-reminder');

-- 18:00 JST = 09:00 UTC
select cron.schedule(
  'kitadani-evening-report-reminder',
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
  'kitadani-morning-report-reminder',
  '0 21 * * *',
  $$
  select net.http_post(
    url := 'https://szgancjtnkruehgujekn.supabase.co/functions/v1/send-report-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"mode": "morning"}'::jsonb
  );
  $$
);
