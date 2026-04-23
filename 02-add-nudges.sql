create table if not exists public.system_nudges (
    id uuid default extensions.uuid_generate_v4() primary key,
    org_id uuid references public.organizations(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    message text not null,
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

alter table public.system_nudges enable row level security;

create policy nudges_select on public.system_nudges 
for select to authenticated 
using (user_id = auth.uid() or public.is_org_admin(org_id));

create policy nudges_insert on public.system_nudges 
for insert to authenticated 
with check (public.is_org_admin(org_id));

create policy nudges_update on public.system_nudges 
for update to authenticated 
using (user_id = auth.uid() or public.is_org_admin(org_id));
