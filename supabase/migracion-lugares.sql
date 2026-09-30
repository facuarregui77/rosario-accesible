-- Migración (2026-09-30): lugares agregados desde la app, moderación de opiniones,
-- registro de errores y freno anti-spam. Se puede correr más de una vez sin problema.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.

-- 1) Lugares nuevos sumados desde la app (botón "Agregar lugar", solo admin).
--    Los 110 lugares base siguen viviendo en el código; acá van solo los agregados.
create table if not exists places (
  id         text primary key,
  name       text not null check (char_length(name) between 1 and 80),
  type       text not null,
  lat        double precision not null check (lat between -33.06 and -32.83),
  lng        double precision not null check (lng between -60.82 and -60.55),
  created_at timestamptz default now()
);
alter table places enable row level security;
drop policy if exists "lectura publica de lugares" on places;
drop policy if exists "alta admin de lugares"      on places;
drop policy if exists "edicion admin de lugares"   on places;
drop policy if exists "baja admin de lugares"      on places;
create policy "lectura publica de lugares" on places for select using (true);
create policy "alta admin de lugares"      on places for insert to authenticated with check (true);
create policy "edicion admin de lugares"   on places for update to authenticated using (true) with check (true);
create policy "baja admin de lugares"      on places for delete to authenticated using (true);

-- 2) Moderación: el admin puede BORRAR opiniones y sugerencias.
drop policy if exists "baja admin de reviews" on reviews;
create policy "baja admin de reviews" on reviews for delete to authenticated using (true);
drop policy if exists "baja admin de sugerencias" on access_suggestions;
create policy "baja admin de sugerencias" on access_suggestions for delete to authenticated using (true);

-- 3) Freno anti-spam del lado del servidor (no depende del navegador):
--    - textos con largo máximo;
--    - como mucho 5 opiniones por lugar cada 10 minutos (una persona real nunca llega a eso).
alter table reviews drop constraint if exists reviews_text_len;
alter table reviews add constraint reviews_text_len check (char_length(text) <= 600);
alter table reviews drop constraint if exists reviews_name_len;
alter table reviews add constraint reviews_name_len check (name is null or char_length(name) <= 60);

create or replace function limitar_opiniones() returns trigger language plpgsql as $$
begin
  if (select count(*) from reviews where place_id = new.place_id and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Demasiadas opiniones seguidas para este lugar. Probá más tarde.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limitar_opiniones on reviews;
create trigger trg_limitar_opiniones before insert on reviews for each row execute function limitar_opiniones();

-- Lo mismo para las sugerencias del público (máximo 5 por lugar cada 10 minutos).
create or replace function limitar_sugerencias() returns trigger language plpgsql as $$
begin
  if (select count(*) from access_suggestions where place_id = new.place_id and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Demasiadas sugerencias seguidas para este lugar. Probá más tarde.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limitar_sugerencias on access_suggestions;
create trigger trg_limitar_sugerencias before insert on access_suggestions for each row execute function limitar_sugerencias();

-- 4) Registro de errores de la app (para enterarse si algo se rompe en el celular de alguien).
--    Cualquiera puede insertar (la app lo hace sola, máximo 3 por sesión); solo el admin los lee.
create table if not exists app_errors (
  id         uuid primary key default gen_random_uuid(),
  message    text,
  detail     text,
  url        text,
  agent      text,
  created_at timestamptz default now()
);
alter table app_errors enable row level security;
drop policy if exists "alta publica de errores"  on app_errors;
drop policy if exists "lectura admin de errores" on app_errors;
drop policy if exists "baja admin de errores"    on app_errors;
create policy "alta publica de errores"  on app_errors for insert with check (true);
create policy "lectura admin de errores" on app_errors for select to authenticated using (true);
create policy "baja admin de errores"    on app_errors for delete to authenticated using (true);
