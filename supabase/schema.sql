create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  participant_code text not null,
  test_type text not null check (test_type in ('sequence', 'cubes', 'cubes-teen', 'puzzle', 'adult-battery')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  current_item_index integer not null default 0,
  total_items integer not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  item_index integer not null,
  started_at timestamptz,
  answered_at timestamptz,
  elapsed_ms integer,
  attempts integer not null default 0,
  is_correct boolean,
  answer_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, item_index)
);

create index if not exists sessions_token_idx on public.sessions (token);
create index if not exists session_items_session_idx on public.session_items (session_id, item_index);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

drop trigger if exists session_items_set_updated_at on public.session_items;
create trigger session_items_set_updated_at
before update on public.session_items
for each row execute function public.set_updated_at();
