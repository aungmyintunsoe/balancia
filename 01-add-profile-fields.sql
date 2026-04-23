-- SQL to add missing profile fields for the employee questionnaire
alter table public.profiles
  add column if not exists bio text null,
  add column if not exists mbti character varying(4) null,
  add column if not exists bandwidth_hours numeric(5, 2) null default 40,
  add column if not exists career_aspiration text null;
