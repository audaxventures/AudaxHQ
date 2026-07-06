-- Audax HQ — lets the operator upload a business logo from Settings that
-- replaces the static /logo.png shown top-right on every app screen.
-- Stored as a path into a Supabase Storage bucket (must be created as a
-- PUBLIC bucket named "business-assets" — unlike the private
-- "client-documents" bucket, this logo needs to be directly renderable in
-- an <img> tag on every page load without a signed URL round trip).
--
-- Run once: psql "$DATABASE_URL" -f migrations/012_business_logo.sql

alter table app_settings add column logo_path text;
