-- Adds a priority field to todos, backing the To-Dos board redesign's
-- High/Medium/Low priority badge, filter, and drawer field. Not breaking,
-- purely additive — existing rows default to MEDIUM.

create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH');

alter table todos add column priority task_priority not null default 'MEDIUM';

create index idx_todos_priority on todos(priority);
