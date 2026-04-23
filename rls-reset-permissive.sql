-- Balancia: reset and recreate permissive RLS policies
-- Use in Supabase SQL editor.
-- This keeps RLS ON, but allows app flows to work with broad org-scoped access.

begin;

-- 1) Enable RLS on all app tables.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.structured_goals enable row level security;
alter table public.tasks enable row level security;
alter table public.employee_skills enable row level security;

-- 2) Drop all existing policies on app tables.
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

-- 3) Helper functions used by policies.
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

-- 4) organizations
create policy org_select_if_member
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

create policy org_insert_authenticated
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

create policy org_update_if_admin
on public.organizations
for update
to authenticated
using (public.is_org_admin(id))
with check (public.is_org_admin(id));

create policy org_delete_if_admin
on public.organizations
for delete
to authenticated
using (public.is_org_admin(id));

-- 5) organization_members
-- IMPORTANT: keep this non-recursive.
-- Using organization_members in its own SELECT policy causes 42P17 recursion.
create policy members_select_self
on public.organization_members
for select
to authenticated
using (user_id = auth.uid());

create policy members_insert_self_or_admin
on public.organization_members
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy members_update_if_admin
on public.organization_members
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy members_delete_if_admin
on public.organization_members
for delete
to authenticated
using (user_id = auth.uid());

-- 6) projects
create policy projects_select_if_member
on public.projects
for select
to authenticated
using (public.is_org_member(org_id));

create policy projects_insert_if_admin
on public.projects
for insert
to authenticated
with check (public.is_org_admin(org_id));

create policy projects_update_if_admin
on public.projects
for update
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy projects_delete_if_admin
on public.projects
for delete
to authenticated
using (public.is_org_admin(org_id));

-- 7) structured_goals
create policy goals_select_if_member
on public.structured_goals
for select
to authenticated
using (public.is_org_member(org_id));

create policy goals_insert_if_admin
on public.structured_goals
for insert
to authenticated
with check (public.is_org_admin(org_id));

create policy goals_update_if_admin
on public.structured_goals
for update
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy goals_delete_if_admin
on public.structured_goals
for delete
to authenticated
using (public.is_org_admin(org_id));

-- 8) tasks
create policy tasks_select_if_member
on public.tasks
for select
to authenticated
using (public.is_org_member(org_id));

create policy tasks_insert_if_admin
on public.tasks
for insert
to authenticated
with check (public.is_org_admin(org_id));

-- Admins can update any task in org; assignees can update their own tasks.
create policy tasks_update_if_admin_or_assignee
on public.tasks
for update
to authenticated
using (
  public.is_org_admin(org_id)
  or assigned_to = auth.uid()
)
with check (
  public.is_org_admin(org_id)
  or assigned_to = auth.uid()
);

create policy tasks_delete_if_admin
on public.tasks
for delete
to authenticated
using (public.is_org_admin(org_id));

-- 9) profiles
create policy profiles_select_self_or_same_org
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.org_id = me.org_id
    where me.user_id = auth.uid()
      and them.user_id = profiles.id
  )
);

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 10) employee_skills
create policy skills_select_self_or_same_org
on public.employee_skills
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.org_id = me.org_id
    where me.user_id = auth.uid()
      and them.user_id = employee_skills.user_id
  )
);

create policy skills_insert_self_or_admin
on public.employee_skills
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members admin_members
    join public.organization_members target_members
      on target_members.org_id = admin_members.org_id
    where admin_members.user_id = auth.uid()
      and admin_members.role = 'admin'
      and target_members.user_id = employee_skills.user_id
  )
);

create policy skills_update_self_or_admin
on public.employee_skills
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members admin_members
    join public.organization_members target_members
      on target_members.org_id = admin_members.org_id
    where admin_members.user_id = auth.uid()
      and admin_members.role = 'admin'
      and target_members.user_id = employee_skills.user_id
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members admin_members
    join public.organization_members target_members
      on target_members.org_id = admin_members.org_id
    where admin_members.user_id = auth.uid()
      and admin_members.role = 'admin'
      and target_members.user_id = employee_skills.user_id
  )
);

create policy skills_delete_self_or_admin
on public.employee_skills
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members admin_members
    join public.organization_members target_members
      on target_members.org_id = admin_members.org_id
    where admin_members.user_id = auth.uid()
      and admin_members.role = 'admin'
      and target_members.user_id = employee_skills.user_id
  )
);

commit;
