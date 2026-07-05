-- Audax HQ — Settings module, phase 2: converts the fixed work_type,
-- lead_source, and (non-Client/Lead) task_type enums into editable,
-- archivable lookup tables, so new categories can be added from Settings
-- without a code deploy. Existing data is remapped in place; nothing is
-- lost. The "Other" + free-text fallback (work_type_other / source_other)
-- is preserved exactly as before.
--
-- Run once: psql "$DATABASE_URL" -f migrations/008_editable_categories.sql

begin;

-- ---------------------------------------------------------------------
-- Work types (clients + leads). is_fallback marks the row that triggers
-- the free-text "please specify" field, replacing the old 'OTHER' enum
-- literal check.
-- ---------------------------------------------------------------------
create table work_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_fallback boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into work_types (name, is_fallback) values
  ('Software Development', false),
  ('Fractional CAIO', false),
  ('Fractional COO', false),
  ('Fractional CMO', false),
  ('Marketing Services', false),
  ('Website Development', false),
  ('Advisory', false),
  ('Other', true);

alter table clients add column work_type_id uuid references work_types(id);
update clients c set work_type_id = wt.id
  from work_types wt
  where c.work_type is not null
    and wt.name = (case c.work_type::text
      when 'SOFTWARE_DEVELOPMENT' then 'Software Development'
      when 'FRACTIONAL_CAIO' then 'Fractional CAIO'
      when 'FRACTIONAL_COO' then 'Fractional COO'
      when 'FRACTIONAL_CMO' then 'Fractional CMO'
      when 'MARKETING_SERVICES' then 'Marketing Services'
      when 'WEBSITE_DEVELOPMENT' then 'Website Development'
      when 'ADVISORY' then 'Advisory'
      when 'OTHER' then 'Other'
    end);
alter table clients drop column work_type;

alter table leads add column work_type_id uuid references work_types(id);
update leads l set work_type_id = wt.id
  from work_types wt
  where l.work_type is not null
    and wt.name = (case l.work_type::text
      when 'SOFTWARE_DEVELOPMENT' then 'Software Development'
      when 'FRACTIONAL_CAIO' then 'Fractional CAIO'
      when 'FRACTIONAL_COO' then 'Fractional COO'
      when 'FRACTIONAL_CMO' then 'Fractional CMO'
      when 'MARKETING_SERVICES' then 'Marketing Services'
      when 'WEBSITE_DEVELOPMENT' then 'Website Development'
      when 'ADVISORY' then 'Advisory'
      when 'OTHER' then 'Other'
    end);
alter table leads drop column work_type;

drop type client_work_type;

-- ---------------------------------------------------------------------
-- Lead sources
-- ---------------------------------------------------------------------
create table lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_fallback boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into lead_sources (name, is_fallback) values
  ('Referral', false),
  ('Cold Outreach', false),
  ('Riley Outreach', false),
  ('Ad', false),
  ('Inbound', false),
  ('Other', true);

alter table leads add column source_id uuid references lead_sources(id);
update leads l set source_id = ls.id
  from lead_sources ls
  where l.source is not null
    and ls.name = (case l.source::text
      when 'REFERRAL' then 'Referral'
      when 'COLD_OUTREACH' then 'Cold Outreach'
      when 'RILEY_OUTREACH' then 'Riley Outreach'
      when 'AD' then 'Ad'
      when 'INBOUND' then 'Inbound'
      when 'OTHER' then 'Other'
    end);
alter table leads drop column source;

drop type lead_source;

-- ---------------------------------------------------------------------
-- To-do types: CLIENT/LEAD stay fixed system types (structurally tied to
-- an actual client_id/lead_id), enforced via the type discriminator
-- below. Everything else (General, Personal, Audax Ventures, H2MB,
-- Other, and anything added later) becomes an editable "CUSTOM" category
-- referencing todo_types. Named "todo_types" (not "task_categories") to
-- avoid confusion with the unrelated work_categories table used by the
-- Hour & Cost Tracker.
-- ---------------------------------------------------------------------
create table todo_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into todo_types (name) values
  ('General'), ('Personal'), ('Audax Ventures'), ('H2MB'), ('Other');

alter table todos add column todo_type_id uuid references todo_types(id);
alter table todos add column type_v2 text;

update todos set type_v2 = 'CLIENT' where type = 'CLIENT';
update todos set type_v2 = 'LEAD' where type = 'LEAD';
update todos t set type_v2 = 'CUSTOM', todo_type_id = tt.id
  from todo_types tt
  where t.type not in ('CLIENT', 'LEAD')
    and tt.name = (case t.type::text
      when 'GENERAL' then 'General'
      when 'PERSONAL' then 'Personal'
      when 'AUDAX_VENTURES' then 'Audax Ventures'
      when 'H2MB' then 'H2MB'
      when 'OTHER' then 'Other'
    end);

alter table todos drop constraint todos_type_link_check;
alter table todos drop column type;
alter table todos rename column type_v2 to type;
alter table todos alter column type set not null;

alter table todos add constraint todos_type_link_check check (
  (type = 'CLIENT' and client_id is not null and lead_id is null and todo_type_id is null) or
  (type = 'LEAD' and lead_id is not null and client_id is null and todo_type_id is null) or
  (type = 'CUSTOM' and client_id is null and lead_id is null and todo_type_id is not null)
);

drop type task_type;

create index idx_todos_type on todos(type);
create index idx_todos_todo_type on todos(todo_type_id);

commit;
