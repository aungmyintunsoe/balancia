-- HACKATHON OPEN MODE (authenticated users)
-- Purpose: maximize app functionality quickly with minimal RLS friction.
-- Security tradeoff: any authenticated user can read/write these tables.
-- Use only for hackathon/demo environments.

begin;

-- Keep RLS enabled, but policies are fully permissive for authenticated users.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.structured_goals enable row level security;
alter table public.tasks enable row level security;
alter table public.employee_skills enable row level security;

-- Drop existing policies first to avoid conflicts and recursion.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'organizations',
        'organization_members',
        'projects',
        'structured_goals',
        'tasks',
        'employee_skills'
      )
  loop
    execute format('drop policy if exists %I on %I.%I;', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- One open policy per table for all operations.
create policy open_profiles_all
on public.profiles
for all
to authenticated
using (true)
with check (true);

create policy open_organizations_all
on public.organizations
for all
to authenticated
using (true)
with check (true);

create policy open_organization_members_all
on public.organization_members
for all
to authenticated
using (true)
with check (true);

create policy open_projects_all
on public.projects
for all
to authenticated
using (true)
with check (true);

create policy open_structured_goals_all
on public.structured_goals
for all
to authenticated
using (true)
with check (true);

create policy open_tasks_all
on public.tasks
for all
to authenticated
using (true)
with check (true);

create policy open_employee_skills_all
on public.employee_skills
for all
to authenticated
using (true)
with check (true);

commit;
