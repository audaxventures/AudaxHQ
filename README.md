# Audax HQ

Internal client, lead, and task management app for Audax Ventures. Single-user, passcode-gated, deployed on Vercel with a Neon Postgres database.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — brand theme (navy / cream / burnt orange) defined in `src/app/globals.css`
- **`@neondatabase/serverless`** — talks to Postgres over HTTP, no ORM. Schema lives in `migrations/001_init.sql` + `migrations/002_feature_update.sql` + `migrations/003_work_type_update.sql`; query helpers in `src/lib/data/`
- **Framer Motion** for page-transition polish
- A single shared-passcode gate (`src/proxy.ts` + `src/lib/auth.ts`) — not a real auth system, just a lock on the front door

## Local development

```bash
npm install
cp .env.example .env.local   # fill in APP_PASSCODE and DATABASE_URL
npm run dev
```

You need a Postgres database to develop against — see "Database setup" below. Point `DATABASE_URL` at it.

## Deploying

### 1. Create the database (Neon / Vercel Postgres)

1. In your Vercel project, go to **Storage → Create Database → Postgres** (this provisions a Neon database and wires up env vars automatically), or create a database directly at [neon.com](https://neon.com) and copy its connection string.
2. Run the schema migrations, in order, against that database:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_init.sql
   psql "$DATABASE_URL" -f migrations/002_feature_update.sql
   psql "$DATABASE_URL" -f migrations/003_work_type_update.sql
   ```
   (Or paste each file's contents into the Neon SQL editor, in order.)

There's no ORM/migration tool — each `migrations/NNN_*.sql` file is applied once, in order, and together they are the schema. If you need to change it later, write a new `migrations/004_*.sql` file and run it the same way.

**`002_feature_update.sql` is a breaking change** — it renames columns (`clients.name`/`leads.name` → `contact_name` + new `company_name`), replaces the single project/recurring invoice fields with a per-client `invoices` list, replaces `leads.next_follow_up_date` with a `follow_ups` list, adds a `meeting_notes` table, and folds `client_tasks` into a unified `todos` table with a new `type`/`status` model. It migrates existing data in place (wrapped in a transaction), but the app code in this deploy will not run against the old (pre-002) schema — **run it before or as part of deploying this version**, not after.

**`003_work_type_update.sql` is also a breaking change** — it replaces the `work_type` enum's options (old software/website categories → Software Development, Fractional CAIO, Fractional COO, Fractional CMO, Marketing Services, Website Development, Advisory, Other) and remaps every existing client/lead onto the closest new category (see the comment at the top of the file for the exact mapping). As with 002, **run it before deploying this version** — the app's dropdown will reject/mis-render the old enum values once this code ships.

### 2. Set environment variables in Vercel

In the Vercel project's **Settings → Environment Variables**, set:

| Variable | Value |
|---|---|
| `APP_PASSCODE` | The shared passcode for accessing the app |
| `AUTH_SECRET` | (optional) random string, `openssl rand -hex 32` |
| `DATABASE_URL` | Your Neon/Vercel Postgres connection string (if you provisioned via Vercel Storage, this is set automatically as `POSTGRES_URL` — copy its value into `DATABASE_URL`, or rename the reference) |

### 3. Deploy

Push to your connected Git branch, or run `vercel --prod`. That's it — no build-time database access is required (every page under `/` is rendered on-demand, not statically prerendered).

### 4. (Optional) Automate monthly recurring invoices

Recurring clients get their current month's invoice row created automatically the next time the dashboard or their client page is loaded — so in practice a new month's invoice always appears the first time you open the app that month. If you'd rather have it happen exactly on the 1st regardless of whether anyone opens the app, add a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) that hits a route calling `ensureRecurringInvoicesForAllActiveClients()` (see `src/lib/data/clients.ts`) — not included by default since the lazy approach covers the actual use case.

## Access model

There are no user accounts. `src/proxy.ts` checks every request (except `/login` and static assets) for a signed session cookie; `/login` posts a passcode to a server action that validates it against `APP_PASSCODE` and sets an HTTP-only cookie. Sign out clears the cookie via `POST /api/logout`.

## Project structure

```
migrations/001_init.sql        the original DB schema
migrations/002_feature_update.sql  breaking schema update (invoices/follow-ups/meeting notes lists, unified todos, company-name-primary)
migrations/003_work_type_update.sql  breaking change: new work_type categories (fractional exec / marketing services)
src/proxy.ts                   passcode gate
src/lib/db.ts                  Neon client
src/lib/data/                  query functions, grouped by domain (clients, leads, todos, followups, meetingnotes, dashboard)
src/lib/actions/               shared server actions used across the clients/leads/todos pages (tasks, followups, meetingnotes)
src/app/login/                 passcode gate UI + server action
src/app/(app)/                 everything behind the gate: dashboard, clients, leads, meeting-notes, todos
src/components/ui/             design-system primitives (Button, Badge, Card, Field, ...)
```
