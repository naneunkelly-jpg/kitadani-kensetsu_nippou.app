-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 2: マスタ（元請け先・現場・会社公休日・勤務状態）
-- ============================================================

-- ------------------------------------------------------------
-- clients: 元請け先マスタ
-- ------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "clients_select_authenticated" on public.clients;
create policy "clients_select_authenticated"
  on public.clients for select
  using (auth.uid() is not null);

drop policy if exists "clients_admin_write" on public.clients;
create policy "clients_admin_write"
  on public.clients for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- worksites: 現場マスタ（必ず元請け先に紐づく）
-- ------------------------------------------------------------
create table if not exists public.worksites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  name text not null,
  address text not null default '',
  start_date date,
  end_date date,
  status text not null default 'before_start'
    check (status in ('before_start', 'in_progress', 'completed', 'on_hold')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worksites_client_id_idx on public.worksites (client_id);

drop trigger if exists set_updated_at on public.worksites;
create trigger set_updated_at
  before update on public.worksites
  for each row execute function public.set_updated_at();

alter table public.worksites enable row level security;

drop policy if exists "worksites_select_authenticated" on public.worksites;
create policy "worksites_select_authenticated"
  on public.worksites for select
  using (auth.uid() is not null);

drop policy if exists "worksites_admin_write" on public.worksites;
create policy "worksites_admin_write"
  on public.worksites for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- company_holidays: 会社公休日
-- ------------------------------------------------------------
create table if not exists public.company_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.company_holidays;
create trigger set_updated_at
  before update on public.company_holidays
  for each row execute function public.set_updated_at();

alter table public.company_holidays enable row level security;

drop policy if exists "company_holidays_select_authenticated" on public.company_holidays;
create policy "company_holidays_select_authenticated"
  on public.company_holidays for select
  using (auth.uid() is not null);

drop policy if exists "company_holidays_admin_write" on public.company_holidays;
create policy "company_holidays_admin_write"
  on public.company_holidays for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- employee_schedules: 勤務状態（例外のみ保存。行が無い日は月〜土=出勤予定、日=休みとして扱う）
-- ------------------------------------------------------------
create table if not exists public.employee_schedules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id),
  schedule_date date not null,
  status text not null check (status in ('scheduled_work', 'day_off')),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, schedule_date)
);

create index if not exists employee_schedules_date_idx on public.employee_schedules (schedule_date);

drop trigger if exists set_updated_at on public.employee_schedules;
create trigger set_updated_at
  before update on public.employee_schedules
  for each row execute function public.set_updated_at();

alter table public.employee_schedules enable row level security;

drop policy if exists "employee_schedules_select_own_or_admin" on public.employee_schedules;
create policy "employee_schedules_select_own_or_admin"
  on public.employee_schedules for select
  using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "employee_schedules_write_own_or_admin" on public.employee_schedules;
create policy "employee_schedules_write_own_or_admin"
  on public.employee_schedules for all
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());
