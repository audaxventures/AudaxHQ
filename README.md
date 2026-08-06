# Verclara

Internal client, lead, and task management app for Audax Ventures. Single-user, passcode-gated, deployed on Vercel with a Neon Postgres database.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — brand theme (navy / cream / burnt orange) defined in `src/app/globals.css`
- **`@neondatabase/serverless`** — talks to Postgres over HTTP, no ORM. Schema lives in `migrations/001_init.sql` + `migrations/002_feature_update.sql` + `migrations/003_work_type_update.sql` + `migrations/004_documents.sql` + `migrations/005_hour_cost_tracker.sql` + `migrations/006_work_categories.sql` + `migrations/007_settings.sql` + `migrations/008_editable_categories.sql` + `migrations/009_todo_priority.sql` + `migrations/010_profile_timezone.sql` + `migrations/011_client_lead_color.sql` + `migrations/012_business_logo.sql` + `migrations/013_passcode_reset.sql` + `migrations/014_team_member_access.sql` + `migrations/015_followup_assignment.sql` + `migrations/016_lead_documents.sql` + `migrations/017_meeting_note_agenda.sql` + `migrations/018_businesses.sql` + `migrations/019_drop_business_id_defaults.sql` + `migrations/020_business_suspension.sql` + `migrations/021_invoice_hourly.sql` + `migrations/022_owner_team_member_link.sql` + `migrations/023_business_onboarding.sql` + `migrations/024_meeting_note_title.sql` + `migrations/025_drop_billing_entities.sql` + `migrations/026_meeting_note_action_items.sql` + `migrations/027_feedback.sql` + `migrations/028_task_owned_by.sql` + `migrations/029_meeting_scheduling.sql` + `migrations/030_calendar_feeds.sql` + `migrations/031_business_tier.sql` + `migrations/032_notifications.sql` + `migrations/033_meeting_note_email_log.sql` + `migrations/034_note_mentions.sql` + `migrations/035_invoice_work_type.sql`; query helpers in `src/lib/data/`
- **Supabase Storage** — private buckets for client and lead document uploads and a public bucket for the business logo (`src/lib/storage.ts`); Neon only stores metadata and storage paths, never the files themselves
- **Resend** — sends "forgot passcode" reset emails and emailed meeting-note PDFs (`src/lib/email.ts`); optional, everything else works without it
- **`@react-pdf/renderer`** — generates the branded meeting-note PDF (`src/lib/pdf/`), used by both the modal's "Download PDF" button and the emailed attachment
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
   psql "$DATABASE_URL" -f migrations/004_documents.sql
   psql "$DATABASE_URL" -f migrations/005_hour_cost_tracker.sql
   psql "$DATABASE_URL" -f migrations/006_work_categories.sql
   psql "$DATABASE_URL" -f migrations/007_settings.sql
   psql "$DATABASE_URL" -f migrations/008_editable_categories.sql
   psql "$DATABASE_URL" -f migrations/009_todo_priority.sql
   psql "$DATABASE_URL" -f migrations/010_profile_timezone.sql
   psql "$DATABASE_URL" -f migrations/011_client_lead_color.sql
   psql "$DATABASE_URL" -f migrations/012_business_logo.sql
   psql "$DATABASE_URL" -f migrations/013_passcode_reset.sql
   psql "$DATABASE_URL" -f migrations/014_team_member_access.sql
   psql "$DATABASE_URL" -f migrations/015_followup_assignment.sql
   psql "$DATABASE_URL" -f migrations/016_lead_documents.sql
   psql "$DATABASE_URL" -f migrations/017_meeting_note_agenda.sql
   psql "$DATABASE_URL" -f migrations/018_businesses.sql
   psql "$DATABASE_URL" -f migrations/019_drop_business_id_defaults.sql
   psql "$DATABASE_URL" -f migrations/020_business_suspension.sql
   psql "$DATABASE_URL" -f migrations/021_invoice_hourly.sql
   psql "$DATABASE_URL" -f migrations/022_owner_team_member_link.sql
   psql "$DATABASE_URL" -f migrations/023_business_onboarding.sql
   psql "$DATABASE_URL" -f migrations/024_meeting_note_title.sql
   psql "$DATABASE_URL" -f migrations/025_drop_billing_entities.sql
   psql "$DATABASE_URL" -f migrations/026_meeting_note_action_items.sql
   psql "$DATABASE_URL" -f migrations/027_feedback.sql
   psql "$DATABASE_URL" -f migrations/028_task_owned_by.sql
   psql "$DATABASE_URL" -f migrations/029_meeting_scheduling.sql
   psql "$DATABASE_URL" -f migrations/030_calendar_feeds.sql
   psql "$DATABASE_URL" -f migrations/031_business_tier.sql
   psql "$DATABASE_URL" -f migrations/032_notifications.sql
   psql "$DATABASE_URL" -f migrations/033_meeting_note_email_log.sql
   psql "$DATABASE_URL" -f migrations/034_note_mentions.sql
   psql "$DATABASE_URL" -f migrations/035_invoice_work_type.sql
   psql "$DATABASE_URL" -f migrations/036_meeting_note_timezone.sql
   psql "$DATABASE_URL" -f migrations/037_lead_owner.sql
   psql "$DATABASE_URL" -f migrations/038_team_member_color.sql
   psql "$DATABASE_URL" -f migrations/039_owner_time_entries.sql
   psql "$DATABASE_URL" -f migrations/040_partners.sql
   psql "$DATABASE_URL" -f migrations/041_partner_owner.sql
   psql "$DATABASE_URL" -f migrations/042_stripe_billing.sql
   psql "$DATABASE_URL" -f migrations/043_prospects.sql
   psql "$DATABASE_URL" -f migrations/044_tracker_billing_rework.sql
   psql "$DATABASE_URL" -f migrations/045_hot_leads_prospects.sql
   ```
   (Or paste each file's contents into the Neon SQL editor, in order.)

There's no ORM/migration tool — each `migrations/NNN_*.sql` file is applied once, in order, and together they are the schema. If you need to change it later, write a new `migrations/010_*.sql` file and run it the same way.

**`002_feature_update.sql` is a breaking change** — it renames columns (`clients.name`/`leads.name` → `contact_name` + new `company_name`), replaces the single project/recurring invoice fields with a per-client `invoices` list, replaces `leads.next_follow_up_date` with a `follow_ups` list, adds a `meeting_notes` table, and folds `client_tasks` into a unified `todos` table with a new `type`/`status` model. It migrates existing data in place (wrapped in a transaction), but the app code in this deploy will not run against the old (pre-002) schema — **run it before or as part of deploying this version**, not after.

**`003_work_type_update.sql` is also a breaking change** — it replaces the `work_type` enum's options (old software/website categories → Software Development, Fractional CAIO, Fractional COO, Fractional CMO, Marketing Services, Website Development, Advisory, Other) and remaps every existing client/lead onto the closest new category (see the comment at the top of the file for the exact mapping). As with 002, **run it before deploying this version** — the app's dropdown will reject/mis-render the old enum values once this code ships.

**`004_documents.sql`** just adds a new `documents` table — not breaking, but the app won't be able to store client documents until both this migration and the Supabase setup below are done.

**`005_hour_cost_tracker.sql`** adds `team_members`, `time_entries`, and `fixed_costs` tables plus a `clients.budgeted_hours` column, for the Hour & Cost Tracker module — not breaking, purely additive.

**`006_work_categories.sql`** adds a `work_categories` table (each with its own default hourly rate) and a nullable `time_entries.category_id` — not breaking, purely additive.

**`007_settings.sql`** adds the Settings module's own tables (profile, business entities, app settings) — not breaking, purely additive.

**`008_editable_categories.sql`** converts the fixed `work_type`, `lead_source`, and non-Client/Lead `task_type` enums into editable, archivable lookup tables — migrates existing data in place, nothing is lost.

**`009_todo_priority.sql`** adds a `priority` column (`task_priority` enum: LOW/MEDIUM/HIGH, default MEDIUM) to `todos`, for the To-Dos board redesign — not breaking, purely additive.

**`010_profile_timezone.sql`** adds a `timezone` column to `profile`, so "today" is computed against the operator's real clock instead of always UTC — not breaking, purely additive.

**`011_client_lead_color.sql`** adds a `color` column to `clients` and `leads`, letting each be assigned an explicit accent color used for avatars/accent bars — not breaking, purely additive.

**`012_business_logo.sql`** adds a `logo_path` column to `app_settings`, pointing at the uploaded business logo in Supabase Storage — not breaking, purely additive.

**`013_passcode_reset.sql`** adds `passcode_reset_token_hash`/`passcode_reset_token_expires_at` columns to `app_settings`, backing the "Forgot passcode?" email flow — not breaking, purely additive.

**`018_businesses.sql`** Stage 1 of the multi-tenant conversion — adds `businesses` + `account_emails` tables, `business_id` on every tenant-scoped table, drops `profile`/`app_settings`. Requires `app_settings.passcode_hash` to already be set before running — see the migration's own header comment.

**`019_drop_business_id_defaults.sql`** drops the temporary `business_id` column defaults `018` added, now that every insert supplies `business_id` explicitly — not breaking, but run only after the app code from that point in the conversion is deployed.

**`020_business_suspension.sql`** adds `businesses.suspended_at`, backing the platform admin portal's suspend/reactivate action — not breaking, purely additive.

**`021_invoice_hourly.sql`** adds `invoices.invoice_type` (FIXED/HOURLY), `hours`, `hourly_rate`, and `description` — lets an invoice be billed hourly instead of only as a flat amount, plus a notes field. Not breaking, purely additive.

**`022_owner_team_member_link.sql`** adds `businesses.owner_team_member_id`, letting an owner explicitly link a `team_members` row they created for themselves (e.g. to track their own billable hours) to their own identity, with a best-effort backfill for exact name/email matches. Not breaking, purely additive.

**`023_business_onboarding.sql`** adds `businesses.onboarding_dismissed_at`, tracking whether the owner has dismissed the first-login welcome popup. Not breaking, purely additive.

### 2. Document storage setup (Supabase)

Client and lead file uploads (feature: Documents on a client's or lead's page) and the business logo (Settings → Profile) are stored in Supabase Storage, not Neon — Neon only keeps metadata and storage paths. Set this up once:

1. Create a free project at [supabase.com](https://supabase.com) (or use an existing one).
2. Go to **Storage** and create a bucket named exactly `client-documents`. Leave **Public bucket** turned **off** — the app reads files through short-lived signed URLs it generates on request, never a public link.
3. Create a second bucket named exactly `lead-documents`, also with **Public bucket** turned **off**. Same private/signed-URL model as `client-documents` — just kept separate so client and lead files never mix.
4. Create a third bucket named exactly `business-assets`. This one **should** have **Public bucket** turned **on** — the logo is rendered directly via its public URL on every page load.
5. Go to **Project Settings → API** and copy the **Project URL** and the **`service_role` secret key** (not the `anon` key — the service role key is what lets the server upload/delete/sign URLs). Treat it like a password: it has full admin access to the project.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to those values wherever `DATABASE_URL` is configured (Vercel env vars, and `.env.local` for local dev).

### 3. Passcode reset & team member invite emails (Resend)

The "Forgot passcode?" link on the login page, and inviting a team member from Settings → Team Members, both email a time-limited link that reuses the same `/login/reset-passcode` page/token (invite links just live longer — 7 days instead of 30 minutes). This step is optional — everything else in the app works without it, the link will just fail to send until it's configured. Without Resend configured, an owner can still fall back to "Set a passcode myself instead" when inviting a team member, which sets an initial passcode directly instead of emailing a setup link:

1. Create a free account at [resend.com](https://resend.com).
2. Go to **API Keys** and create a key. Set it as `RESEND_API_KEY`.
3. By default, emails send from Resend's shared `onboarding@resend.dev` address, which works immediately but has weaker deliverability and looks less trustworthy. When ready, verify your own sending domain in Resend and set `RESEND_FROM_EMAIL` to an address on it (e.g. `Verclara <noreply@yourdomain.com>`).

### 4. Stripe billing setup

Signup, trials, and subscription tiers run on Stripe Checkout + the Billing Portal — no card details ever touch this app's own servers. Every new workspace gets a 7-day free trial with a card collected upfront; discount codes are handled entirely by Stripe's native Coupons/Promotion Codes (no custom promo-code system in this app — Checkout is created with `allow_promotion_codes: true`, so the field just appears).

1. Create a [Stripe](https://stripe.com) account. Stay in **test mode** (toggle top-right of the Dashboard) until you're ready to accept real payments.
2. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_...` in test mode). Set it as `STRIPE_SECRET_KEY`.
3. Go to **Product catalog → Add product** and create 3 products — **Starter**, **Growth**, **Scale** — matching `src/lib/pricing.ts`. For each, add two recurring Prices: one **Monthly** and one **Annual**, with amounts matching the marketing pricing page exactly (as of writing: Starter $30/mo or $300/yr, Growth $50/mo or $500/yr, Scale $80/mo or $800/yr — check `src/lib/pricing.ts` for the current numbers, since it's the source of truth the app itself reads from). That's 6 Prices total. Copy each Price's id (`price_...`, not the Product id) into the matching env var:
   ```
   STRIPE_PRICE_STARTER_MONTHLY=price_...
   STRIPE_PRICE_STARTER_ANNUAL=price_...
   STRIPE_PRICE_GROWTH_MONTHLY=price_...
   STRIPE_PRICE_GROWTH_ANNUAL=price_...
   STRIPE_PRICE_SCALE_MONTHLY=price_...
   STRIPE_PRICE_SCALE_ANNUAL=price_...
   ```
4. Go to **Developers → Webhooks → Add endpoint**. Set the URL to `https://<your-app-domain>/api/webhooks/stripe` and subscribe to these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy the endpoint's **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`. This webhook is the *only* writer of `businesses.subscription_status`/`tier`/`billing_interval`/`trial_ends_at` (see `updateSubscriptionFromStripe` in `src/lib/data/businesses.ts`) — the app never trusts the client's word on subscription state.
5. For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) instead of a Dashboard webhook endpoint: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints a `whsec_...` you can use as a temporary local `STRIPE_WEBHOOK_SECRET`.
6. Create a **Coupon** (Product catalog → Coupons) and a **Promotion code** pointing at it whenever you want to hand out a discount for marketing purposes — no code changes needed, it just works at Checkout via the promo-code field.

A workspace with `subscription_status` of `null` (never completed Checkout) or `canceled` is redirected to Settings → Billing on every page until they start or restart a subscription — see `src/app/(app)/layout.tsx`. `trialing`, `active`, and `past_due` (mid-retry — Stripe's Smart Retries give a grace period before a subscription actually cancels) all keep full access. The platform admin's manual tier override (workspace detail page) still works independently of Stripe, for comped workspaces.

### 5. Set environment variables in Vercel

In the Vercel project's **Settings → Environment Variables**, set:

| Variable | Value |
|---|---|
| `APP_PASSCODE` | The shared passcode for accessing the app |
| `AUTH_SECRET` | (optional) random string, `openssl rand -hex 32` |
| `DATABASE_URL` | Your Neon/Vercel Postgres connection string (if you provisioned via Vercel Storage, this is set automatically as `POSTGRES_URL` — copy its value into `DATABASE_URL`, or rename the reference) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase project's `service_role` secret key |
| `RESEND_API_KEY` | (optional) Your Resend API key, enables "Forgot passcode?" emails |
| `RESEND_FROM_EMAIL` | (optional) Verified sender address once you have one, e.g. `Verclara <noreply@yourdomain.com>` |
| `PLATFORM_ADMIN_EMAILS` | (optional) Comma-separated business-owner emails allowed onto the platform admin portal at `/admin` — sign in normally, no separate credential |
| `MARKETING_HOSTS` | (optional) Comma-separated hostnames that should serve the public marketing site instead of the app, e.g. `www.verclara.io,verclara.io`. Defaults to those two hosts if unset |
| `NEXT_PUBLIC_APP_URL` | (optional) Origin the marketing site's "Sign in" / "Start for free" links point to, e.g. `https://app.verclara.io`. Defaults to same-origin (empty string) for local dev |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (test or live mode) — see "Stripe billing setup" above |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/webhooks/stripe` endpoint |
| `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_ANNUAL`, `STRIPE_PRICE_SCALE_MONTHLY`, `STRIPE_PRICE_SCALE_ANNUAL` | Stripe Price ids for the 3 tiers x 2 billing intervals |

### 6. Deploy

Push to your connected Git branch, or run `vercel --prod`. That's it — no build-time database access is required (every page under `/` is rendered on-demand, not statically prerendered).

### 7. (Optional) Automate monthly recurring invoices

Recurring clients get their current month's invoice row created automatically the next time the dashboard or their client page is loaded — so in practice a new month's invoice always appears the first time you open the app that month. If you'd rather have it happen exactly on the 1st regardless of whether anyone opens the app, add a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) that hits a route calling `ensureRecurringInvoicesForAllActiveClients()` (see `src/lib/data/clients.ts`) — not included by default since the lazy approach covers the actual use case.

## Access model

There are no user accounts. `src/proxy.ts` checks every request (except `/login*` and static assets) for a signed session cookie; `/login` posts an email + passcode to a server action that validates the email against the Settings → Profile email and the passcode against `APP_PASSCODE` (or the Settings-managed passcode), then sets an HTTP-only cookie. Sign out clears the cookie via `POST /api/logout`. `/login/forgot` and `/login/reset-passcode` implement a self-service passcode reset over email (see "Passcode reset emails" above) for when the passcode is forgotten.

**Platform admin** (`/admin`, `src/lib/data/admin.ts`): a workspace owner whose email is listed in `PLATFORM_ADMIN_EMAILS` sees an "Admin" nav link and can view every workspace on the platform plus suspend/reactivate one — see `isPlatformAdmin`/`requirePlatformAdmin` in `src/lib/currentUser.ts`. No separate credential; it's a check layered on top of that account's normal login.

**Billing gate**: `src/app/(app)/layout.tsx` redirects the whole workspace to Settings → Billing whenever `businesses.subscription_status` is `null` (Checkout never completed) or `canceled` — every other status (`trialing`, `active`, `past_due`) keeps full access. A team member landing there sees a read-only "contact your workspace owner" message instead of the plan picker; `src/proxy.ts`'s owner-only `/settings/*` block carries a specific exception for `/settings/billing` so they can actually reach it instead of bouncing to `/`. See "Stripe billing setup" above.

## Marketing site

The public marketing site (homepage, About, Pricing, FAQ, Contact) lives under `src/app/site/` and is served from the same Next.js deployment as the app, routed by hostname: `src/proxy.ts` rewrites any request whose `Host` header matches `MARKETING_HOSTS` (default `www.verclara.io,verclara.io`) into `/site/*`, guarded so `/site` can't be reached directly on a non-marketing host. Every other hostname (including `localhost` and the app's own subdomain) continues to serve the app unchanged. The marketing site's "Sign in" / "Start for free" links point at `NEXT_PUBLIC_APP_URL`.

## Project structure

```
migrations/001_init.sql        the original DB schema
migrations/002_feature_update.sql  breaking schema update (invoices/follow-ups/meeting notes lists, unified todos, company-name-primary)
migrations/003_work_type_update.sql  breaking change: new work_type categories (fractional exec / marketing services)
migrations/004_documents.sql    adds the documents table (client file upload metadata)
migrations/005_hour_cost_tracker.sql  adds team_members/time_entries/fixed_costs + clients.budgeted_hours
migrations/006_work_categories.sql  adds work_categories + time_entries.category_id
migrations/007_settings.sql    adds the Settings module's tables (profile, business entities, app settings)
migrations/008_editable_categories.sql  converts work_type/lead_source/task_type enums into editable lookup tables
migrations/009_todo_priority.sql  adds todos.priority (task_priority enum)
migrations/010_profile_timezone.sql  adds profile.timezone
migrations/011_client_lead_color.sql  adds clients.color / leads.color
migrations/012_business_logo.sql  adds app_settings.logo_path
migrations/013_passcode_reset.sql  adds app_settings passcode reset token columns
migrations/014_team_member_access.sql  adds team member logins + client_access + todo assignment columns
migrations/015_followup_assignment.sql  adds follow_ups.assigned_to_team_member_id
migrations/016_lead_documents.sql  extends documents to leads (nullable client_id + new lead_id column)
migrations/017_meeting_note_agenda.sql  adds meeting_notes.agenda + action_items (notes becomes optional)
migrations/018_businesses.sql  Stage 1 of multi-tenant conversion — adds businesses + account_emails tables, business_id on every tenant-scoped table, drops profile/app_settings. IMPORTANT: requires app_settings.passcode_hash to already be set (Settings > Passcode) before running — see the migration's own header comment. Schema-only: query-level business_id scoping is a later stage, not yet enforced.
migrations/019_drop_business_id_defaults.sql  drops the temporary business_id column defaults 018 added
migrations/020_business_suspension.sql  adds businesses.suspended_at (platform admin suspend/reactivate)
migrations/021_invoice_hourly.sql  adds invoices.invoice_type/hours/hourly_rate/description
migrations/022_owner_team_member_link.sql  adds businesses.owner_team_member_id
migrations/023_business_onboarding.sql  adds businesses.onboarding_dismissed_at (first-login welcome popup)
migrations/024_meeting_note_title.sql  adds meeting_notes.title
migrations/025_drop_billing_entities.sql  drops the unused billing_entities table
migrations/026_meeting_note_action_items.sql  adds todos.meeting_note_id (action items quick-added from a meeting note become linked to-dos)
migrations/027_feedback.sql  adds the feedback table (Feedback page + admin Feedback tab)
migrations/028_task_owned_by.sql  adds todos.owned_by (TEAM/EXTERNAL — separates client/lead action items from the team's own to-do board)
migrations/029_meeting_scheduling.sql  adds meeting_notes.start_time/duration_minutes/location — lets a meeting note be scheduled ahead of time, not just logged after
migrations/030_calendar_feeds.sql      adds calendar_feeds + calendar_feed_events — one-way, self-service ICS import of a person's own existing calendar onto the shared Audax calendar (top of /calendar, "Connect your calendar"; paste your calendar's "secret address in iCal format" from Google/Outlook/Apple). Each person can only see, sync, or remove their own connected calendar, never a teammate's. Read-only, no OAuth: fetched and re-parsed lazily whenever someone opens /calendar and their feed hasn't synced in the last 30 minutes (same lazy pattern as recurring invoices below), or on demand via "Sync now"
migrations/031_business_tier.sql       adds businesses.tier ('starter'/'growth'/'scale', default 'scale') — the entitlement layer (src/lib/entitlements.ts). Nothing in the product is actually tier-gated yet; this is the on/off switch a future paid feature (e.g. Stripe payment collection on invoices) would flip. Manually overridable per workspace from the platform admin portal (workspace detail page) ahead of any real billing integration
migrations/032_notifications.sql       adds the notifications table — in-app "someone assigned you a task/follow-up" events (bell icon, top of every app page). Inserted synchronously by the assignment actions themselves (createTask/updateTask in src/lib/actions/tasks.ts, addFollowUp/setFollowUpAssignee in src/lib/actions/followups.ts) — there's no cron/background job in this app, so overdue/due-today nudges are computed live at read time instead of stored (see getNotificationSnapshot in src/lib/data/notifications.ts), never persisted
migrations/033_meeting_note_email_log.sql  adds meeting_notes.last_emailed_to/last_emailed_at — stamped when a meeting note's branded PDF is emailed to its client/lead (see sendMeetingNoteEmail in src/lib/actions/meetingnotes.ts), so the note UI can show who it was last sent to
migrations/034_note_mentions.sql       adds client_notes.author_team_member_id/lead_notes.author_team_member_id (who wrote each "Activity & notes" entry) and a MENTION notification type — @mentioning a team member inline in a note (src/components/MentionTextarea.tsx) fires a "mentioned you" notification (src/lib/mentions.ts, notifyMentionedTeamMembers in the client/lead actions files)
migrations/035_invoice_work_type.sql   adds invoices.work_type_id/work_type_other — set once at creation (defaulted from the client's current work type, see addInvoice in app/(app)/clients/actions.ts) and never rewritten on edit, so revenue-by-type-of-work reporting (src/lib/data/revenue.ts, the Revenue Tracking page) stays historically accurate even if a client's work type later changes
migrations/036_meeting_note_timezone.sql  adds meeting_notes.timezone — the IANA zone a meeting's start_time is in, purely descriptive (never used for conversion), shown next to the time in the meeting note forms and the branded PDF export
migrations/037_lead_owner.sql          adds leads.lead_owner_team_member_id — who's responsible for a lead, separate from who a follow-up/to-do on it is assigned to. Nullable ("Unassigned"); set from the Lead Owner field on the new-lead form and the lead detail page's Core Information panel, shown as a tag on every lead list row/card, and filterable (multi-select, plus an "Unassigned" pill) from the Leads page
migrations/038_team_member_color.sql   adds team_members.color — same optional accent-color palette clients/leads already have (see migration 011), set via the swatch picker next to each row in Settings → Team Members. Used to color the "Lead Owner" tag on the Leads list per-owner instead of every tag rendering identically; falls back to the existing hash-of-name color when unset
migrations/039_owner_time_entries.sql  drops the NOT NULL constraint on time_entries.team_member_id. Every business still gets one team_members row auto-created and linked as the owner's own identity at signup (businesses.owner_team_member_id — see migration 022), used to hold their default hourly rate and tag color (edited from Settings → Profile, not listed on the Team Members page) and to let them be picked as a Lead Owner — but it's no longer required for the owner to log their own time entries, which now use NULL like every other "who is this for" column in the app (todos, follow_ups, notes, calendar_feeds) already does. See ensureOwnerTeamMember in src/lib/data/teamMembers.ts and the "Me" option in LogTimeEntryButton.tsx
migrations/040_partners.sql       adds the Partnerships feature, part 1: the partners table (company/contact info, free-text commission terms, active flag, accent color, notes), leads.referred_by_partner_id (nullable — a referral is just a lead tagged with which partner sent it, kept separate from leads.source_id, the generic marketing-channel category, so it inherits the full pipeline/kanban/win-rate tracking), and partner_commissions (money owed OUT to a partner — the mirror image of invoices, which model money coming IN from a client; referred_lead_id/referred_client_id are both nullable since not every commission is tied to one referral, e.g. a flat retainer)
migrations/041_partner_owner.sql  adds the Partnerships feature, part 2: extends the existing polymorphic client_id/lead_id "owner" pattern on meeting_notes, follow_ups, documents, and todos with a third nullable partner_id, so meetings/tasks/notes/documents can be attached directly to a partner (not tied to any one referral) — precedented by migration 016, which added lead_id to documents the same way. See src/lib/data/partners.ts, src/app/(app)/partners/. Owner-only feature end to end (gated in src/proxy.ts and the sidebar nav, like Invoices/Finance) — partner-owned to-dos/follow-ups/meeting-notes are also excluded by default from the general team-visible boards (see the includePartnerOwned escape hatch in TaskFilters, used only by the full data export)
migrations/042_stripe_billing.sql  adds businesses.stripe_customer_id/stripe_subscription_id/subscription_status/trial_ends_at/billing_interval — real Stripe-backed subscriptions replacing the free-for-everyone early-access period. Existing businesses are backfilled to subscription_status='active' so nothing already onboarded gets locked out. subscription_status is written exclusively by the webhook handler (src/app/api/webhooks/stripe/route.ts) — never trust it from a client request. See "Stripe billing setup" below
migrations/043_prospects.sql       adds the Prospects feature: a lean pre-lead stage ahead of the existing prospect → lead → client funnel. prospects (name/email/phone/business name/title/industry, a free-text-enum status, notes, owner_team_member_id — same simple ownership tag as leads.lead_owner_team_member_id, not the assign.ts task-assignment scheme) and prospect_activity (a call/email/meeting/note log per prospect) are new tables; follow_ups gets a fourth nullable prospect_id alongside client_id/lead_id/partner_id, with the owner check constraint rewritten to require exactly one of the four. Prospects have no detail page — see src/app/(app)/prospects/, which opens a drawer instead; "Convert to lead" creates a lead prefilled from the prospect's data and copies its activity log in as lead notes. Unrestricted for every team member, like leads (no per-team-member access list, unlike clients/partners)
migrations/044_tracker_billing_rework.sql  reworks the Hour & Cost Tracker's billing model. time_entries.rate is no longer required — hours + who + date is enough to log a time entry, and a $ rate only matters once that time is actually going to be billed. clients.hourly_rate is a new field (separate from clients.rate, a monthly-fee/reference-total figure) — what to bill a client per hour, defaulted onto a generated hourly invoice. time_entries.invoice_id (nullable, ON DELETE SET NULL) links a billed time entry to the invoice it went out on — "unbilled hours" is just billable time entries with no invoice_id. See src/lib/data/costEntries.ts (cost is always hours × the logging team member's default_hourly_rate, computed independently of the entry's own optional billing rate; profit is always totalInvoiced − totalCost, one shared formula used by the Tracker page, the client/lead Finance tab, and the CSV export) and the "Unbilled hours" panel on a client's Finance tab (src/components/tracker/UnbilledHoursPanel.tsx, src/app/(app)/clients/actions.ts's generateHourlyInvoiceFromUnbilledHours) for bundling billable hours into a new hourly invoice
migrations/045_hot_leads_prospects.sql  adds leads.hot and prospects.hot (boolean, default false) — flags a lead/prospect as needing extra focus, toggled via a flame icon on each list row/card (src/components/ui/HotToggle.tsx). Hot ones sort to the top of the Leads/Prospects list, ahead of the existing sort order (see listLeads in src/lib/data/leads.ts, listProspects in src/lib/data/prospects.ts) — not a replacement for the existing sort, just a priority layer on top of it
src/proxy.ts                   passcode gate
src/lib/db.ts                  Neon client
src/lib/storage.ts             Supabase Storage client (private bucket for client documents, public bucket for the business logo)
src/lib/email.ts                Resend wrapper for passcode reset + team member invite emails
src/lib/data/                  query functions, grouped by domain (clients, leads, todos, followups, meetingnotes, documents, costEntries, teamMembers, workCategories, dashboard)
src/lib/actions/               shared server actions used across the clients/leads/todos pages (tasks, followups, meetingnotes)
src/app/login/                 passcode gate UI + server action (plus /login/forgot and /login/reset-passcode for passcode reset)
src/app/(app)/                 everything behind the gate: dashboard, clients, leads, meeting-notes, todos
src/components/ui/             design-system primitives (Button, Badge, Card, Field, ...)
```
