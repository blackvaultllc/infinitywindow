
create policy "Anyone can view story media" on storage.objects
  for select to public using (bucket_id = 'story-media');

create policy "Users upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'story-media' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own media" on storage.objects
  for update to authenticated using (
    bucket_id = 'story-media' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'story-media' and auth.uid()::text = (storage.foldername(name))[1]
  );
