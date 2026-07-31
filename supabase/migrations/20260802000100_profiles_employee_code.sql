-- ============================================================
-- profiles に employee_code（社員コード）列を追加
-- ログイン画面で入力する社員コードを分かりやすく管理者側で確認できるようにする。
-- ============================================================

alter table public.profiles
  add column if not exists employee_code text;

-- 既存行がある場合の一時的な重複回避（Phase1時点では管理者1名のみのため実害なし）
create unique index if not exists profiles_employee_code_key
  on public.profiles (employee_code)
  where employee_code is not null;

-- 新規ユーザー作成時に employee_code も反映するようトリガーを更新
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, is_active, push_enabled, employee_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    true,
    true,
    new.raw_user_meta_data ->> 'employee_code'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
