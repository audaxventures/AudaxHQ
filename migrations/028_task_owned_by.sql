-- Distinguishes an action item that's on your team's plate ('TEAM', the
-- existing/default behavior) from one that's actually the client or lead's
-- own commitment ('EXTERNAL'). External items stay linked to their meeting
-- note as a lightweight checklist but are excluded from the team's own
-- to-do board, dashboard, and exports — see listTasks() in src/lib/data/todos.ts.

alter table todos add column owned_by text not null default 'TEAM' check (owned_by in ('TEAM', 'EXTERNAL'));
