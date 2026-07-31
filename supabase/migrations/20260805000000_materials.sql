-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 4: 材料マスタ・使用記録
--
-- 設計方針: 材料は工具と違い「借りて返す」ものではなく消費して無くなるため、
-- 状態管理（現在持ち出し中など）は不要。「いつ・誰が・どの現場で・何を・
-- どれだけ使ったか」を都度記録する追記型の使用ログとして管理する。
-- ============================================================

-- ------------------------------------------------------------
-- materials: 材料マスタ
-- ------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default '',
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_is_active_idx on public.materials (is_active);

drop trigger if exists set_updated_at on public.materials;
create trigger set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

alter table public.materials enable row level security;

drop policy if exists "materials_select_authenticated" on public.materials;
create policy "materials_select_authenticated"
  on public.materials for select
  using (auth.uid() is not null);

drop policy if exists "materials_admin_write" on public.materials;
create policy "materials_admin_write"
  on public.materials for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- material_usages: 材料使用記録（追記型ログ、状態を持たない）
-- ------------------------------------------------------------
create table if not exists public.material_usages (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id),
  employee_id uuid not null references public.profiles (id),
  worksite_id uuid not null references public.worksites (id),
  used_date date not null default current_date,
  quantity numeric(10, 2) not null check (quantity > 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_usages_material_idx on public.material_usages (material_id);
create index if not exists material_usages_employee_idx on public.material_usages (employee_id);
create index if not exists material_usages_worksite_idx on public.material_usages (worksite_id);
create index if not exists material_usages_used_date_idx on public.material_usages (used_date);

drop trigger if exists set_updated_at on public.material_usages;
create trigger set_updated_at
  before update on public.material_usages
  for each row execute function public.set_updated_at();

alter table public.material_usages enable row level security;

-- 工具（tool_checkouts）と異なり、材料の使用量は取り合い・排他が無く
-- 他人に見せる必要性が薄いため、daily_reportsと同じ「本人or管理者」に限定する。
drop policy if exists "material_usages_select_own_or_admin" on public.material_usages;
create policy "material_usages_select_own_or_admin"
  on public.material_usages for select
  using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "material_usages_write_own_or_admin" on public.material_usages;
create policy "material_usages_write_own_or_admin"
  on public.material_usages for all
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());
