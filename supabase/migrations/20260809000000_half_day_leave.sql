-- ============================================================
-- 北谷建設 日報・現場管理システム
-- 半休（午前休・午後休）に対応する
--
-- employee_schedules.status に 'day_off_am'（午前休） / 'day_off_pm'（午後休）を
-- 追加する。半休の日は「その半分は働く」ため、日報提出リマインドの対象からは
-- 除外しない（get_pending_report_employeesの判定を更新）。
-- ============================================================

alter table public.employee_schedules
  drop constraint if exists employee_schedules_status_check;

alter table public.employee_schedules
  add constraint employee_schedules_status_check
  check (status in ('scheduled_work', 'day_off', 'day_off_am', 'day_off_pm'));

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
    ) in ('scheduled_work', 'day_off_am', 'day_off_pm')
    and (dr.id is null or dr.status = 'draft')
$$;
