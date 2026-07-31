-- ============================================================
-- Storage: report-photos バケットとアクセスポリシー
-- パス規約: {employee_id}/{report_date}/{ファイル名}
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', false)
on conflict (id) do nothing;

drop policy if exists "report_photos_storage_select" on storage.objects;
create policy "report_photos_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'report-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "report_photos_storage_insert" on storage.objects;
create policy "report_photos_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "report_photos_storage_delete" on storage.objects;
create policy "report_photos_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'report-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
