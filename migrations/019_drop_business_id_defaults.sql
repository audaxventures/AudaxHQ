-- Audax HQ — Stage 2 follow-up: drops the temporary literal business_id
-- defaults that migration 018 added so existing INSERTs kept working
-- before every call site was updated to pass business_id explicitly.
-- Every data-layer function now supplies business_id on every INSERT, so
-- the default is no longer needed — and leaving it in place is actively
-- dangerous: once a second business exists, any insert that forgot to
-- specify business_id would silently default to the first business's id
-- instead of failing loudly, a real cross-tenant data leak.
--
-- Safe to run only after Stage 2's application code (every data-layer
-- INSERT passing business_id explicitly) is deployed — run this
-- migration after that deploy, not before, so there's no window where
-- an in-flight old-code request relies on the default and fails NOT NULL.
--
-- Run once: psql "$DATABASE_URL" -f migrations/019_drop_business_id_defaults.sql

begin;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'team_members', 'clients', 'leads', 'client_links', 'client_notes', 'lead_notes',
    'follow_ups', 'meeting_notes', 'invoices', 'todos', 'todo_tags', 'documents',
    'time_entries', 'fixed_costs', 'work_categories', 'client_access',
    'work_types', 'lead_sources', 'todo_types', 'tags', 'billing_entities'
  ]
  loop
    execute format('alter table %I alter column business_id drop default', v_table);
  end loop;
end $$;

commit;
