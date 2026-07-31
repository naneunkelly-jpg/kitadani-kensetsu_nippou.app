-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 4: 工具マスタ・持ち出し/返却管理
--
-- 設計方針: 工具は1点ごとに個体管理する（同種を複数本持っていても
-- それぞれ別のtools行として登録する）。持ち出し/返却は日報の
-- work_entryとは独立したイベントとして tool_checkouts に記録する
-- （数日〜数週間にわたって持ち出したままになる実運用のため）。
-- ============================================================

-- ------------------------------------------------------------
-- tools: 工具マスタ（1行 = 実物の工具1点）
-- ------------------------------------------------------------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  management_no text not null default '',
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_is_active_idx on public.tools (is_active);

drop trigger if exists set_updated_at on public.tools;
create trigger set_updated_at
  before update on public.tools
  for each row execute function public.set_updated_at();

alter table public.tools enable row level security;

drop policy if exists "tools_select_authenticated" on public.tools;
create policy "tools_select_authenticated"
  on public.tools for select
  using (auth.uid() is not null);

drop policy if exists "tools_admin_write" on public.tools;
create policy "tools_admin_write"
  on public.tools for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- tool_checkouts: 持ち出し/返却イベント
-- returned_at が null の行 = 持ち出し中。返却は行削除ではなく
-- returned_at を埋める更新で表現する（履歴として残す）。
-- ------------------------------------------------------------
create table if not exists public.tool_checkouts (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id),
  employee_id uuid not null references public.profiles (id),
  checked_out_at timestamptz not null default now(),
  returned_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tool_checkouts_tool_idx on public.tool_checkouts (tool_id);
create index if not exists tool_checkouts_employee_idx on public.tool_checkouts (employee_id);

-- 同じ工具について「未返却」の行は同時に1件しか存在できないようにする。
-- 二重持ち出し（2人が同時に同じ個体を持ち出す状態）をDBレベルで防止する。
create unique index if not exists tool_checkouts_one_open_per_tool
  on public.tool_checkouts (tool_id)
  where returned_at is null;

drop trigger if exists set_updated_at on public.tool_checkouts;
create trigger set_updated_at
  before update on public.tool_checkouts
  for each row execute function public.set_updated_at();

alter table public.tool_checkouts enable row level security;

-- 他の人が何を持ち出し中かを見て選択肢から除外する必要があるため、
-- 閲覧は全ログインユーザーに開放する（社内の道具管理データであり機微情報ではない）。
drop policy if exists "tool_checkouts_select_authenticated" on public.tool_checkouts;
create policy "tool_checkouts_select_authenticated"
  on public.tool_checkouts for select
  using (auth.uid() is not null);

drop policy if exists "tool_checkouts_insert_own_or_admin" on public.tool_checkouts;
create policy "tool_checkouts_insert_own_or_admin"
  on public.tool_checkouts for insert
  with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "tool_checkouts_update_own_or_admin" on public.tool_checkouts;
create policy "tool_checkouts_update_own_or_admin"
  on public.tool_checkouts for update
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());

-- 誤登録の訂正のみ管理者が行う想定（通常の返却はUPDATEで行うためDELETEは使わない）。
drop policy if exists "tool_checkouts_delete_admin_only" on public.tool_checkouts;
create policy "tool_checkouts_delete_admin_only"
  on public.tool_checkouts for delete
  using (public.is_admin());
