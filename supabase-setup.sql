-- Запусти этот SQL в Supabase → SQL Editor → New query → Run.
-- Он подходит и для новой таблицы, и для уже созданной таблицы tasks.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_date date not null,
  task_time text,
  category text not null,
  completed boolean not null default false,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists completed boolean not null default false;
alter table public.tasks add column if not exists sort_order bigint not null default 0;
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

create table if not exists public.pinned_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_time text,
  category text not null,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pinned_tasks add column if not exists sort_order bigint not null default 0;
alter table public.pinned_tasks alter column sort_order type bigint using sort_order::bigint;

create table if not exists public.pinned_completion (
  id uuid primary key default gen_random_uuid(),
  task_date date not null,
  pinned_task_id uuid not null references public.pinned_tasks(id) on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(task_date, pinned_task_id)
);

alter table public.tasks enable row level security;
alter table public.pinned_tasks enable row level security;
alter table public.pinned_completion enable row level security;

drop policy if exists "Allow public read tasks" on public.tasks;
drop policy if exists "Allow public insert tasks" on public.tasks;
drop policy if exists "Allow public update tasks" on public.tasks;
drop policy if exists "Allow public delete tasks" on public.tasks;

create policy "Allow public read tasks" on public.tasks for select to anon using (true);
create policy "Allow public insert tasks" on public.tasks for insert to anon with check (true);
create policy "Allow public update tasks" on public.tasks for update to anon using (true) with check (true);
create policy "Allow public delete tasks" on public.tasks for delete to anon using (true);

drop policy if exists "Allow public read pinned tasks" on public.pinned_tasks;
drop policy if exists "Allow public insert pinned tasks" on public.pinned_tasks;
drop policy if exists "Allow public update pinned tasks" on public.pinned_tasks;
drop policy if exists "Allow public delete pinned tasks" on public.pinned_tasks;

create policy "Allow public read pinned tasks" on public.pinned_tasks for select to anon using (true);
create policy "Allow public insert pinned tasks" on public.pinned_tasks for insert to anon with check (true);
create policy "Allow public update pinned tasks" on public.pinned_tasks for update to anon using (true) with check (true);
create policy "Allow public delete pinned tasks" on public.pinned_tasks for delete to anon using (true);

drop policy if exists "Allow public read pinned completion" on public.pinned_completion;
drop policy if exists "Allow public insert pinned completion" on public.pinned_completion;
drop policy if exists "Allow public update pinned completion" on public.pinned_completion;
drop policy if exists "Allow public delete pinned completion" on public.pinned_completion;

create policy "Allow public read pinned completion" on public.pinned_completion for select to anon using (true);
create policy "Allow public insert pinned completion" on public.pinned_completion for insert to anon with check (true);
create policy "Allow public update pinned completion" on public.pinned_completion for update to anon using (true) with check (true);
create policy "Allow public delete pinned completion" on public.pinned_completion for delete to anon using (true);
