-- Fotos por lugar: crea el bucket de Storage "place-photos" y sus permisos.
-- Correr una vez en: Supabase → SQL Editor → New query → pegar → Run.
-- (Es idempotente: se puede correr más de una vez sin romper nada.)

-- Bucket público (lectura abierta; la escritura la controlan las políticas de abajo).
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las fotos.
drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'place-photos');

-- Solo usuarios logueados (admin / equipo) pueden SUBIR fotos.
drop policy if exists "fotos alta admin" on storage.objects;
create policy "fotos alta admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'place-photos');

-- Solo admin puede BORRAR fotos.
drop policy if exists "fotos borrado admin" on storage.objects;
create policy "fotos borrado admin" on storage.objects
  for delete to authenticated using (bucket_id = 'place-photos');
