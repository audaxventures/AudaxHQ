-- Replaces the work_type options with the firm's current service lines.
-- Existing values are remapped to the closest new category:
--   CUSTOM_SOFTWARE, WEB_APP, MOBILE_APP, INTERNAL_TOOL, INTEGRATION_API -> SOFTWARE_DEVELOPMENT
--   WEBSITE -> WEBSITE_DEVELOPMENT
--   OTHER -> OTHER (work_type_other is preserved as-is)

create type client_work_type as enum (
  'SOFTWARE_DEVELOPMENT',
  'FRACTIONAL_CAIO',
  'FRACTIONAL_COO',
  'FRACTIONAL_CMO',
  'MARKETING_SERVICES',
  'WEBSITE_DEVELOPMENT',
  'ADVISORY',
  'OTHER'
);

alter table clients add column work_type_v2 client_work_type;
update clients set work_type_v2 = case work_type
  when 'CUSTOM_SOFTWARE' then 'SOFTWARE_DEVELOPMENT'
  when 'WEB_APP' then 'SOFTWARE_DEVELOPMENT'
  when 'MOBILE_APP' then 'SOFTWARE_DEVELOPMENT'
  when 'INTERNAL_TOOL' then 'SOFTWARE_DEVELOPMENT'
  when 'INTEGRATION_API' then 'SOFTWARE_DEVELOPMENT'
  when 'WEBSITE' then 'WEBSITE_DEVELOPMENT'
  when 'OTHER' then 'OTHER'
  else null
end::client_work_type;
alter table clients drop column work_type;
alter table clients rename column work_type_v2 to work_type;

alter table leads add column work_type_v2 client_work_type;
update leads set work_type_v2 = case work_type
  when 'CUSTOM_SOFTWARE' then 'SOFTWARE_DEVELOPMENT'
  when 'WEB_APP' then 'SOFTWARE_DEVELOPMENT'
  when 'MOBILE_APP' then 'SOFTWARE_DEVELOPMENT'
  when 'INTERNAL_TOOL' then 'SOFTWARE_DEVELOPMENT'
  when 'INTEGRATION_API' then 'SOFTWARE_DEVELOPMENT'
  when 'WEBSITE' then 'WEBSITE_DEVELOPMENT'
  when 'OTHER' then 'OTHER'
  else null
end::client_work_type;
alter table leads drop column work_type;
alter table leads rename column work_type_v2 to work_type;

drop type work_type;
