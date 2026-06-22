-- Migración UNIFICADA (capa 1 relevamiento + capa 2 sugerencias del público).
-- Es idempotente: se puede correr más de una vez sin romper nada. Queda permanente.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.

-- ===== Capa 1: estado general de accesibilidad editable (semáforo del marcador) =====
alter table place_access add column if not exists wheelchair text;
alter table place_access drop constraint if exists place_access_wheelchair_check;
alter table place_access add constraint place_access_wheelchair_check
  check (wheelchair is null or wheelchair in ('si', 'parcial', 'no'));

-- ===== Capa 2: sugerencias de accesibilidad del público (con moderación admin) =====
create table if not exists access_suggestions (
  id          uuid primary key default gen_random_uuid(),
  place_id    text not null,
  wheelchair  text,                 -- si / parcial / no / null
  bano        text,                 -- si / no / null
  rampa       text,
  ascensor    text,
  braille     text,
  senas       text,
  comment     text,                 -- comentario opcional del sugeridor
  name        text,                 -- nombre opcional del sugeridor
  status      text not null default 'pending',  -- pending / approved / rejected
  created_at  timestamptz not null default now()
);

alter table access_suggestions enable row level security;

-- El público puede CREAR sugerencias, pero solo en estado 'pending' (no puede auto-aprobar).
drop policy if exists "alta publica de sugerencias" on access_suggestions;
create policy "alta publica de sugerencias" on access_suggestions
  for insert with check (status = 'pending');

-- Solo usuarios logueados (admin / equipo) pueden VER las sugerencias pendientes.
drop policy if exists "lectura admin de sugerencias" on access_suggestions;
create policy "lectura admin de sugerencias" on access_suggestions
  for select to authenticated using (true);

-- Solo admin puede MODERAR (aprobar / rechazar).
drop policy if exists "moderacion admin de sugerencias" on access_suggestions;
create policy "moderacion admin de sugerencias" on access_suggestions
  for update to authenticated using (true) with check (true);
