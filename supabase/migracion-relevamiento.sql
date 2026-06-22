-- Migración: estado general de accesibilidad editable (semáforo del marcador).
-- Permite que un relevamiento en la calle marque "Accesible / Parcial / Sin acceso".
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.

-- Columna para el acceso general en silla de ruedas (si / parcial / no / null = sin datos).
alter table place_access add column if not exists wheelchair text;
alter table place_access drop constraint if exists place_access_wheelchair_check;
alter table place_access add constraint place_access_wheelchair_check
  check (wheelchair is null or wheelchair in ('si', 'parcial', 'no'));
