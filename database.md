profiles-
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  avatar_url text null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


organizations-
create table public.organizations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  join_code text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  created_by uuid null default auth.uid (),
  constraint organizations_pkey primary key (id),
  constraint organizations_join_code_key unique (join_code)
) TABLESPACE pg_default;

organization_members-
create table public.organization_members (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  org_id uuid not null,
  role text not null,
  joined_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint organization_members_pkey primary key (id),
  constraint organization_members_user_id_org_id_key unique (user_id, org_id),
  constraint organization_members_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint organization_members_role_check check (
    (
      role = any (array['admin'::text, 'employee'::text])
    )
  )
) TABLESPACE pg_default;

projects-
create table public.projects (
  id uuid not null default extensions.uuid_generate_v4 (),
  org_id uuid null,
  vague_goal_text text not null,
  status character varying(50) null default 'analyzing'::character varying,
  created_at timestamp with time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

structured_goals-
create table public.structured_goals (
  id uuid not null default extensions.uuid_generate_v4 (),
  project_id uuid null,
  org_id uuid null,
  description text not null,
  constraint structured_goals_pkey primary key (id),
  constraint structured_goals_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint structured_goals_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

tasks-
create table public.tasks (
  id uuid not null default extensions.uuid_generate_v4 (),
  goal_id uuid null,
  org_id uuid null,
  description text not null,
  estimated_hours numeric(5, 2) null,
  assigned_to uuid null,
  status character varying(50) null default 'pending'::character varying,
  constraint tasks_pkey primary key (id),
  constraint tasks_assigned_to_fkey foreign KEY (assigned_to) references profiles (id) on delete set null,
  constraint tasks_goal_id_fkey foreign KEY (goal_id) references structured_goals (id) on delete CASCADE,
  constraint tasks_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;