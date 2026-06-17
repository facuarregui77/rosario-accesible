-- Esquema de la base de datos de Rosario Access App (Supabase / PostgreSQL).
-- Cómo usarlo: en tu proyecto de Supabase → menú "SQL Editor" → pegá todo esto → "Run".

-- 1) Detalle de accesibilidad cargado por la comunidad (un registro por lugar).
create table if not exists place_access (
  place_id   text primary key,
  bano       text,            -- "si" | "no" | null (sin datos)
  rampa      text,
  ascensor   text,
  braille    text,
  senas      text,
  updated_at timestamptz default now()
);

-- 2) Reseñas / comentarios de los usuarios.
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  place_id   text not null,
  stars      int  not null check (stars between 1 and 5),
  name       text,
  text       text not null,
  date       text,            -- fecha legible (es-AR) para mostrar
  created_at timestamptz default now()
);

-- 3) Seguridad a nivel de fila (RLS).
alter table place_access enable row level security;
alter table reviews      enable row level security;

-- Lectura pública (cualquiera puede ver los datos).
create policy "lectura publica de accesos"  on place_access for select using (true);
create policy "lectura publica de reviews"  on reviews      for select using (true);

-- Escritura pública SIN login (relevamiento colaborativo abierto).
-- ⚠️ Esto permite que cualquiera con la página pueda cargar/editar datos.
--    Está bien para una demo/proyecto educativo. Si más adelante querés
--    evitar spam, se agrega login (auth) y se ajustan estas políticas.
create policy "alta publica de accesos"      on place_access for insert with check (true);
create policy "edicion publica de accesos"   on place_access for update using (true) with check (true);
create policy "alta publica de reviews"      on reviews      for insert with check (true);
