
-- Roles
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Profiles extension
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists location text;

-- Stories: moderation + media
alter table public.stories add column if not exists media_url text;
alter table public.stories add column if not exists status text not null default 'approved';
alter table public.stories add constraint stories_status_check
  check (status in ('pending','approved','removed'));

-- Replace public read policy to respect moderation
drop policy if exists "Published stories viewable by everyone" on public.stories;
create policy "Approved stories viewable by everyone" on public.stories
  for select to public using (
    (published = true and status = 'approved')
    or auth.uid() = author_id
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'moderator')
  );

create policy "Mods can update any story" on public.stories
  for update to authenticated using (
    public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')
  ) with check (true);

create policy "Admins can delete any story" on public.stories
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Reports
create table public.story_reports (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  reporter_id uuid,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);
grant select, insert on public.story_reports to authenticated;
grant select on public.story_reports to anon;
grant all on public.story_reports to service_role;
alter table public.story_reports enable row level security;

create policy "Anyone can submit a report" on public.story_reports
  for insert to public with check (true);
create policy "Reporters see own reports" on public.story_reports
  for select to authenticated using (auth.uid() = reporter_id);
create policy "Mods see all reports" on public.story_reports
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')
  );
create policy "Mods update reports" on public.story_reports
  for update to authenticated using (
    public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')
  ) with check (true);

-- Juneteenth reminder sign-ups
create table public.juneteenth_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  user_id uuid,
  created_at timestamptz not null default now()
);
grant insert on public.juneteenth_subscribers to anon, authenticated;
grant select on public.juneteenth_subscribers to authenticated;
grant all on public.juneteenth_subscribers to service_role;
alter table public.juneteenth_subscribers enable row level security;

create policy "Anyone can subscribe" on public.juneteenth_subscribers
  for insert to public with check (true);
create policy "Subscriber sees own row" on public.juneteenth_subscribers
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins see all subscribers" on public.juneteenth_subscribers
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
