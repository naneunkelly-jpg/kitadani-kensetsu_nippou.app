-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 3: 日報（daily_reports / work_entries / report_photos）
-- ============================================================

-- ------------------------------------------------------------
-- daily_reports: 日報ヘッダー（従業員×日付で1件）
-- ------------------------------------------------------------
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id),
  report_date date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'confirmed')),
  today_summary text not null default '',
  tomorrow_plan text not null default '',
  remarks text not null default '',
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, report_date)
);

create index if not exists daily_reports_date_idx on public.daily_reports (report_date);
create index if not exists daily_reports_employee_idx on public.daily_reports (employee_id);

drop trigger if exists set_updated_at on public.daily_reports;
create trigger set_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

-- 従業員が confirmed へ変更したり confirmed_by/confirmed_at を書き換えたりできないようにする
create or replace function public.protect_report_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status = 'confirmed' then
      raise exception '確認済みへの変更は管理者のみ行えます';
    end if;
    if new.confirmed_by is distinct from old.confirmed_by
       or new.confirmed_at is distinct from old.confirmed_at then
      raise exception 'confirmed_by / confirmed_at を変更する権限がありません';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_report_status on public.daily_reports;
create trigger protect_report_status
  before update on public.daily_reports
  for each row execute function public.protect_report_status();

alter table public.daily_reports enable row level security;

drop policy if exists "daily_reports_select_own_or_admin" on public.daily_reports;
create policy "daily_reports_select_own_or_admin"
  on public.daily_reports for select
  using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "daily_reports_insert_own" on public.daily_reports;
create policy "daily_reports_insert_own"
  on public.daily_reports for insert
  with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "daily_reports_update_own_or_admin" on public.daily_reports;
create policy "daily_reports_update_own_or_admin"
  on public.daily_reports for update
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "daily_reports_delete_own_or_admin" on public.daily_reports;
create policy "daily_reports_delete_own_or_admin"
  on public.daily_reports for delete
  using (employee_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
-- work_entries: 現場ごとの作業明細（1日報に対して複数）
-- ------------------------------------------------------------
create table if not exists public.work_entries (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references public.daily_reports (id) on delete cascade,
  employee_id uuid not null references public.profiles (id),
  client_id uuid not null references public.clients (id),
  worksite_id uuid not null references public.worksites (id),
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0,
  work_hours numeric(5, 2) not null default 0,
  work_detail text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_entries_daily_report_idx on public.work_entries (daily_report_id);
create index if not exists work_entries_employee_idx on public.work_entries (employee_id);
create index if not exists work_entries_client_idx on public.work_entries (client_id);
create index if not exists work_entries_worksite_idx on public.work_entries (worksite_id);

drop trigger if exists set_updated_at on public.work_entries;
create trigger set_updated_at
  before update on public.work_entries
  for each row execute function public.set_updated_at();

alter table public.work_entries enable row level security;

drop policy if exists "work_entries_select_own_or_admin" on public.work_entries;
create policy "work_entries_select_own_or_admin"
  on public.work_entries for select
  using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "work_entries_write_own_or_admin" on public.work_entries;
create policy "work_entries_write_own_or_admin"
  on public.work_entries for all
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
-- report_photos: 現場写真
-- ------------------------------------------------------------
create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  work_entry_id uuid not null references public.work_entries (id) on delete cascade,
  employee_id uuid not null references public.profiles (id),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists report_photos_work_entry_idx on public.report_photos (work_entry_id);

alter table public.report_photos enable row level security;

drop policy if exists "report_photos_select_own_or_admin" on public.report_photos;
create policy "report_photos_select_own_or_admin"
  on public.report_photos for select
  using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "report_photos_write_own_or_admin" on public.report_photos;
create policy "report_photos_write_own_or_admin"
  on public.report_photos for all
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());
