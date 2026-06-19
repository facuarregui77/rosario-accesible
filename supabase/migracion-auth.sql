-- Migración: opiniones con tipo + estrellas opcionales, y edición SOLO para admin logueado.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.

-- 1) reviews: tipo de feedback (experiencia/sugerencia) y puntuación opcional (0 = sin nota)
alter table reviews add column if not exists kind text default 'experiencia';
alter table reviews alter column stars drop not null;
alter table reviews drop constraint if exists reviews_stars_check;
alter table reviews add constraint reviews_stars_check check (stars is null or stars between 0 and 5);

-- 2) place_access: la edición pasa a ser SOLO de usuarios logueados (admin).
--    La lectura sigue siendo pública; las reseñas siguen abiertas a todos.
drop policy if exists "alta publica de accesos"    on place_access;
drop policy if exists "edicion publica de accesos" on place_access;
create policy "alta admin de accesos"    on place_access for insert to authenticated with check (true);
create policy "edicion admin de accesos" on place_access for update to authenticated using (true) with check (true);
