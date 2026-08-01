-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 5: 材料の在庫登録・在庫確認
--
-- 設計方針: これまで material_usages（使用記録）はあったが、入荷（仕入れ）を
-- 記録する手段が無く「今どれだけ残っているか」が分からなかった。
-- material_stock_entries に入荷を記録し、在庫数 = 入荷数の合計 − 使用数の合計
-- として material_stock_summary ビューで集計する。
-- 在庫数は個人に紐づかない集計値であり機微情報ではないため、
-- tool_checkouts と同様に全ログインユーザーが閲覧できるようにする
-- （ビューはmaterial_usagesの行レベル制限（本人or管理者）を越えて集計するため、
-- 個別の使用記録ではなく合計のみを見せる）。
-- ============================================================

create table if not exists public.material_stock_entries (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id),
  quantity numeric(10, 2) not null check (quantity > 0),
  note text not null default '',
  entered_by uuid not null references public.profiles (id),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_stock_entries_material_idx on public.material_stock_entries (material_id);
create index if not exists material_stock_entries_entry_date_idx on public.material_stock_entries (entry_date);

drop trigger if exists set_updated_at on public.material_stock_entries;
create trigger set_updated_at
  before update on public.material_stock_entries
  for each row execute function public.set_updated_at();

alter table public.material_stock_entries enable row level security;

drop policy if exists "material_stock_entries_select_authenticated" on public.material_stock_entries;
create policy "material_stock_entries_select_authenticated"
  on public.material_stock_entries for select
  using (auth.uid() is not null);

drop policy if exists "material_stock_entries_admin_write" on public.material_stock_entries;
create policy "material_stock_entries_admin_write"
  on public.material_stock_entries for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- material_stock_summary: 材料ごとの在庫集計
-- ------------------------------------------------------------
create or replace view public.material_stock_summary as
select
  m.id as material_id,
  coalesce(stock_in.total, 0) as total_in,
  coalesce(used.total, 0) as total_used,
  coalesce(stock_in.total, 0) - coalesce(used.total, 0) as stock
from public.materials m
left join (
  select material_id, sum(quantity) as total
  from public.material_stock_entries
  group by material_id
) stock_in on stock_in.material_id = m.id
left join (
  select material_id, sum(quantity) as total
  from public.material_usages
  group by material_id
) used on used.material_id = m.id;

grant select on public.material_stock_summary to authenticated;
