-- Verclara — lets the owner grant individual team members access to the
-- Partners section, which is owner-only by default (referral/commission
-- data). Unlike client_access (a per-client checklist), this is a single
-- on/off flag — Partners has no per-record scoping concept like clients do,
-- the ask is "can this team member see Partners at all." A granted team
-- member gets the same read/write access to partners as the owner (add
-- notes, edit commissions, etc.) — the only thing that stays owner-only is
-- creating a brand-new partner. See src/lib/currentUser.ts
-- (requirePartnersFeatureAccess, requirePartnerAccess) and the "Partners
-- access" toggle in Settings > Team Members
-- (src/components/settings/TeamMembersPanel.tsx).
--
-- Not breaking, purely additive — defaults to false, so nothing changes
-- for existing team members until the owner explicitly grants access.
--
-- Run once: psql "$DATABASE_URL" -f migrations/046_team_member_partners_access.sql

alter table team_members add column has_partners_access boolean not null default false;
