-- ============================================================
-- 北谷建設 日報・現場管理システム
-- Phase 1: 認証・profiles テーブルの基盤
-- ============================================================

-- 共通: updated_at を自動更新するトリガー関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles: 従業員情報（auth.users と 1:1）
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('employee', 'admin')),
  is_active boolean not null default true,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 新規サインアップ時に自動で profiles 行を作成する
-- （実運用では管理者がSupabase Admin API経由で従業員アカウントを作成する想定。
--   その際 raw_user_meta_data に full_name を含めることで自動反映される）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, is_active, push_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    true,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- is_admin(): RLSポリシーで共通利用する権限判定関数
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- ------------------------------------------------------------
-- 重要な安全策:
-- 従業員が自分自身の role / is_active を書き換えて管理者に昇格したり
-- 無効化を解除したりできないよう、DBレベルで強制的にブロックする。
-- （RLSのUSING句だけでは列単位の制御ができないため、トリガーで担保する）
-- ------------------------------------------------------------
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'role を変更する権限がありません';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'is_active を変更する権限がありません';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- ------------------------------------------------------------
-- RLS: profiles
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_insert_delete" on public.profiles;
create policy "profiles_admin_insert_delete"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
  on public.profiles for delete
  using (public.is_admin());
